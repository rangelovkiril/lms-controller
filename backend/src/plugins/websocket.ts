import { Elysia } from "elysia"

export const websocket = new Elysia({ name: "websocket" })
  .ws("/", {
    open(ws) {
      console.log("[WS] Client connected")
    },

    message(ws, message) {
      try {
        const { action, topic } =
          typeof message === "string" ? JSON.parse(message) : message

        console.log(`[WS] action="${action}" topic="${topic}"`)

        if (action === "subscribe") {
          ws.subscribe(topic)
          ws.send(JSON.stringify({ status: `Subscribed to ${topic}` }))
        }

        if (action === "unsubscribe") {
          ws.unsubscribe(topic)
        }
      } catch (err) {
        console.error("[WS] Failed to parse message:", err)
      }
    },

    close(ws) {
      console.log("[WS] Client disconnected")
    },
  })