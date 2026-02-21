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

import { createDispatcher, TOPICS } from "./services/dispatch.service"

const IS_DEV     = process.env.NODE_ENV !== "production"
const BROKER_URL = "mqtt://localhost:1883"

process.on("SIGINT", async () => {
  console.log("\n[Signal] SIGINT received.");
  await app.stop(); 
  process.exit(0);
});

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
  ? mockSensor({ brokerUrl: BROKER_URL, stationId: "dispatcher_test", objId: "sat1" })
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

  mqtt.subscribe([...TOPICS])

  const dispatch = createDispatcher({
    "slr/:stationId/cmd": ({ stationId }, payload) => {
      app.server?.publish(`slr/${stationId}/cmd`, payload)
    },
    "slr/:stationId/tracking/:objId/pos": ({ stationId, objId }, payload) => {
      app.server?.publish(`slr/${stationId}/tracking/${objId}/pos`, payload)
      writePosition(influx, stationId, objId, payload).catch(console.error)
    },
    "slr/:stationId/env": ({ stationId }, payload) => {
      app.server?.publish(`slr/${stationId}/env`, payload)
    },
    "slr/:stationId/system": ({ stationId }, payload) => {
      app.server?.publish(`slr/${stationId}/system`, payload)
    },
    "slr/:stationId/log/:level": ({ stationId, level }, payload) => {
      app.server?.publish(`slr/${stationId}/log/${level}`, payload)
    },
  })

  mqtt.onMessage(dispatch)
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