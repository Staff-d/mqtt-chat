import { createListenerMiddleware } from "@reduxjs/toolkit"
import type { IClientOptions, MqttClient } from "mqtt"
import { v4 as uuidv4 } from "uuid"
import mqtt from "mqtt"
import {
  clearProtocolError,
  connect,
  connected,
  disconnect,
  disconnected,
  mqttMessageReceived,
  mqttPublish,
  protocolError,
  mqttSubscribe,
  mqttPacketReceived,
} from "@/features/mqtt-chat/mqttChatSlice"
import type { AppDispatch, RootState } from "@/app/store"
import type {
  MQTTCredentials,
  RawMqttPacket,
  WireStatusMessage,
} from "@/features/mqtt-chat/messageTypes"
import { DateTime } from "luxon"
import { Buffer } from "buffer"

export class MqttClientWrapper {
  private client: MqttClient | undefined = undefined

  async connect(
    brokerUrl: string,
    credentials: MQTTCredentials,
    messageHandler: (topic: string, message: Buffer) => void,
    rawPacketHandler: (packet: RawMqttPacket) => void,
    will?: IClientOptions["will"],
  ) {
    if (this.client) {
      return
    }

    this.client = mqtt.connect(brokerUrl, {
      ...credentials,
      clientId: `mqtt-chat-client-${credentials.username}`,
      clean: false,
      manualConnect: true,
      will,
    })

    this.client.on("message", messageHandler)
    this.client.on("packetreceive", packet => {
      rawPacketHandler({
        packet,
        direction: "inbound",
        receivedAt: DateTime.now().toISO(),
        receptionId: uuidv4(),
      })
    })
    this.client.on("packetsend", packet => {
      rawPacketHandler({
        packet,
        direction: "outbound",
        receivedAt: DateTime.now().toISO(),
        receptionId: uuidv4(),
      })
    })
    const connectionPromise = new Promise<void>((resolve, reject) => {
      this.client!.on("connect", () => resolve())
      this.client!.on("error", error => {
        reject(error)
      })
    })

    // this manual connect() call is a workaround for the limitations of
    // connectAsync. connectAsync creates and connect the mqtt client at the same
    // time, but to be able to receive and process the stored QOS1/2 messages,
    // that are send by the broker as soon as we connect, we need to define
    // a message callback first. This is not possible with connectAsync.
    this.client.connect()
    try {
      await connectionPromise
    } catch (e) {
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
    if (!this.client) {
      return
    }

    await this.client.endAsync()
    this.client = undefined
  }

  async subscribe(topic: string, subscribeQos: 0 | 1 | 2) {
    if (this.client) {
      await this.client.subscribeAsync({
        [topic]: {
          qos: subscribeQos,
        },
      })
    }
  }

  async publish(
    topic: string,
    message: string,
    options?: { qos?: 0 | 1 | 2; retain?: boolean },
  ) {
    if (this.client) {
      await this.client.publishAsync(topic, message, {
        qos: options?.qos ?? 0,
        retain: options?.retain ?? false,
      })
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

    const messageHandler = (topic: string, message: Buffer) => {
      const messageString = message.toString("utf-8")
      api.dispatch(mqttMessageReceived(topic, messageString))
    }

    const rawPacketHandler = (mqttPacket: RawMqttPacket) => {
      api.dispatch(
        mqttPacketReceived({
          ...mqttPacket,
          packet: JSON.parse(JSON.stringify(mqttPacket.packet)),
        }),
      )
    }

    let will: IClientOptions["will"] | undefined = undefined
    if (action.payload.useStatusMessages) {
      const willMessage: WireStatusMessage = {
        status: "offline",
        lastOnlineTimestamp: DateTime.now().toISO(),
      }

      will = {
        topic: `chat/status/${action.payload.credentials.username}`,
        payload: Buffer.from(
          JSON.stringify({
            willMessage,
          }),
        ),
        qos: 0,
        retain: true,
      }
    }

    try {
      await client.connect(
        action.payload.brokerUrl,
        action.payload.credentials,
        messageHandler,
        rawPacketHandler,
        will,
      )
    } catch (e) {
      console.error(e)
      let errorMessage = "Unknown Error"
      if (e instanceof mqtt.ErrorWithReasonCode) {
        errorMessage = e.message
      }

      api.dispatch(disconnected())
      api.dispatch(protocolError(errorMessage))
      return
    }

    if (action.payload.useStatusMessages) {
      const messagePayload: WireStatusMessage = {
        status: "online",
        lastOnlineTimestamp: DateTime.now().toISO(),
      }

      await client.publish(
        `chat/status/${action.payload.credentials.username}`,
        JSON.stringify(messagePayload),
        { retain: true },
      )

      await client.subscribe(`chat/status/+`, 0)
    }

    api.dispatch(clearProtocolError())
    api.dispatch(connected())
    // api.dispatch(publishOnlineStatus({ status: "online" }))
  },
})

typedStartListening({
  actionCreator: disconnect,
  effect: async (_action, api) => {
    const { client } = api.extra
    const username = api.getState().mqttChat.settings?.credentials.username
    const useStatusMessages =
      api.getState().mqttChat.settings?.useStatusMessages

    if (useStatusMessages && username) {
      const messagePayload: WireStatusMessage = {
        status: "offline",
        lastOnlineTimestamp: DateTime.now().toISO(),
      }

      await client.publish(
        `chat/status/${username}`,
        JSON.stringify(messagePayload),
        { retain: true },
      )
    }

    await client.disconnect()

    api.dispatch(disconnected())
  },
})

typedStartListening({
  actionCreator: mqttSubscribe,
  effect: async (action, api) => {
    const { client } = api.extra
    const subscribeQos = api.getState().mqttChat.settings?.useQos ? 2 : 0

    await client.subscribe(action.payload, subscribeQos)
  },
})

typedStartListening({
  actionCreator: mqttPublish,
  effect: async (action, api) => {
    const { client } = api.extra

    const { topic, payload, qos, retain } = action.payload
    await client.publish(topic, payload, { qos, retain })
  },
})
