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
  influx: InfluxDecorator,
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
  }
}

export async function createStation(
  influx: InfluxDecorator,
  meta: StationMeta
): Promise<{ token: string }> {
  const orgId = await influx.getOrgId()

  const bucket = await influx.bucketsApi.postBuckets({
    body: { name: meta.stationId, orgID: orgId, retentionRules: [] },
  })
  await influx.ensureBucket(meta.stationId)
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

  const point = new Point("_meta")
    .stringField("name", meta.name)
    .floatField("lat",   meta.lat)
    .floatField("lon",   meta.lon)

  if (meta.description) point.stringField("description", meta.description)

  await influx.writePoint(point, meta.stationId)

  return { token: auth.token! }
}

export async function getObjects(
  influx: InfluxDecorator,
  station: string
): Promise<string[]> {
  const rows = await influx.query<{ _value: string }>(`
    import "influxdata/influxdb/schema"
    schema.measurements(bucket: "${station}")
    |> filter(fn: (r) => r._value != "_meta")
  `)
  return rows.map((r) => r._value).filter(Boolean)
}
