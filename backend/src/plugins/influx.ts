import { Elysia } from "elysia"
import {
  InfluxDB,
  Point,
  WriteApi,
  QueryApi,
} from "@influxdata/influxdb-client"
import { BucketsAPI, OrgsAPI } from "@influxdata/influxdb-client-apis"

interface InfluxConfig {
  url: string
  token: string
  org: string
}

export const influx = (config: InfluxConfig) => {
  const client = new InfluxDB({ url: config.url, token: config.token })
  const queryApi = client.getQueryApi(config.org)
  const bucketsApi = new BucketsAPI(client)
  const orgsApi = new OrgsAPI(client)
  const writeApis = new Map<string, WriteApi>()

  // Cache на вече потвърдени bucket-и — не питаме InfluxDB всеки път
  const confirmedBuckets = new Set<string>()

  const getOrgId = async (): Promise<string> => {
    const orgs = await orgsApi.getOrgs({ org: config.org })
    const org = orgs.orgs?.find((o) => o.name === config.org)
    if (!org?.id) throw new Error(`Org "${config.org}" not found`)
    return org.id
  }

  const ensureBucket = async (bucket: string): Promise<void> => {
    if (confirmedBuckets.has(bucket)) return

    // getBuckets хвърля 404 на InfluxDB OSS когато bucket-ът не съществува
    // вместо да върне { buckets: [] } — трябва да различим 404 от реална грешка
    let exists = false
    try {
      const res = await bucketsApi.getBuckets({ name: bucket, org: config.org })
      exists = (res.buckets?.length ?? 0) > 0
    } catch (err: any) {
      if (err?.statusCode !== 404) {
        // Реална грешка (auth, мрежа и т.н.) — спираме
        console.error(
          `[InfluxDB] Error checking bucket "${bucket}":`,
          err?.json ?? err?.body ?? err,
        )
        return
      }
      // 404 = не съществува → продължаваме към създаване
    }

    if (exists) {
      confirmedBuckets.add(bucket)
      return
    }

    try {
      const orgId = await getOrgId()
      await bucketsApi.postBuckets({
        body: {
          name: bucket,
          orgID: orgId,
          retentionRules: [], 
        },
      })
      confirmedBuckets.add(bucket)
      console.log(`[InfluxDB] Created bucket "${bucket}"`)
    } catch (err: any) {
      console.error(
        `[InfluxDB] Could not create bucket "${bucket}":`,
        err?.json ?? err?.body ?? err,
      )
    }
  }

  const getWriteApi = (bucket: string): WriteApi => {
    if (!writeApis.has(bucket)) {
      writeApis.set(bucket, client.getWriteApi(config.org, bucket, "ns"))
    }
    return writeApis.get(bucket)!
  }

  return new Elysia({ name: "influx" })
    .decorate("influx", {
      writePoint: async (point: Point, bucket: string): Promise<void> => {
        await ensureBucket(bucket)
        try {
          getWriteApi(bucket).writePoint(point)
        } catch (err) {
          console.error(`[InfluxDB] Write error (bucket: ${bucket}):`, err)
        }
      },
      query: (fluxQuery: string): Promise<unknown[]> => {
        return queryApi.collectRows(fluxQuery)
      },
      async getStations() {
        const rows = (await queryApi.collectRows(`
          import "influxdata/influxdb/schema"
          buckets() |> filter(fn: (r) => not r.name =~ /^_/) |> keep(columns: ["name"])
        `)) as any[]
        return rows.map((r) => r.name)
      },

      async getObjects(station: string) {
        const rows = (await queryApi.collectRows(`
          import "influxdata/influxdb/schema"
          schema.measurements(bucket: "${station}")
        `)) as any[]
        return rows.map((r) => r._value)
      },

async getExportData(station: string, object: string, start: string, stop?: string) {
  const stopClause = stop ? `, stop: ${stop}` : "";
  const flux = `
    from(bucket: "${station}")
      |> range(start: ${start}${stopClause})
      |> filter(fn: (r) => r._measurement == "${object}")
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
  `;

  const rows = await queryApi.collectRows(flux) as any[];

  const blackList = ["result", "table", "_start", "_stop", "_measurement"];

  return rows.map(row => {
    const cleanRow: any = {};
    Object.keys(row).forEach(key => {
      if (!blackList.includes(key)) {
        const finalKey = key === "_time" ? "timestamp" : key;
        cleanRow[finalKey] = row[key];
      }
    });
    return cleanRow;
  });
},

      Point,
      org: config.org,
    })
    .onStop(async () => {
      const closers = [...writeApis.values()].map((api) =>
        api
          .close()
          .catch((err) =>
            console.error("[InfluxDB] Failed to flush on shutdown:", err),
          ),
      )
      await Promise.all(closers)
      console.log(`[InfluxDB] Closed ${closers.length} write API(s)`)
    })
}
