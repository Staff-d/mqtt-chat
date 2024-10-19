import { createListenerMiddleware } from "@reduxjs/toolkit"
import type { MqttClient } from "mqtt"
import mqtt from "mqtt"
import {
  clearProtocolError,
  connect,
  connected,
  disconnected,
  messageReceived,
  mqttPublish, protocolError,
  subscribeTopic
} from "@/features/mqtt-chat/mqttChatSlice"
import type { AppDispatch, RootState } from "@/app/store"
import type { MQTTCredentials } from "@/features/mqtt-chat/messageTypes"

export class MqttClientWrapper {
  private client: MqttClient | undefined = undefined

  async connect(
    credentials: MQTTCredentials,
    handler: (topic: string, message: Buffer) => void,
  ) {
    if (this.client) {
      return
    }

    this.client = mqtt.connect("ws://localhost:8080", {
      ...credentials,
      clientId: `mqtt-chat-client-${credentials.username}`,
      clean: false,
      manualConnect: true,
    })

    this.client.on("message", handler)
    const connectionPromise = new Promise<void>(
      (resolve,reject) =>  {
        this.client!.on('connect', () => resolve())
        this.client!.on("error", error => {
          reject(error)
        })
      }
    )

    // this manual connect() call is a workaround for the limitations of
    // connectAsync. connectAsync creates and connect the mqtt client at the same
    // time, but to be able to receive and process the stored QOS1/2 messages,
    // that are send by the broker as soon as we connect, we need to define
    // as message callback first. This is not possible with connectAsync.
    this.client.connect()
    try{
      await connectionPromise
    }
    catch (e) {
      // for some reason we need to force-disconnect the
      // client before throwing the error, as otherwise
      // the client will continuously try to reconnect even
      // if incorrect credentials were entered
      await this.client.endAsync(true)
      this.client = undefined
      throw e
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.endAsync()
      this.client = undefined
    }
  }

  async subscribe(topic: string, subscribeQos: 0|1|2) {
    if (this.client) {
      console.log("subscribing to", topic)
      await this.client.subscribeAsync({
        [topic] : {
          qos: subscribeQos
        }
      })
    }
  }

  async publish(topic: string, message: string) {
    if (this.client) {
      await this.client.publishAsync(topic, message)
    }
  }
}

export const MqttChatMiddleware = createListenerMiddleware({
  extra: { client: new MqttClientWrapper() },
})

const typedStartListening = MqttChatMiddleware.startListening.withTypes<
  RootState,
  AppDispatch,
  { client: MqttClientWrapper }
>()

typedStartListening({
  actionCreator: connect,
  effect: async (action, api) => {
    const { client } = api.extra

    const handler = (topic: string, message: Buffer) => {
      const messageString = message.toString("utf-8")
      console.log(topic, messageString)

      api.dispatch(messageReceived(topic, messageString))
    }

    try {
      await client.connect(action.payload.credentials, handler)
    } catch (e) {

      console.log(e)
      let errorMessage = 'Unknown Error'
      if(e instanceof mqtt.ErrorWithReasonCode) {
        errorMessage = e.message
      }

      api.dispatch(disconnected())
      api.dispatch(protocolError(errorMessage))
      return
    }
    api.dispatch(clearProtocolError())
    api.dispatch(connected())
  },
})

typedStartListening({
  actionCreator: subscribeTopic,
  effect: async (action, api) => {
    const { client } = api.extra
    const subscribeQos = api.getState().mqttChat.settings?.subscribeQos2 ? 2 : 0

    await client.subscribe(action.payload,subscribeQos)
  },
})

typedStartListening({
  actionCreator: mqttPublish,
  effect: async (action, api) => {
    const { client } = api.extra

    console.log("publishing", action.payload)
    await client.publish(action.payload.topic, action.payload.payload)
  },
})

// typedStartListening
