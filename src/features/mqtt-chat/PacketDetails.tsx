import type { RawMqttPacket } from "@/features/mqtt-chat/messageTypes"
import type { FC } from "react"
import { useMemo } from "react"
import { KeyValuePairList } from "@/features/mqtt-chat/KeyValuePairList"
import { DateTime } from "luxon"

interface ComponentProps {
  packet: RawMqttPacket
}

export const PacketDetails: FC<ComponentProps> = ({ packet }) => {
  const keyValuePairs = useMemo<{
    primary: Record<string, string>
    secondary: Record<string, string>
  }>(() => {
    const primary: Record<string, string> = {}
    const secondary: Record<string, string> = {}
    const timestamp = DateTime.fromISO(packet.receivedAt).toFormat(
      "HH:mm:ss.SSS ZZZZ",
    )
    if (packet.direction === "inbound") {
      primary["Received At"] = timestamp
    } else {
      primary["Sent At"] = timestamp
    }

    const mqttPacket = packet.packet
    switch (mqttPacket.cmd) {
      case "connect":
        primary["Username"] = mqttPacket.username ?? "n/a"
        primary["Password"] = mqttPacket.password?.toString() ?? "n/a"
        primary["Client ID"] = mqttPacket.clientId
        primary["Clean session"] = mqttPacket.clean?.toString() ?? "n/a"
        primary["Keep alive interval"] =
          mqttPacket.keepalive?.toString() ?? "n/a"
        primary["Will topic"] = mqttPacket.will?.topic ?? "n/a"
        primary["Will QoS"] = mqttPacket.will?.qos?.toString() ?? "n/a"
        break
      case "connack":
        primary["Resuming session"] = mqttPacket.sessionPresent.toString()
        break
      case "publish":
        primary["MessageID"] = `${mqttPacket?.messageId ?? "n/a"}`
        primary["Topic"] = mqttPacket.topic
        primary["QoS"] = mqttPacket.qos.toString()
        primary["Retain"] = mqttPacket.retain.toString()
        primary["Duplicate"] = mqttPacket.dup.toString()
        break
      case "puback":
        primary["Acked MessageID"] = `${mqttPacket?.messageId ?? "n/a"}`
        break
      case "subscribe":
        primary["MessageID"] = `${mqttPacket?.messageId ?? "n/a"}`
        primary["Topic"] = mqttPacket.subscriptions[0].topic
        primary["QoS"] = mqttPacket.subscriptions[0].qos.toString()
        primary["Send retained"] =
          (mqttPacket.subscriptions[0].rh ?? 0) === 0
            ? "Always"
            : mqttPacket.subscriptions[0].rh === 1
              ? "If new"
              : "Never"
        break
      case "suback":
        primary["Acked MessageID"] = `${mqttPacket?.messageId ?? "n/a"}`
        primary["Granted QoS"] = mqttPacket.granted.toString()
        break
    }

    return { primary, secondary }
  }, [packet])

  return (
    <KeyValuePairList
      primary={keyValuePairs.primary}
      secondary={keyValuePairs.secondary}
    />
  )
}
