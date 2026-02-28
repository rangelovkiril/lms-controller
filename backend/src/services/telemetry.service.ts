import { InfluxDecorator } from "../types"

const EXCLUDED_FIELDS = new Set(["result", "table", "_start", "_stop", "_measurement"])

const cleanRow = (row: Record<string, any>): Record<string, any> => {
  const clean: Record<string, any> = {}
  for (const [key, val] of Object.entries(row)) {
    if (EXCLUDED_FIELDS.has(key)) continue
    clean[key === "_time" ? "timestamp" : key] = val
  }
  return clean
}

export async function getLogs(
  influx: InfluxDecorator,
  station: string,
  limit: number = 100
): Promise<any[]> {
  const rows = await influx.query<any>(`
    from(bucket: "${station}")
      |> range(start: -24h)
      |> filter(fn: (r) => r._measurement == "log")
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: ${limit})
  `)
  return rows.map(cleanRow)
}

export async function getEnv(
  influx: InfluxDecorator,
  station: string
): Promise<any | null> {
  const rows = await influx.query<any>(`
    from(bucket: "${station}")
      |> range(start: -1h)
      |> filter(fn: (r) => r._measurement == "env")
      |> last()
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
  `)
  return rows.length ? cleanRow(rows[0]) : null
}

export async function getExportData(
  influx: InfluxDecorator,
  station: string,
  object: string,
  start: string,
  stop?: string
): Promise<any[]> {
  const stopClause = stop ? `, stop: ${stop}` : ""
  const rows = await influx.query<any>(`
    from(bucket: "${station}")
      |> range(start: ${start}${stopClause})
      |> filter(fn: (r) => r._measurement == "${object}")
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> sort(columns: ["_time"])
  `)
  return rows.map(cleanRow)
}
