import { Elysia, t } from "elysia"
import { mockMessages } from "./test/mockMqtt"
import { mqttClient } from "./plugins/mqttClient"
import { ws } from "./plugins/ws"

const BROKER_URL: string = "mqtt://localhost:1883"

const app = new Elysia()
  .use(ws)
  .use(
    mqttClient({
      brokerUrl: BROKER_URL,
      onMessage: (topic, payload) => {
        console.log(`MQTT -> WS Publishing [${topic}]:`, payload)
        app.server?.publish(topic, payload)
      },
    }),
  )
  .use(mockMessages)
  .listen(3000)

console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`)
