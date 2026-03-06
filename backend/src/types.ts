import type { mqttClient } from "./plugins/mqtt"
import type { InfluxClient } from "./plugins/influx"

type MqttPlugin = ReturnType<typeof mqttClient>

export type MqttDecorator   = MqttPlugin["decorator"]["mqtt"]
export type InfluxDecorator = InfluxClient

export interface StationMeta {
  stationId:    string
  name:         string
  lat:          number
  lon:          number
  description?: string
  wsUrl?:       string
  hardware?:    string
}

export interface PositionPayload {
  az:           number
  el:           number
  dist:         number
  influx_token: string
}

export type WsStatusEvent =
  | { event: "online" }
  | { event: "offline" }
  | { event: "locate_start" }
  | { event: "locate_stop" }
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
  | { event: "locate_start" }
  | { event: "locate_stop" }
  | { event: "tracking_start"; objId: string }
  | { event: "tracking_stop" }
