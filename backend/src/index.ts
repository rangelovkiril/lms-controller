import { Elysia, t } from "elysia"
import { cors } from "@elysiajs/cors"
import { websocket } from "./plugins/websocket"
import { mqttClient } from "./plugins/mqtt"
import { influx } from "./plugins/influx"
import { mockSensor } from "./test/mockMqtt"
import {
  writePosition,
  getStations,
  getObjects,
  getData,
} from "./services/slr.service"

const IS_DEV     = process.env.NODE_ENV !== "production"
const BROKER_URL = "mqtt://localhost:1883"

const ALLOWED_ORIGINS = IS_DEV
  ? ["http://localhost:3001"]
  : [process.env.FRONTEND_URL ?? "http://localhost:3001"]

const app = new Elysia()
  .use(cors({
    origin: "localhost:3001",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  }))
  .use(websocket)
  .use(mqttClient(BROKER_URL))
  .use(IS_DEV
    ? mockSensor({ brokerUrl: BROKER_URL, topic: "slr/test/position" })
    : new Elysia()
  )
  .use(
    influx({
      url:   process.env.INFLUX_URL   ?? "http://localhost:8086",
      token: process.env.INFLUX_TOKEN ?? "eRFpmv6ilk0KbPEMT07OagqicCPIf1ZkGNhN5POKwxat8GU-3mQYx9MmOocDPISd5eZvu52bslghi3cyb-KJVQ==",
      org:   process.env.INFLUX_ORG   ?? "LightMySatellite",
    })
  )
  .onStart((app) => {
    const { mqtt, influx } = app.decorator

    mqtt.subscribe("slr/+/+")  // slr/{station}/{object}

    mqtt.onMessage((topic: string, payload: string) => {
      app.server?.publish(topic, payload)

      writePosition(influx, topic, payload).catch(console.error)
    })
  })

  .get("/", () => ({ status: "ok" }))

  .get("/stations", async ({ influx }) => {
    return getStations(influx)
  })

  .get("/objects", async ({ influx, query }) => {
    return getObjects(influx, query.station)
  }, {
    query: t.Object({
      station: t.String(),
    }),
  })

  .get("/data", async ({ influx, query }) => {
    return getData(influx, query)
  }, {
    query: t.Object({
      station: t.String(),
      object:  t.String(),
      start:   t.Optional(t.String()),
      stop:    t.Optional(t.String()),
    }),
  })

  .listen(3000)

console.log(`[Server] Running at http://${app.server?.hostname}:${app.server?.port}`)