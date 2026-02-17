import { Elysia, t} from "elysia"
import { mockMessages } from "./test/mockMQTT"
import { mqttClient } from "./mqttClient"

const BROKER_URL: string = "mqtt://localhost:1883"

const app = new Elysia()
  .use(mockMessages)
  .use(mqttClient({ brokerUrl: BROKER_URL }))
  .ws("/", {
    body: t.Object({        
    action: t.String(),
    topic: t.String(),
  }),
    open(ws) {
      console.log("Frontend client connected via WS")
    },
    message(ws, { action, topic }) {
      if (action === "subscribe") {
        ws.subscribe(topic)
        ws.send({ status: `Subscribed to ${topic}` })
      }

      if (action === "unsubscribe") {
        ws.unsubscribe(topic)
      }
    },
    close(ws) {
      console.log("Frontend client disconnected")
    },
  })
  .listen(3000)

console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`)

export type App = typeof app
