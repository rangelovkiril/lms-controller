import { Elysia } from "elysia"
import { websocket } from "./plugins/websocket"
import { mqttClient} from "./plugins/mqtt"
import { influx } from "./plugins/influx"
import { mockSensor } from "./test/mockMqtt"

const IS_DEV = process.env.NODE_ENV !== "production"
const BROKER_URL = "mqtt://localhost:1883"

const app = new Elysia()
  .use(websocket)
  .use(mqttClient(BROKER_URL))
  .use(IS_DEV ? mockSensor({ brokerUrl: BROKER_URL, topic: "slr/test/position" }) : new Elysia())
  .use(
    influx({
      url: process.env.INFLUX_URL ?? "http://localhost:8086",
      token: process.env.INFLUX_TOKEN ?? "PHsk2kM9-UvB4dAnl4Gt_EEVn4Sl4MkYaMGE9ZkJ1PpVwfSVckrQg_Eq_CqweC7eS3aDymACGb-4m_QYUFI9Lg==",
      org: process.env.INFLUX_ORG ?? "LightMySatellite",
      bucket: process.env.INFLUX_BUCKET ?? "slr",
    })
  )
  .onStart(app => {
    const { mqtt, influx } = app.decorator

    mqtt.subscribe("slr/+/position")

    mqtt.onMessage((topic: any, payload: any) => {
      const subscribers = app.server?.publish(topic, payload)

      try {
        const { x, y, z } = JSON.parse(payload)
        const point = new influx.Point("position")
          .tag("topic", topic)
          .floatField("x", x)
          .floatField("y", y)
          .floatField("z", z)

        influx.writePoint(point)
      } catch (err) {
        console.error("[App] Failed to parse payload for InfluxDB:", err)
      }
    })
  })
  .get("/", () => "OK")
  .get("/positions", async ({ influx }) => {
  return await influx.query(`
    from(bucket: "slr")
  |> range(start: -1h)
  |> filter(fn: (r) => r._measurement == "position")
  `)
})
  .listen(3000)


console.log(`[Server] Running at http://${app.server?.hostname}:${app.server?.port}`)