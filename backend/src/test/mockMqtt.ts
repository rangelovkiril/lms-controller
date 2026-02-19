import { Elysia } from "elysia"
import mqtt from "mqtt"

interface MockSensorConfig {
  brokerUrl: string
  topic: string
  intervalMs?: number
}

export const mockSensor = (config: MockSensorConfig) => {
  const { brokerUrl, topic, intervalMs = 500 } = config

  return new Elysia({ name: "mock-sensor" }).onStart(() => {
    const client = mqtt.connect(brokerUrl)

    let angle = 0
    let z = 0
    let zDirection = 1

    const RADIUS = 10
    const ANGLE_STEP = 0.1
    const Z_STEP = 0.5
    const Z_MAX = 20

    client.on("connect", () => {
      console.log(`[MockSensor] Publishing to "${topic}" every ${intervalMs}ms`)

      setInterval(() => {
        const x = RADIUS * Math.cos(angle)
        const y = RADIUS * Math.sin(angle)

        z += Z_STEP * zDirection
        if (z >= Z_MAX || z <= 0) zDirection *= -1

        client.publish(
          topic,
          JSON.stringify({
            x: parseFloat(x.toFixed(2)),
            y: parseFloat(y.toFixed(2)),
            z: parseFloat(z.toFixed(2)),
          })
        )

        angle += ANGLE_STEP
      }, intervalMs)
    })

    client.on("error", (err) => console.error("[MockSensor] Error:", err))
  })
}