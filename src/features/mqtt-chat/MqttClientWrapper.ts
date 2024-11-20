import type { IClientOptions, MqttClient } from "mqtt"
import mqtt from "mqtt"
import type {
  MQTTCredentials,
  RawMqttPacket,
} from "@/features/mqtt-chat/messageTypes"
import type { Buffer } from "buffer"
import { DateTime } from "luxon"
import { v4 as uuidv4 } from "uuid"

/**
 * This client wraps the mqtt client from mqtt.js
 * to provide a more convenient interface for our app
 */
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
