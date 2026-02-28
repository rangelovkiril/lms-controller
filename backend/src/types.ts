import type { mqttClient } from "./plugins/mqtt"
import type { InfluxClient } from "./plugins/influx"

type MqttPlugin = ReturnType<typeof mqttClient>

export type MqttDecorator   = MqttPlugin["decorator"]["mqtt"]
export type InfluxDecorator = InfluxClient

// --- Station Meta ---
export interface StationMeta {
  stationId: string
  name: string
  lat: number
  lon: number
  description?: string
}

// --- Spherical position payload from MQTT ---
export interface PositionPayload {
  az: number
  el: number
  dist: number
}

// --- WebSocket events (Server → Client) ---
export type WsStatusEvent =
  | { event: "online" }
  | { event: "offline" }
  | { event: "tracking_start"; objId: string }
  | { event: "tracking_stop" }


export type WsPositionEvent = {
  event: "position"
  objId: string
  value: { x: number; y: number; z: number }
}

export type WsEvent = WsStatusEvent | WsPositionEvent

export type MqttStatusPayload =
  | { event: "online" }
  | { event: "offline" }
  | { event: "tracking_start"; objId: string }
  | { event: "tracking_stop" }
