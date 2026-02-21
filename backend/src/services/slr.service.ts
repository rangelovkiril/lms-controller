import { Point } from "@influxdata/influxdb-client"

export interface InfluxClient {
  writePoint: (point: Point, bucket: string) => Promise<void>
  query: (flux: string) => Promise<unknown[]>
  org: string
}

export interface ParsedTopic {
  station: string   
  object: string   
}

export interface PositionPayload {
  x: number
  y: number
  z: number
}

export interface QueryOptions {
  station: string
  object: string
  start?: string          
  stop?: string          
}

/**
 * Parses an MQTT topic of the form "slr/{station}/{object}"
 * Returns null if the topic doesn't match the expected structure.
 */
export function parseTopic(topic: string): ParsedTopic | null {
  const parts = topic.split("/")
  if (parts.length !== 3 || parts[0] !== "slr") {
    console.warn(`[SLR] Unexpected topic format: "${topic}"`)
    return null
  }
  const [, station, object] = parts
  return { station, object }
}


export async function writePosition(
  influx: InfluxClient,
  stationId: string,
  objId: string,
  payload: string
): Promise<void> {
  let data: PositionPayload
  try {
    data = JSON.parse(payload)
  } catch {
    console.error(`[SLR] Invalid JSON on slr/${stationId}/tracking/${objId}/pos:`, payload)
    return
  }

  const { x, y, z } = data
  if (x == null || y == null || z == null) {
    console.error(`[SLR] Missing x/y/z in payload:`, data)
    return
  }

  const point = new Point(objId)
    .floatField("x", x)
    .floatField("y", y)
    .floatField("z", z)

  await influx.writePoint(point, stationId)
}
/**
 * Returns all buckets that belong to the SLR domain.
 * Filters out InfluxDB system buckets (_monitoring, _tasks).
 */
export async function getStations(influx: InfluxClient): Promise<string[]> {
  const rows = await influx.query(`
    import "influxdata/influxdb/schema"
    buckets()
    |> filter(fn: (r) => not r.name =~ /^_/)
    |> keep(columns: ["name"])
  `) as Array<{ name: string }>

  return rows.map((r) => r.name).filter(Boolean)
}

/**
 * Returns all measurements (objects) within a given station (bucket).
 */
export async function getObjects(
  influx: InfluxClient,
  station: string
): Promise<string[]> {
  const rows = await influx.query(`
    import "influxdata/influxdb/schema"
    schema.measurements(bucket: "${station}")
  `) as Array<{ _value: string }>

  return rows.map((r) => r._value).filter(Boolean)
}

/**
 * Queries position data for a given station + object within a time range.
 */
export async function getData(
  influx: InfluxClient,
  options: QueryOptions
): Promise<unknown[]> {
  const { station, object, start = "-1h", stop } = options

  const stopClause  = stop   ? `, stop: ${stop}` : ""

  return influx.query(`
    from(bucket: "${station}")
      |> range(start: ${start}${stopClause})
      |> filter(fn: (r) => r._measurement == "${object}")
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> sort(columns: ["_time"])
  `)
}