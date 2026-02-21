import { Elysia, t } from "elysia"
import { cors } from "@elysiajs/cors"
import { websocket } from "./plugins/websocket"
import { mqttClient } from "./plugins/mqtt"
import { influx } from "./plugins/influx"
import { mockSensor } from "./test/mockMqtt"
import { getStations, getObjects, getData } from "./services/slr.service"
import { setupMqtt } from "./setupMqtt"


const IS_DEV    = Bun.env.NODE_ENV !== "production"
const PORT      = Number(Bun.env.PORT) || 3000
const BROKER_URL = Bun.env.MQTT_BROKER_URL ?? "mqtt://localhost:1883"


const app = new Elysia()
  .use(cors({
    origin:         Bun.env.CORS_ORIGIN ?? "localhost:3001",
    methods:        ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials:    false,
  }))
  .use(websocket)
  .use(mqttClient(BROKER_URL))
  .use(IS_DEV
    ? mockSensor({ brokerUrl: BROKER_URL, stationId: "dispatcher_test", objId: "sat1" })
    : new Elysia()
  )
  .use(influx({
    url:   Bun.env.INFLUX_URL   ?? "http://localhost:8086",
    token: Bun.env.INFLUX_TOKEN ?? "",
    org:   Bun.env.INFLUX_ORG   ?? "LightMySatellite",
  }))

 
  .onStart(({ decorator: { mqtt, influx }, server }) => {
    setupMqtt(mqtt, influx, (topic, payload) => {
      server?.publish(topic, payload)
    })
  })

  .get("/", () => ({ status: "ok" }))

  .get("/stations", ({ influx }) =>
    getStations(influx)
  )

  .get("/objects", ({ influx, query }) =>
    getObjects(influx, query.station),
  {
    query: t.Object({
      station: t.String(),
    }),
  })

  .get("/data", ({ influx, query }) =>
    getData(influx, query),
  {
    query: t.Object({
      station: t.String(),
      object:  t.String(),
      start:   t.Optional(t.String()),
      stop:    t.Optional(t.String()),
    }),
  })

  .listen(PORT)

  
process.on("SIGINT", async () => {
  console.log("\n[Signal] SIGINT received. Shutting down…")
  await app.stop()
  process.exit(0)
})

console.log(`[Server] Running at http://${app.server?.hostname}:${app.server?.port}`)