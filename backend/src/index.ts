import { Elysia, t } from "elysia"
import { cors } from "@elysiajs/cors"
import {
  createWebsocket,
  publishToStation,
  type CommandHandlerRef,
} from "./plugins/websocket"
import { mqttClient } from "./plugins/mqtt"
import { influx } from "./plugins/influx"
import { resolveAuth } from "./plugins/auth"
import { registerMqttHandlers } from "./handlers/mqtt.handlers"
import {
  getStations,
  getStationMeta,
  createStation,
  updateStation,
  deleteStation,
  getObjects,
  getEnvHistory,
} from "./services/station.service"
import { getLogs, getEnv, getExportData } from "./services/telemetry.service"
import { ObservationService } from "./services/observation.service"
import {
  register,
  login,
  getUser,
  createOrg,
  joinOrg,
  leaveOrg,
  deleteOrg,
  getUserOrgs,
  getOrgMembers,
  getOrgInfo,
  regenerateInviteCode,
  updateMemberRole,
  removeMember,
  linkStationToOrg,
  getOrgStationIds,
  stationBelongsToOrg,
  unlinkStation,
} from "./services/auth.service"

const PORT = Number(Bun.env.PORT) || 3000
const BROKER_URL = Bun.env.MQTT_BROKER_URL ?? "mqtt://localhost:1883"

const cmdRef: CommandHandlerRef = {
  handle: (_s, _a) => console.warn("[WS] Command before MQTT ready — dropped"),
}

const app = new Elysia()
  .use(
    cors({
      origin: Bun.env.CORS_ORIGIN ?? "*",
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Org-Id"],
      credentials: false,
    }),
  )
  .use(createWebsocket(cmdRef))
  .use(mqttClient(BROKER_URL))
  .use(
    influx({
      url: Bun.env.INFLUX_URL ?? "http://localhost:8086",
      token: Bun.env.INFLUX_TOKEN ?? "",
      org: Bun.env.INFLUX_ORG ?? "LightMySatellite",
    }),
  )

  .onStart(({ decorator: { mqtt, influx }, server }) => {
    cmdRef.handle = (stationId, action, objId) => {
      mqtt.publish(`slr/${stationId}/cmd`, JSON.stringify({ action, objId }))
    }
    registerMqttHandlers(mqtt, influx, (stationId, event) => {
      publishToStation(server!, stationId, event)
    })
  })

  .get("/", () => ({ status: "ok" }))

  // ── PUBLIC ────────────────────────────────────────────────────────────
  .post(
    "/api/auth/register",
    async ({ body, set }) => {
      try {
        return await register(body.email, body.password, body.name)
      } catch (e: any) {
        set.status = e.status ?? 400
        return { message: e.message }
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 8 }),
        name: t.String({ minLength: 1 }),
      }),
    },
  )

  .post(
    "/api/auth/login",
    async ({ body, set }) => {
      try {
        return await login(body.email, body.password)
      } catch (e: any) {
        set.status = e.status ?? 401
        return { message: e.message }
      }
    },
    {
      body: t.Object({ email: t.String(), password: t.String() }),
    },
  )

  // ── PROTECTED ─────────────────────────────────────────────────────────
  .group("/api", (app) =>
    app
      .derive(async ({ request, set }) => {
        try {
          return await resolveAuth(request)
        } catch (e: any) {
          set.status = e.status ?? 401
          throw e
        }
      })

      .get("/auth/me", ({ user }) => {
        const full = getUser(user.id)
        const orgs = getUserOrgs(user.id)
        return { ...full, orgs }
      })

      // ── Orgs ──────────────────────────────────────────────────────────
      .get("/orgs", ({ user }) => getUserOrgs(user.id))

      .post(
        "/orgs",
        ({ user, body, set }) => {
          try {
            return createOrg(user.id, body.name)
          } catch (e: any) {
            set.status = e.status ?? 400
            return { message: e.message }
          }
        },
        { body: t.Object({ name: t.String({ minLength: 1 }) }) },
      )

      .post(
        "/orgs/join",
        ({ user, body, set }) => {
          try {
            return joinOrg(user.id, body.inviteCode)
          } catch (e: any) {
            set.status = e.status ?? 400
            return { message: e.message }
          }
        },
        { body: t.Object({ inviteCode: t.String({ minLength: 1 }) }) },
      )

      .get(
        "/orgs/:orgId",
        ({ user, params, set }) => {
          const orgs = getUserOrgs(user.id)
          const org = orgs.find((o) => o.id === params.orgId)
          if (!org) {
            set.status = 403
            return { message: "Not a member" }
          }
          const members = getOrgMembers(params.orgId)
          const info = getOrgInfo(params.orgId)
          return { ...org, createdAt: info?.created_at, members }
        },
        { params: t.Object({ orgId: t.String() }) },
      )

      .post(
        "/orgs/:orgId/leave",
        ({ user, params, set }) => {
          try {
            leaveOrg(user.id, params.orgId)
            return { ok: true }
          } catch (e: any) {
            set.status = e.status ?? 400
            return { message: e.message }
          }
        },
        { params: t.Object({ orgId: t.String() }) },
      )

      .delete(
        "/orgs/:orgId",
        ({ user, params, set }) => {
          try {
            deleteOrg(user.id, params.orgId)
            return { ok: true }
          } catch (e: any) {
            set.status = e.status ?? 400
            return { message: e.message }
          }
        },
        { params: t.Object({ orgId: t.String() }) },
      )

      .post(
        "/orgs/:orgId/regenerate-invite",
        ({ user, params, set }) => {
          try {
            return { inviteCode: regenerateInviteCode(user.id, params.orgId) }
          } catch (e: any) {
            set.status = e.status ?? 403
            return { message: e.message }
          }
        },
        { params: t.Object({ orgId: t.String() }) },
      )

      .patch(
        "/orgs/:orgId/members/:userId",
        ({ user, params, body, set }) => {
          try {
            updateMemberRole(user.id, params.orgId, params.userId, body.role)
            return { ok: true }
          } catch (e: any) {
            set.status = e.status ?? 403
            return { message: e.message }
          }
        },
        {
          params: t.Object({ orgId: t.String(), userId: t.String() }),
          body: t.Object({ role: t.String() }),
        },
      )

      .delete(
        "/orgs/:orgId/members/:userId",
        ({ user, params, set }) => {
          try {
            removeMember(user.id, params.orgId, params.userId)
            return { ok: true }
          } catch (e: any) {
            set.status = e.status ?? 403
            return { message: e.message }
          }
        },
        { params: t.Object({ orgId: t.String(), userId: t.String() }) },
      )

      // ── Stations ──────────────────────────────────────────────────────
      .get("/stations", async ({ influx, orgId }) => {
        const allIds = await getStations(influx)
        const ids =
          orgId === "_all"
            ? allIds
            : orgId
              ? allIds.filter((id) => getOrgStationIds(orgId).includes(id))
              : []
        const meta = await Promise.all(
          ids.map((id) => getStationMeta(influx, id)),
        )
        return ids.map(
          (id, i) => meta[i] ?? { stationId: id, name: id, lat: 0, lon: 0 },
        )
      })

      .post(
        "/stations",
        async ({ influx, body, orgId }) => {
          const result = await createStation(influx, body)
          if (orgId && orgId !== "_all") linkStationToOrg(body.stationId, orgId)
          return result
        },
        {
          body: t.Object({
            stationId: t.String({ minLength: 1 }),
            name: t.String({ minLength: 1 }),
            lat: t.Number({ minimum: -90, maximum: 90 }),
            lon: t.Number({ minimum: -180, maximum: 180 }),
            description: t.Optional(t.String()),
            backendUrl: t.Optional(t.String()),
            hardware: t.Optional(t.String()),
          }),
        },
      )

      .get(
        "/stations/:id",
        async ({ influx, params, orgId, set }) => {
          if (
            orgId &&
            orgId !== "_all" &&
            !stationBelongsToOrg(params.id, orgId)
          ) {
            set.status = 403
            return { message: "Station not in your organization" }
          }
          const meta = await getStationMeta(influx, params.id)
          if (!meta) {
            set.status = 404
            return { message: "Not found" }
          }
          return meta
        },
        { params: t.Object({ id: t.String() }) },
      )

      .patch(
        "/stations/:id",
        async ({ influx, params, body, orgId, set }) => {
          if (
            orgId &&
            orgId !== "_all" &&
            !stationBelongsToOrg(params.id, orgId)
          ) {
            set.status = 403
            return { message: "Station not in your organization" }
          }
          await updateStation(influx, params.id, body)
          return { ok: true }
        },
        {
          params: t.Object({ id: t.String() }),
          body: t.Object({
            name: t.Optional(t.String()),
            lat: t.Optional(t.Number()),
            lon: t.Optional(t.Number()),
            description: t.Optional(t.String()),
            backendUrl: t.Optional(t.String()),
            hardware: t.Optional(t.String()),
          }),
        },
      )

      .delete(
        "/stations/:id",
        async ({ influx, params, orgId, set }) => {
          if (
            orgId &&
            orgId !== "_all" &&
            !stationBelongsToOrg(params.id, orgId)
          ) {
            set.status = 403
            return { message: "Station not in your organization" }
          }
          try {
            await deleteStation(influx, params.id)
            unlinkStation(params.id)
            return { ok: true }
          } catch (e: any) {
            set.status = 404
            return { message: e.message }
          }
        },
        { params: t.Object({ id: t.String() }) },
      )

      .get(
        "/stations/:id/objects",
        ({ influx, params }) => getObjects(influx, params.id),
        { params: t.Object({ id: t.String() }) },
      )
      .get(
        "/stations/:id/logs",
        ({ influx, params, query }) => getLogs(influx, params.id, query.limit),
        {
          params: t.Object({ id: t.String() }),
          query: t.Object({ limit: t.Optional(t.Number({ default: 100 })) }),
        },
      )
      .get(
        "/stations/:id/env",
        ({ influx, params }) => getEnv(influx, params.id),
        { params: t.Object({ id: t.String() }) },
      )
      .get(
        "/stations/:id/env/history",
        ({ influx, params, query }) =>
          getEnvHistory(
            influx,
            params.id,
            query.field,
            query.window,
            query.points,
          ),
        {
          params: t.Object({ id: t.String() }),
          query: t.Object({
            field: t.String(),
            window: t.Optional(t.String({ default: "-1h" })),
            points: t.Optional(t.Number({ default: 50 })),
          }),
        },
      )
      .get(
        "/data",
        ({ influx, query }) =>
          getExportData(
            influx,
            query.station,
            query.object,
            query.start,
            query.stop,
          ),
        {
          query: t.Object({
            station: t.String(),
            object: t.String(),
            start: t.String(),
            stop: t.Optional(t.String()),
          }),
        },
      )

      .post(
        "/observations/upload",
        async ({ influx, body }) => {
          const filesData = await Promise.all(
            body.files.map(async (f) => JSON.parse(await f.text())),
          )
          return ObservationService.createFromImport(
            influx,
            body.observationSet,
            filesData,
          )
        },
        { body: t.Object({ files: t.Files(), observationSet: t.String() }) },
      ),
  )

  .listen(PORT)

process.on("SIGINT", async () => {
  await app.stop()
  process.exit(0)
})
console.log(
  `[Server] Running at http://${app.server?.hostname}:${app.server?.port}`,
)
