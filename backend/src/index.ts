import { Elysia, t } from "elysia"
import { cors } from "@elysiajs/cors"
import { createWebsocket, publishToStation, type CommandHandlerRef } from "./plugins/websocket"
import { mqttClient } from "./plugins/mqtt"
import { influx } from "./plugins/influx"
import { mockSensor } from "./test/mockMqtt"
import { registerMqttHandlers } from "./handlers/mqtt.handlers"
import {
  getStations, getStationMeta, createStation, updateStation, deleteStation,
  getObjects, getEnvHistory,
} from "./services/station.service"
import { getLogs, getEnv, getExportData } from "./services/telemetry.service"
import { ObservationService } from "./services/observation.service"

const IS_DEV     = Bun.env.NODE_ENV !== "production"
const PORT       = Number(Bun.env.PORT) || 3000
const BROKER_URL = Bun.env.MQTT_BROKER_URL ?? "mqtt://localhost:1883"

const cmdRef: CommandHandlerRef = {
  handle: (_stationId, _action, _objId) => {
    console.warn("[WS] Command received before MQTT ready — dropped")
  },
}

const app = new Elysia()
  .use(cors({
    origin:         Bun.env.CORS_ORIGIN ?? "localhost:3001",
    methods:        ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials:    false,
  }))
  .use(createWebsocket(cmdRef))
  .use(mqttClient(BROKER_URL))
  .use(IS_DEV
    ? mockSensor({ brokerUrl: BROKER_URL, stationId: "test", objId: "sat1" })
    : new Elysia()
  )
  .use(influx({
    url:   Bun.env.INFLUX_URL   ?? "http://localhost:8086",
    token: Bun.env.INFLUX_TOKEN ?? "",
    org:   Bun.env.INFLUX_ORG   ?? "LightMySatellite",
  }))

  .onStart(({ decorator: { mqtt, influx }, server }) => {
    cmdRef.handle = (stationId, action, objId) => {
      mqtt.publish(`slr/${stationId}/cmd`, JSON.stringify({ action, objId }))
      console.log(`[CMD] Published "${action}" for obj="${objId}" → slr/${stationId}/cmd`)
    }
    registerMqttHandlers(mqtt, influx, (stationId, event) => {
      publishToStation(server!, stationId, event)
    })
  })

  .get("/", () => ({ status: "ok" }))

  .group("/api", (app) => app

    // ── Stations ──────────────────────────────────────────────────────────────

    .get("/stations", async ({ influx }) => {
      const ids  = await getStations(influx)
      const meta = await Promise.all(ids.map((id) => getStationMeta(influx, id)))
      return ids.map((id, i) => meta[i] ?? { stationId: id, name: id, lat: 0, lon: 0 })
    })

    .post(
      "/stations",
      ({ influx, body }) => createStation(influx, body),
      {
        body: t.Object({
          stationId:   t.String({ minLength: 1 }),
          name:        t.String({ minLength: 1 }),
          lat:         t.Number({ minimum: -90,  maximum: 90  }),
          lon:         t.Number({ minimum: -180, maximum: 180 }),
          description: t.Optional(t.String()),
          wsUrl:       t.Optional(t.String()),
          hardware:    t.Optional(t.String()),
        }),
      }
    )

    .get(
      "/stations/:id",
      async ({ influx, params, error }) => {
        const meta = await getStationMeta(influx, params.id)
        if (!meta) return error(404, { message: `Station "${params.id}" not found` })
        return meta
      },
      { params: t.Object({ id: t.String() }) }
    )

    .patch(
      "/stations/:id",
      async ({ influx, params, body }) => {
        await updateStation(influx, params.id, body)
        return { ok: true }
      },
      {
        params: t.Object({ id: t.String() }),
        body: t.Object({
          name:        t.Optional(t.String()),
          lat:         t.Optional(t.Number({ minimum: -90,  maximum: 90  })),
          lon:         t.Optional(t.Number({ minimum: -180, maximum: 180 })),
          description: t.Optional(t.String()),
          wsUrl:       t.Optional(t.String()),
          hardware:    t.Optional(t.String()),
        }),
      }
    )

    .delete(
      "/stations/:id",
      async ({ influx, params, error }) => {
        try {
          await deleteStation(influx, params.id)
          return { ok: true }
        } catch (e: any) {
          return error(404, { message: e.message })
        }
      },
      { params: t.Object({ id: t.String() }) }
    )

    // ── Station data ──────────────────────────────────────────────────────────

    .get(
      "/stations/:id/objects",
      ({ influx, params }) => getObjects(influx, params.id),
      { params: t.Object({ id: t.String() }) }
    )

    .get(
      "/stations/:id/logs",
      ({ influx, params, query }) => getLogs(influx, params.id, query.limit),
      {
        params: t.Object({ id: t.String() }),
        query:  t.Object({ limit: t.Optional(t.Number({ default: 100 })) }),
      }
    )

    .get(
      "/stations/:id/env",
      ({ influx, params }) => getEnv(influx, params.id),
      { params: t.Object({ id: t.String() }) }
    )

    .get(
      "/stations/:id/env/history",
      ({ influx, params, query }) =>
        getEnvHistory(influx, params.id, query.field, query.window, query.points),
      {
        params: t.Object({ id: t.String() }),
        query: t.Object({
          field:  t.String(),
          window: t.Optional(t.String({ default: "-1h" })),
          points: t.Optional(t.Number({ default: 50 })),
        }),
      }
    )

    // ── Export ────────────────────────────────────────────────────────────────

    .get(
      "/data",
      ({ influx, query }) =>
        getExportData(influx, query.station, query.object, query.start, query.stop),
      {
        query: t.Object({
          station: t.String(),
          object:  t.String(),
          start:   t.String(),
          stop:    t.Optional(t.String()),
        }),
      }
    )

    // ── Observations ──────────────────────────────────────────────────────────

    .post(
      "/observations/upload",
      async ({ influx, body }) => {
        const { files, observationSet } = body
        const filesData = await Promise.all(
          files.map(async (file) => JSON.parse(await file.text()))
        )
        return ObservationService.createFromImport(influx, observationSet, filesData)
      },
      {
        body: t.Object({
          files:          t.Files(),
          observationSet: t.String(),
        }),
      }
    )
  )

  .listen(PORT)

process.on("SIGINT", async () => {
  console.log("\n[Signal] SIGINT received. Shutting down…")
  await app.stop()
  process.exit(0)
})

console.log(`[Server] Running at http://${app.server?.hostname}:${app.server?.port}`)