import { Elysia } from "elysia"
import mqtt from "mqtt"

interface MockSensorConfig {
  brokerUrl:   string
  stationId?:  string
  objId?:      string
  intervalMs?: number
}

const RAD2DEG = 180 / Math.PI

/**
 * Convert cartesian (x, y, z) → spherical in DEGREES, matching the
 * convention expected by toCartesian(dist, az, el, true) in coordinates.ts:
 *
 *   x = dist * sin(el) * cos(az)
 *   y = dist * sin(el) * sin(az)
 *   z = dist * cos(el)
 *
 * el is the polar angle from the z-axis (co-elevation), in degrees.
 * az is the azimuth in the x-y plane, in degrees.
 */
function cartesianToSpherical(x: number, y: number, z: number) {
  const dist = Math.hypot(x, y, z)
  if (dist === 0) return { az: 0, el: 0, dist: 0 }
  return {
    az:   parseFloat((Math.atan2(y, x)    * RAD2DEG).toFixed(4)),
    el:   parseFloat((Math.acos(z / dist) * RAD2DEG).toFixed(4)),
    dist: parseFloat(dist                            .toFixed(4)),
  }
}

export const mockSensor = (config: MockSensorConfig) => {
  const { brokerUrl, stationId = "test", objId = "sat1", intervalMs = 100 } = config

  const posTopic    = `slr/${stationId}/tracking/${objId}/pos`
  const statusTopic = `slr/${stationId}/status`

  return new Elysia({ name: "mock-sensor" }).onStart(() => {
    const client = mqtt.connect(brokerUrl)

    let t = 0
    const SCALE  = 0.6    // shrink the heart to fit the scene
    const T_STEP = 0.04   // how fast we trace the curve

    // Parametric heart:
    //   x =  16 sin³(t)
    //   y =  13 cos(t) − 5 cos(2t) − 2 cos(3t) − cos(4t)
    // Placed at constant depth y = 20 in cartesian space.

    client.on("connect", () => {
      console.log(`[MockSensor] Connected — publishing heart to "${posTopic}" every ${intervalMs}ms`)

      // Announce station online + tracking start
      client.publish(statusTopic, JSON.stringify({ event: "online" }))
      client.publish(statusTopic, JSON.stringify({ event: "tracking_start", objId }))

      setInterval(() => {
        const sin_t = Math.sin(t)
        const cx    = 16 * sin_t * sin_t * sin_t
        const cz    = 13 * Math.cos(t)
                    -  5 * Math.cos(2 * t)
                    -  2 * Math.cos(3 * t)
                    -      Math.cos(4 * t)
        const cy    = 20

        const x = cx * SCALE
        const y = cy * SCALE
        const z = cz * SCALE

        const payload = cartesianToSpherical(x, y, z)
        client.publish(posTopic, JSON.stringify(payload))

        t += T_STEP
        if (t > 2 * Math.PI) t -= 2 * Math.PI
      }, intervalMs)
    })

    client.on("error", (err) => console.error("[MockSensor] Error:", err))
  })
}