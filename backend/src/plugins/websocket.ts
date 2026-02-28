import { Elysia } from "elysia"
import { WsEvent } from "../types"

export type CommandHandler = (
  stationId: string,
  action:    "track" | "stop",
) => void

export interface CommandHandlerRef {
  handle: CommandHandler
}

// In-memory last-known status per station, so new subscribers get immediate feedback
const stationStatus = new Map<string, WsEvent>()

export function setStationStatus(stationId: string, event: WsEvent): void {
  stationStatus.set(stationId, event)
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
              console.log(`[WS] Subscribed to station "${station}"`)
              // Replay last known status so the client doesn't have to wait
              const last = stationStatus.get(station)
              if (last) ws.send(JSON.stringify(last))
            } else {
              ws.unsubscribe(station)
              console.log(`[WS] Unsubscribed from station "${station}"`)
            }
            return
          }

          // ── Fire / Stop ───────────────────────────────────────────────────
          if (action === "track" || action === "stop") {

            if (!station || typeof station !== "string") {
              ws.send(JSON.stringify({ error: "Missing station" }))
              return
            }
            
            console.log(`[WS] Command "${action}" → station="${station}"`)
            cmdRef.handle(station, action)
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

export function publishToStation(
  server:    { publish: (topic: string, data: string) => void },
  stationId: string,
  event:     WsEvent,
): void {
  server.publish(stationId, JSON.stringify(event))
}