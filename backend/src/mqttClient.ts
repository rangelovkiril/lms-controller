import { Elysia } from "elysia"
import mqtt from "mqtt"

export const mqttClient = (options: { brokerUrl: string }) => 
  (app: Elysia) => 
    app
      .onStart(() => {
        const client = mqtt.connect(options.brokerUrl)

        client.on("connect", () => {
          console.log("Connected to MQTT broker")
          client.subscribe("test/+", (err) => {
            if (!err) console.log("Subscribed to test topics")
          })
        })

        client.on("message", (topic, message) => {
          console.log(`Received [${topic}]:`, message.toString())
        })

        client.on("error", (err) => console.error("MQTT Error:", err))
        
        app.decorate('mqtt', client)
      })