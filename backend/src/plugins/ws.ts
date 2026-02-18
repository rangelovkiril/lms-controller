import { Elysia, t } from "elysia"

export const ws = new Elysia({name : 'ws'})
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
