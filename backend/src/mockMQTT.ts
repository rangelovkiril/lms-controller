import { Elysia } from "elysia"

import mqtt from "mqtt"

export const mockMessages = (app: Elysia) =>
  app.onStart(() => {
    const client = mqtt.connect("mqtt://localhost:1883")

    let angle = 0
    let z = 0
    let direction = 1
    const radius = 10
    const speed = 0.1
    const zStep = 0.5
    const zMax = 20

    client.on("connect", () => {
      console.log("Mock sensor: Connected and sending data...")

      setInterval(() => {
        const x = radius * Math.cos(angle)
        const y = radius * Math.sin(angle)
        z += zStep * direction

        if (z >= zMax || z <= 0) direction *= -1

        const payload = JSON.stringify({
          x: parseFloat(x.toFixed(2)),
          y: parseFloat(y.toFixed(2)),
          z: parseFloat(z.toFixed(2)),

          timestamp: Date.now(),
        })

        client.publish("test/spiral", payload)

        angle += speed
      }, 500)
    })

    client.on("error", (err) => console.error("MQTT Error:", err))
  })
