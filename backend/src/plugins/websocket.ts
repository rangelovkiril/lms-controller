import { Elysia } from "elysia"
import { WsEvent } from "../types"

export type CommandHandler = (
  stationId: string,
  action:    "fire" | "stop",
  objId:     string,
) => void

/**
 * Mutable container so the command handler can be injected after
 * the MQTT client is ready (in onStart), without circular dependencies.
 */
export interface CommandHandlerRef {
  handle: CommandHandler
}

export function createWebsocket(cmdRef: CommandHandlerRef) {
  return new Elysia({ name: "websocket" })
    .ws("/ws", {
      open(ws) {
        console.log("[WS] Client connected")
      },

      message(ws, message) {
        try {
          const parsed =
            typeof message === "string" ? JSON.parse(message) : message

          const { action, station } = parsed

          // ── Subscribe / Unsubscribe ───────────────────────────────────────
          if (action === "subscribe" || action === "unsubscribe") {
            if (!station || typeof station !== "string") {
              ws.send(JSON.stringify({ error: "Missing station" }))
              return
            }
            if (action === "subscribe") {
              ws.subscribe(station)
              ws.send(JSON.stringify({ status: `Subscribed to ${station}` }))
              console.log(`[WS] Subscribed to station "${station}"`)
            } else {
              ws.unsubscribe(station)
              console.log(`[WS] Unsubscribed from station "${station}"`)
            }
            return
          }

          // ── Fire / Stop ───────────────────────────────────────────────────
          if (action === "fire" || action === "stop") {
            const { objId } = parsed
            if (!station || typeof station !== "string") {
              ws.send(JSON.stringify({ error: "Missing station" }))
              return
            }
            if (!objId || typeof objId !== "string") {
              ws.send(JSON.stringify({ error: "Missing objId" }))
              return
            }
            console.log(`[WS] Command "${action}" → station="${station}" obj="${objId}"`)
            cmdRef.handle(station, action, objId)
            return
          }

          ws.send(JSON.stringify({ error: `Unknown action: ${action}` }))
        } catch (err) {
          console.error("[WS] Failed to parse message:", err)
          ws.send(JSON.stringify({ error: "Invalid message format" }))
        }
      },

      close(ws) {
        console.log("[WS] Client disconnected")
      },
    })
}

/**
 * Publish a WsEvent to all clients subscribed to a station channel.
 */
export function publishToStation(
  server:    { publish: (topic: string, data: string) => void },
  stationId: string,
  event:     WsEvent,
): void {
  server.publish(stationId, JSON.stringify(event))
}