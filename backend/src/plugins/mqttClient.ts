import Elysia from "elysia"
import mqtt, { MqttClient } from "mqtt"

interface MqttPluginOptions {
  brokerUrl: string
  onMessage: (topic: string, payload: string) => void
}

export const mqttClient = (options: MqttPluginOptions) =>
  (app: Elysia) =>
    app.onStart((): void => {
      const client: MqttClient = mqtt.connect(options.brokerUrl)

      client.on("connect", (): void => {
        console.log("Connected to MQTT broker")
        client.subscribe("test/+")
      })

      client.on("message", (topic: string, message: Buffer): void => {
        options.onMessage(topic, message.toString())
      })

      client.on("error", (err: Error): void => console.error("MQTT Error:", err))
    })