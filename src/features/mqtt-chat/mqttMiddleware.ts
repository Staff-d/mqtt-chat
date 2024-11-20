import { createListenerMiddleware } from "@reduxjs/toolkit"
import type { IClientOptions } from "mqtt"
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
  RawMqttPacket,
  WireStatusMessage,
} from "@/features/mqtt-chat/messageTypes"
import { DateTime } from "luxon"
import { Buffer } from "buffer"
import { MqttClientWrapper } from "@/features/mqtt-chat/MqttClientWrapper"

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
        payload: Buffer.from(JSON.stringify(willMessage)),
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
