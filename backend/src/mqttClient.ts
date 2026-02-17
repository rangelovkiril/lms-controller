import { Elysia, t } from "elysia"
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
         const payloadString = message.toString()
         console.log(`MQTT -> WS Publishing [${topic}]:`, payloadString)

         try {
           const data = JSON.parse(payloadString)
           app.server?.publish(topic, JSON.stringify(data))
         } catch (e) {
           app.server?.publish(topic, payloadString)
         }
       })

        client.on("error", (err) => console.error("MQTT Error:", err))
        
        app.decorate('mqtt', client)
      })