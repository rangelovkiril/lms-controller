import { Elysia } from "elysia"
import {
  InfluxDB,
  Point,
  WriteApi,
  QueryApi,
} from "@influxdata/influxdb-client"

interface InfluxConfig {
  url: string
  token: string
  org: string
  bucket: string
}

export const influx = (config: InfluxConfig) => {
  const client = new InfluxDB({ url: config.url, token: config.token })
  const writeApi: WriteApi = client.getWriteApi(config.org, config.bucket, "ns")
  const queryApi: QueryApi = client.getQueryApi(config.org)

  return new Elysia({ name: "influx" })
    .decorate("influx", {
      writePoint: (point: Point): void => {
        try {
          writeApi.writePoint(point)
          writeApi
            .flush().then()
            .catch((err) => {
              console.error("[InfluxDB] Flush error:", err)
            })
        } catch (err) {
          console.error("[InfluxDB] Write error:", err)
        }
      },
      query: (fluxQuery: string): Promise<unknown[]> => {
        return queryApi.collectRows(fluxQuery)
      },
      Point,
    })
    .onStop(() => {
      writeApi
        .close()
        .catch((err) =>
          console.error("[InfluxDB] Failed to flush on shutdown:", err),
        )
    })
}
