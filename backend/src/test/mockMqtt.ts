import { Elysia } from "elysia"
import mqtt from "mqtt"

interface MockSensorConfig {
  brokerUrl:   string
  stationId?:  string
  objId?:      string
  intervalMs?: number
}

export const mockSensor = (config: MockSensorConfig) => {
  const { brokerUrl, stationId = "test", objId = "sat1", intervalMs = 200 } = config
  const topic = `slr/${stationId}/tracking/${objId}/pos`

  return new Elysia({ name: "mock-sensor" }).onStart(() => {
    const client = mqtt.connect(brokerUrl)

    let t       = 0
    let phase   = 0  // drives the speed oscillation
    const SCALE = 0.6

    // Speed oscillates smoothly between SLOW and FAST every ~6 seconds
    // so the blue→red→blue color gradient is clearly visible on the trace.
    const T_STEP_SLOW = 0.012
    const T_STEP_FAST = 0.09
    const PHASE_STEP  = (2 * Math.PI) / (6000 / intervalMs)  // full cycle in 6 s

    // Parametric heart:
    //   x =  16 sin³(t)
    //   y =  13 cos(t) − 5 cos(2t) − 2 cos(3t) − cos(4t)

    client.on("connect", () => {
      console.log(`[MockSensor] ❤️  Publishing heart to "${topic}" every ${intervalMs}ms (speed oscillating)`)

      setInterval(() => {
        // speed smoothly oscillates: 0 = slow, 1 = fast
        const speedT = (Math.sin(phase) + 1) / 2
        const tStep  = T_STEP_SLOW + (T_STEP_FAST - T_STEP_SLOW) * speedT

        const sin_t = Math.sin(t)
        const x = 16 * sin_t * sin_t * sin_t
        const z = 13 * Math.cos(t)
              - 5 * Math.cos(2 * t)
              - 2 * Math.cos(3 * t)
              -     Math.cos(4 * t)
        const y = 20

        client.publish(topic, JSON.stringify({
          x: parseFloat((x * SCALE).toFixed(3)),
          y: parseFloat((y * SCALE).toFixed(3)),
          z: parseFloat((z * SCALE).toFixed(3)),
        }))

        t     += tStep
        phase += PHASE_STEP
        if (t     > 2 * Math.PI) t     -= 2 * Math.PI
        if (phase > 2 * Math.PI) phase -= 2 * Math.PI
      }, intervalMs)
    })

    client.on("error", (err) => console.error("[MockSensor] Error:", err))
  })
}
