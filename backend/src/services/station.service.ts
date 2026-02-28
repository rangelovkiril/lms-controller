import { Point } from "@influxdata/influxdb-client"
import { InfluxDecorator, StationMeta } from "../types"

export async function getStations(influx: InfluxDecorator): Promise<string[]> {
  const rows = await influx.query<{ name: string }>(`
    import "influxdata/influxdb/schema"
    buckets()
    |> filter(fn: (r) => not r.name =~ /^_/ and r.name != "imported")
    |> keep(columns: ["name"])
  `)
  return rows.map((r) => r.name).filter(Boolean)
}

export async function getStationMeta(
  influx:  InfluxDecorator,
  station: string
): Promise<StationMeta | null> {
  const rows = await influx.query<any>(`
    from(bucket: "${station}")
      |> range(start: -1y)
      |> filter(fn: (r) => r._measurement == "_meta")
      |> last()
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
  `)
  if (!rows.length) return null
  const r = rows[0]
  return {
    stationId:   station,
    name:        r.name        ?? station,
    lat:         r.lat         ?? 0,
    lon:         r.lon         ?? 0,
    description: r.description ?? undefined,
    wsUrl:       r.wsUrl       ?? undefined,
    hardware:    r.hardware    ?? undefined,
  }
}

export async function createStation(
  influx: InfluxDecorator,
  meta:   StationMeta
): Promise<{ token: string }> {
  const orgId = await influx.getOrgId()

  const bucket = await influx.bucketsApi.postBuckets({
    body: { name: meta.stationId, orgID: orgId, retentionRules: [] },
  })
  console.log(`[Station] Created bucket "${meta.stationId}"`)

  const auth = await influx.authApi.postAuthorizations({
    body: {
      orgID:       orgId,
      description: `write-only: ${meta.stationId}`,
      permissions: [{
        action:   "write",
        resource: { type: "buckets", id: bucket.id!, orgID: orgId },
      }],
    },
  })

  await writeMetaPoint(influx, meta)

  return { token: auth.token! }
}

export async function updateStation(
  influx:  InfluxDecorator,
  station: string,
  patch:   Partial<Omit<StationMeta, "stationId">>
): Promise<void> {
  const current = await getStationMeta(influx, station)
  await writeMetaPoint(influx, { ...current, stationId: station, ...patch } as StationMeta)
}

/**
 * Writes _meta for the mock station only if it doesn't exist yet.
 * Assumes the bucket already exists (created via createStation or manually).
 */
export async function writeMetaIfMissing(
  influx: InfluxDecorator,
  meta:   StationMeta
): Promise<void> {
  const existing = await getStationMeta(influx, meta.stationId)
  if (existing) return
  await writeMetaPoint(influx, meta)
  console.log(`[Station] Wrote _meta for mock station "${meta.stationId}"`)
}

/** Shared helper — writes all _meta fields as a single InfluxDB point */
function writeMetaPoint(influx: InfluxDecorator, meta: StationMeta): Promise<void> {
  const point = new Point("_meta")
    .stringField("name", meta.name)
    .floatField("lat",   meta.lat)
    .floatField("lon",   meta.lon)

  if (meta.description) point.stringField("description", meta.description)
  if (meta.wsUrl)       point.stringField("wsUrl",       meta.wsUrl)
  if (meta.hardware)    point.stringField("hardware",    meta.hardware)

  return influx.writePoint(point, meta.stationId)
}

export async function getObjects(
  influx:  InfluxDecorator,
  station: string
): Promise<string[]> {
  const rows = await influx.query<{ _value: string }>(`
    import "influxdata/influxdb/schema"
    schema.measurements(bucket: "${station}")
    |> filter(fn: (r) => r._value != "_meta")
  `)
  return rows.map((r) => r._value).filter(Boolean)
}

export interface EnvHistoryPoint {
  timestamp: string
  value:     number
}

export async function getEnvHistory(
  influx:  InfluxDecorator,
  station: string,
  field:   string,
  window:  string = "-1h",
  points:  number = 50
): Promise<EnvHistoryPoint[]> {
  const rows = await influx.query<any>(`
    from(bucket: "${station}")
      |> range(start: ${window})
      |> filter(fn: (r) => r._measurement == "env" and r._field == "${field}")
      |> aggregateWindow(every: 1m, fn: mean, createEmpty: false)
      |> tail(n: ${points})
  `)
  return rows
    .filter((r: any) => r._value != null)
    .map((r: any) => ({ timestamp: r._time, value: r._value as number }))
}

export async function deleteStation(
  influx:  InfluxDecorator,
  station: string
): Promise<void> {
  const orgId = await influx.getOrgId()
  const res   = await influx.bucketsApi.getBuckets({ name: station, org: influx.org })
  const bucket = res.buckets?.[0]
  if (!bucket?.id) throw new Error(`Bucket "${station}" not found`)
  await influx.bucketsApi.deleteBucketsID({ bucketID: bucket.id })
  console.log(`[Station] Deleted bucket "${station}"`)
}