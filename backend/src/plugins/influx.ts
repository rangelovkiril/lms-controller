import { Elysia } from "elysia"
import { InfluxDB, Point, WriteApi } from "@influxdata/influxdb-client"
import {
  BucketsAPI,
  OrgsAPI,
  AuthorizationsAPI,
} from "@influxdata/influxdb-client-apis"

export interface InfluxConfig {
  url: string
  token: string
  org: string
}

export interface InfluxClient {
  org: string
  url: string
  writePoint: (point: Point, bucket: string) => Promise<void>
  writePointImmediate: (point: Point, bucket: string) => Promise<void>
  writePointWithToken: (
    point: Point,
    bucket: string,
    token: string,
  ) => Promise<void>
  query: <T = any>(flux: string) => Promise<T[]>
  ensureBucket: (bucket: string) => Promise<void>
  getOrgId: () => Promise<string>
  bucketsApi: BucketsAPI
  authApi: AuthorizationsAPI
}

export const influx = (config: InfluxConfig) => {
  const client = new InfluxDB({ url: config.url, token: config.token })
  const queryApi = client.getQueryApi(config.org)
  const bucketsApi = new BucketsAPI(client)
  const orgsApi = new OrgsAPI(client)
  const authApi = new AuthorizationsAPI(client)

  const writeApis = new Map<string, WriteApi>()
  const stationWriteApis = new Map<string, WriteApi>()
  const confirmedBuckets = new Set<string>()

  const getOrgId = async (): Promise<string> => {
    const orgs = await orgsApi.getOrgs({ org: config.org })
    const org = orgs.orgs?.find((o) => o.name === config.org)
    if (!org?.id) throw new Error(`Org "${config.org}" not found`)
    return org.id
  }

  const ensureBucket = async (bucket: string): Promise<void> => {
    if (confirmedBuckets.has(bucket)) return

    let exists = false
    try {
      const res = await bucketsApi.getBuckets({ name: bucket, org: config.org })
      exists = (res.buckets?.length ?? 0) > 0
    } catch (err: any) {
      if (err?.statusCode !== 404) {
        console.error(
          `[InfluxDB] Error checking bucket "${bucket}":`,
          err?.json ?? err,
        )
        return
      }
    }

    if (exists) {
      confirmedBuckets.add(bucket)
      return
    }

    try {
      const orgId = await getOrgId()
      await bucketsApi.postBuckets({
        body: { name: bucket, orgID: orgId, retentionRules: [] },
      })
      confirmedBuckets.add(bucket)
      console.log(`[InfluxDB] Created bucket "${bucket}"`)
    } catch (err: any) {
      console.error(
        `[InfluxDB] Could not create bucket "${bucket}":`,
        err?.json ?? err,
      )
    }
  }

  const getWriteApi = (bucket: string): WriteApi => {
    if (!writeApis.has(bucket)) {
      writeApis.set(bucket, client.getWriteApi(config.org, bucket, "ns"))
    }
    return writeApis.get(bucket)!
  }

  const getStationWriteApi = (bucket: string, token: string): WriteApi => {
    const key = `${bucket}::${token}`
    if (!stationWriteApis.has(key)) {
      const stationClient = new InfluxDB({ url: config.url, token })
      stationWriteApis.set(
        key,
        stationClient.getWriteApi(config.org, bucket, "ns"),
      )
    }
    return stationWriteApis.get(key)!
  }

  const influxClient: InfluxClient = {
    org: config.org,
    url: config.url,

    /** Buffered write — good for high-frequency data (positions) */
    writePoint: async (point: Point, bucket: string): Promise<void> => {
      await ensureBucket(bucket)
      try {
        getWriteApi(bucket).writePoint(point)
      } catch (err) {
        console.error(`[InfluxDB] Write error (bucket: ${bucket}):`, err)
      }
    },

    /** Write + flush — use for metadata that must be readable immediately */
    writePointImmediate: async (
      point: Point,
      bucket: string,
    ): Promise<void> => {
      await ensureBucket(bucket)
      try {
        const api = getWriteApi(bucket)
        api.writePoint(point)
        await api.flush()
      } catch (err) {
        console.error(
          `[InfluxDB] Immediate write error (bucket: ${bucket}):`,
          err,
        )
      }
    },

    writePointWithToken: async (
      point: Point,
      bucket: string,
      token: string,
    ): Promise<void> => {
      try {
        getStationWriteApi(bucket, token).writePoint(point)
      } catch (err) {
        console.error(
          `[InfluxDB] Station write error (bucket: ${bucket}):`,
          err,
        )
      }
    },

    query: <T = any>(flux: string): Promise<T[]> =>
      queryApi.collectRows(flux) as Promise<T[]>,
    ensureBucket,
    getOrgId,
    bucketsApi,
    authApi,
  }

  return new Elysia({ name: "influx" })
    .decorate("influx", influxClient)
    .onStop(async () => {
      const allApis = [...writeApis.values(), ...stationWriteApis.values()]
      const closers = allApis.map((api) =>
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
