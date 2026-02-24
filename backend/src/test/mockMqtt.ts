import { Elysia } from "elysia"
import mqtt from "mqtt"

interface MockSensorConfig {
  brokerUrl:   string
  stationId?:  string
  objId?:      string
  intervalMs?: number
}

export const mockSensor = (config: MockSensorConfig) => {
  const { brokerUrl, stationId = "test", objId = "sat1", intervalMs = 100 } = config
  const topic = `slr/${stationId}/tracking/${objId}/pos`

  return new Elysia({ name: "mock-sensor" }).onStart(() => {
    const client = mqtt.connect(brokerUrl)

    let t = 0
    const SCALE      = 0.6   // shrink the heart to fit the scene
    const T_STEP     = 0.04  // how fast we trace the curve
    const Z_DRIFT    = 0.05  // slow vertical float for depth

    // Parametric heart:
    //   x =  16 sin³(t)
    //   y =  13 cos(t) − 5 cos(2t) − 2 cos(3t) − cos(4t)
    // This is the classic cardioid-ish heart curve.

    client.on("connect", () => {
      console.log(`[MockSensor] ❤️  Publishing heart to "${topic}" every ${intervalMs}ms`)

      setInterval(() => {
        const sin_t  = Math.sin(t)
        const x = 16 * sin_t * sin_t * sin_t
        const z = 13 * Math.cos(t)
              - 5 * Math.cos(2 * t)
              - 2 * Math.cos(3 * t)
              -     Math.cos(4 * t)
        // gentle lift above the grid
        const y = 20

        client.publish(topic, JSON.stringify({
          x: parseFloat((x * SCALE).toFixed(3)),
          y: parseFloat((y * SCALE).toFixed(3)),
          z: parseFloat((z * SCALE).toFixed(3)),
        }))

        t += T_STEP
        if (t > 2 * Math.PI) t -= 2 * Math.PI
      }, intervalMs)
    })

    client.on("error", (err) => console.error("[MockSensor] Error:", err))
  })
}
