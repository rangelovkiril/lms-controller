import Elysia from "elysia"
import mqtt, { MqttClient } from "mqtt"


type MessageHandler = (topic: string, payload: string) => void

export const mqttClient = (brokerUrl: string) => {
  let client: MqttClient

  return new Elysia({ name: "mqtt" })
    .decorate("mqtt", {
      subscribe: (topic: string): void => {
        client.subscribe(topic)
      },
      onMessage: (handler: MessageHandler): void => {
        client.on("message", (topic: string, raw: Buffer) => {
          handler(topic, raw.toString())
        })
      },
    })
    .onStart(() => {
      client = mqtt.connect(brokerUrl)

      client.on("connect", ()   => console.log("[MQTT] Connected to broker:", brokerUrl))
      client.on("error", (err)  => console.error("[MQTT] Error:", err))
    })
    .onStop(() => {
      client?.end()
      console.log("[MQTT] Disconnected")
    })
}