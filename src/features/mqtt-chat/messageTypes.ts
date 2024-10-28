import { z } from "zod"
import { type Packet } from "mqtt"

// topic: "chat/messages/{receiver}/{sender}"
// pub acl: "chat/messages/+/{username}"
// sub acl: "chat/messages/{username}/+"
export const wireMessageSchema = z.object({
  messageId: z.string(),
  content: z.string(),
  timestamp: z.string().datetime({ offset: true }),
})

export type WireMessage = z.infer<typeof wireMessageSchema>
export type Message = WireMessage & { sender: string; receiver: string }

export const wireStatusMessageSchema = z.object({
  status: z.enum(["online", "offline"]),
  lastOnlineTimestamp: z.string().datetime({ offset: true }),
})

export type WireStatusMessage = z.infer<typeof wireStatusMessageSchema>

export type StatusMessage = WireStatusMessage & { userId: string }

export interface MQTTCredentials {
  username: string
  password?: string
}

export interface ApplicationSettings {
  credentials: MQTTCredentials
  subscribeQos2: boolean
  deduplicateMessages: boolean
}

export interface RawMqttPacket {
  packet: Packet
  direction: "inbound" | "outbound"
  receivedAt: string
  // Pingreq and Pingres packets don't have a messageId
  // so we add our own id here to be able to reference
  // these packages also
  receptionId: string
}
