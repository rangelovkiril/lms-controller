import { describe, it, expect, mock, beforeEach } from "bun:test"
import { registerMqttHandlers } from "../../src/handlers/mqtt.handlers"

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeMocks() {
  let messageHandler: ((topic: string, payload: string) => void) | null = null

  const mqtt = {
    subscribe: mock(() => {}),
    publish:   mock(() => {}),
    onMessage: mock((h: (topic: string, payload: string) => void) => {
      messageHandler = h
    }),
  }

  const writtenPoints: Array<{ point: any; bucket: string }> = []
  const influx = {
    writePoint: mock((point: any, bucket: string) => {
      writtenPoints.push({ point, bucket })
      return Promise.resolve()
    }),
  }

  const published: Array<{ stationId: string; event: any }> = []
  const publish = mock((stationId: string, event: any) => {
    published.push({ stationId, event })
  })

  /** Simulate an incoming MQTT message */
  function send(topic: string, payload: string) {
    if (!messageHandler) throw new Error("onMessage was never called")
    messageHandler(topic, payload)
  }

  return { mqtt, influx, publish, writtenPoints, published, send }
}

// ── Status relay ──────────────────────────────────────────────────────────────

describe("MQTT handler — status relay", () => {
  it("relays online event to the correct station", () => {
    const { mqtt, influx, publish, published, send } = makeMocks()
    registerMqttHandlers(mqtt as any, influx as any, publish)

    send("slr/test/status", JSON.stringify({ event: "online" }))

    expect(published).toHaveLength(1)
    expect(published[0].stationId).toBe("test")
    expect(published[0].event).toEqual({ event: "online" })
  })

  it("relays tracking_start with objId", () => {
    const { mqtt, influx, publish, published, send } = makeMocks()
    registerMqttHandlers(mqtt as any, influx as any, publish)

    send("slr/alpha/status", JSON.stringify({ event: "tracking_start", objId: "sat1" }))

    expect(published[0].event).toEqual({ event: "tracking_start", objId: "sat1" })
    expect(published[0].stationId).toBe("alpha")
  })

  it("relays offline event", () => {
    const { mqtt, influx, publish, published, send } = makeMocks()
    registerMqttHandlers(mqtt as any, influx as any, publish)

    send("slr/beta/status", JSON.stringify({ event: "offline" }))

    expect(published[0].event.event).toBe("offline")
  })

  it("does not publish on invalid JSON", () => {
    const { mqtt, influx, publish, published, send } = makeMocks()
    registerMqttHandlers(mqtt as any, influx as any, publish)

    send("slr/test/status", "NOT_JSON")

    expect(published).toHaveLength(0)
  })
})

// ── Position transform ────────────────────────────────────────────────────────

describe("MQTT handler — position transform", () => {
  const EPSILON = 1e-3

  function close(a: number, b: number) { return Math.abs(a - b) < EPSILON }

  it("publishes a position WsEvent with cartesian value", () => {
    const { mqtt, influx, publish, published, send } = makeMocks()
    registerMqttHandlers(mqtt as any, influx as any, publish)

    // az=0°, el=90° (polar), dist=10 → x≈10, y≈0, z≈0
    send("slr/test/tracking/sat1/pos", JSON.stringify({ az: 0, el: 90, dist: 10 }))

    expect(published).toHaveLength(1)
    const evt = published[0].event
    expect(evt.event).toBe("position")
    expect(evt.objId).toBe("sat1")
    expect(close(evt.value.x, 10)).toBe(true)
    expect(close(evt.value.y, 0)).toBe(true)
    expect(close(evt.value.z, 0)).toBe(true)
  })

  it("includes the correct stationId", () => {
    const { mqtt, influx, publish, published, send } = makeMocks()
    registerMqttHandlers(mqtt as any, influx as any, publish)

    send("slr/station-alpha/tracking/lageos1/pos", JSON.stringify({ az: 45, el: 45, dist: 5 }))

    expect(published[0].stationId).toBe("station-alpha")
    expect(published[0].event.objId).toBe("lageos1")
  })

  it("does not publish on invalid JSON payload", () => {
    const { mqtt, influx, publish, published, send } = makeMocks()
    registerMqttHandlers(mqtt as any, influx as any, publish)

    send("slr/test/tracking/sat1/pos", "INVALID")

    expect(published).toHaveLength(0)
  })

  it("does not publish when az/el/dist are missing", () => {
    const { mqtt, influx, publish, published, send } = makeMocks()
    registerMqttHandlers(mqtt as any, influx as any, publish)

    send("slr/test/tracking/sat1/pos", JSON.stringify({ az: 10 })) // missing el, dist

    expect(published).toHaveLength(0)
  })

  it("calls writePosition (influx.writePoint)", async () => {
    const { mqtt, influx, published, send, writtenPoints } = makeMocks()
    const publish = mock(() => {})
    registerMqttHandlers(mqtt as any, influx as any, publish)

    send("slr/test/tracking/sat1/pos", JSON.stringify({ az: 0, el: 90, dist: 1 }))

    // Allow the async writePosition to settle
    await new Promise(r => setTimeout(r, 10))
    expect(writtenPoints.length).toBeGreaterThan(0)
    expect(writtenPoints[0].bucket).toBe("test")
  })
})

// ── WS command → MQTT publish ─────────────────────────────────────────────────

describe("WS command handler — fire / stop → MQTT", () => {
  it("publishes fire command to correct MQTT topic", () => {
    const mqttPublish = mock(() => {})
    const cmdRef = {
      handle: (stationId: string, action: "fire" | "stop", objId: string) => {
        mqttPublish(`slr/${stationId}/cmd`, JSON.stringify({ action, objId }))
      },
    }

    cmdRef.handle("test", "fire", "sat1")

    expect(mqttPublish).toHaveBeenCalledWith(
      "slr/test/cmd",
      JSON.stringify({ action: "fire", objId: "sat1" })
    )
  })

  it("publishes stop command to correct MQTT topic", () => {
    const mqttPublish = mock(() => {})
    const cmdRef = {
      handle: (stationId: string, action: "fire" | "stop", objId: string) => {
        mqttPublish(`slr/${stationId}/cmd`, JSON.stringify({ action, objId }))
      },
    }

    cmdRef.handle("alpha", "stop", "lageos1")

    expect(mqttPublish).toHaveBeenCalledWith(
      "slr/alpha/cmd",
      JSON.stringify({ action: "stop", objId: "lageos1" })
    )
  })
})