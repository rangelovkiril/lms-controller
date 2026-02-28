import { Point } from "@influxdata/influxdb-client"
import { InfluxDecorator, PositionPayload } from "../types"


export async function writePosition(
  influx: InfluxDecorator,
  stationId: string,
  objId: string,
  payload: string
): Promise<void> {
  let data: PositionPayload
  try {
    data = JSON.parse(payload)
  } catch {
    console.error(`[SLR] Invalid JSON on pos topic for ${stationId}/${objId}:`, payload)
    return
  }

  const { az, el, dist, influx_token } = data
  if (az == null || el == null || dist == null) {
    console.error(`[SLR] Missing az/el/dist in payload:`, data)
    return
  }

  const point = new Point(objId)
    .floatField("az",   az)
    .floatField("el",   el)
    .floatField("dist", dist)

  if (influx_token) {
    // Пише с fine-grained токена на станцията – само write права за нейния bucket
    await influx.writePointWithToken(point, stationId, influx_token)
  } else {
    // Fallback към admin токена на бекенда
    console.warn(`[SLR] No influx_token in payload for ${stationId}/${objId} – using admin token`)
    await influx.writePoint(point, stationId)
  }
}