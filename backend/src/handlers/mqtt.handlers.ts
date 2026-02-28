import { Point } from "@influxdata/influxdb-client"
import { createDispatcher, TOPICS } from "../services/dispatch.service"
import { writePosition } from "../services/slr.service"
import { toCartesian } from "../utils/coordinates"
import { InfluxDecorator, MqttDecorator, MqttStatusPayload, PositionPayload, WsEvent } from "../types"
import { setStationStatus } from "../plugins/websocket"

export function registerMqttHandlers(
  mqtt: MqttDecorator,
  influx: InfluxDecorator,
  publish: (stationId: string, event: WsEvent) => void
) {
  mqtt.subscribe([...TOPICS])

  const dispatch = createDispatcher({
    "slr/:stationId/status": ({ stationId }, payload) => {
      let data: MqttStatusPayload

      try { data = JSON.parse(payload) }
      catch {
        console.error(`[MQTT] Invalid status payload for ${stationId}:`, payload)
        return
      }

      const event = data as WsEvent
      setStationStatus(stationId, event)
      publish(stationId, event)
    },

    "slr/:stationId/tracking/:objId/pos": ({ stationId, objId }, payload) => {
      writePosition(influx, stationId, objId, payload).catch(console.error)

      let data: PositionPayload
      try {
        data = JSON.parse(payload)
      } catch {
        console.error(`[MQTT] Invalid pos payload for ${stationId}/${objId}:`, payload)
        return
      }

      const { az, el, dist } = data
      if (az == null || el == null || dist == null) return

      publish(stationId, {
        event: "position",
        objId,
        value: toCartesian(dist, az, el, true),
      })
    },

    "slr/:stationId/env": ({ stationId }, payload) => {
      let data: Record<string, number>
      try {
        data = JSON.parse(payload)
      } catch {
        console.error(`[MQTT] Invalid env payload for ${stationId}:`, payload)
        return
      }

      const point = new Point("env")
      for (const [field, value] of Object.entries(data)) {
        if (typeof value === "number") point.floatField(field, value)
      }

      influx.writePoint(point, stationId).catch(console.error)
    },

    "slr/:stationId/log/:level": ({ stationId, level }, payload) => {
      const point = new Point("log")
        .tag("level", level)
        .stringField("message", payload)

      influx.writePoint(point, stationId).catch(console.error)
    },
  })

  mqtt.onMessage(dispatch)
}