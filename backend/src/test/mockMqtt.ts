import { Elysia } from "elysia"
import mqtt from "mqtt"

interface MockSensorConfig {
  brokerUrl: string
  stationId: string
  objId: string
  influxToken: string
  intervalMs?: number
}

const RAD2DEG = 180 / Math.PI

function cartesianToSpherical(x: number, y: number, z: number) {
  const dist = Math.hypot(x, y, z)
  if (dist === 0) return { az: 0, el: 0, dist: 0 }
  return {
    az: parseFloat((Math.atan2(y, x) * RAD2DEG).toFixed(4)),
    el: parseFloat((Math.asin(z / dist) * RAD2DEG).toFixed(4)),
    dist: parseFloat(dist.toFixed(4)),
  }
}

export const mockSensor = (config: MockSensorConfig) => {
  const { brokerUrl, stationId, objId, influxToken, intervalMs = 100 } = config

  const posTopic = `slr/${stationId}/tracking/${objId}/pos`
  const statusTopic = `slr/${stationId}/status`

  return new Elysia({ name: "mock-sensor" }).onStart(() => {
    const client = mqtt.connect(brokerUrl)

    let t = 0
    const SCALE = 0.01
    const T_STEP = 0.04

    client.on("connect", () => {
      console.log(
        `[MockSensor] Connected — publishing heart to "${posTopic}" every ${intervalMs}ms`,
      )

      client.publish(statusTopic, JSON.stringify({ event: "online" }))
      client.publish(
        statusTopic,
        JSON.stringify({ event: "tracking_start", objId }),
      )

      setInterval(() => {
        const sin_t = Math.sin(t)
        const hx = 16 * sin_t * sin_t * sin_t
        const hy =
          13 * Math.cos(t) -
          5 * Math.cos(2 * t) -
          2 * Math.cos(3 * t) -
          Math.cos(4 * t)

        const x = hy * SCALE
        const y = hx * SCALE
        const z = 5 * SCALE

        const spherical = cartesianToSpherical(x, y, z)
        const payload = { ...spherical, influx_token: influxToken }
        client.publish(posTopic, JSON.stringify(payload))

        t += T_STEP
        if (t > 2 * Math.PI) t -= 2 * Math.PI
      }, intervalMs)
    })

    client.on("error", (err) => console.error("[MockSensor] Error:", err))
  })
}
