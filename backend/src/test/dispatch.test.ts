import { describe, it, expect, mock } from "bun:test"
import { createDispatcher } from "../../src/services/dispatch.service"

describe("createDispatcher — routing", () => {
  it("routes a static topic", () => {
    const handler = mock(() => {})
    const dispatch = createDispatcher({ "slr/test/status": handler })
    dispatch("slr/test/status", "payload")
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith({}, "payload")
  })

  it("extracts a single param", () => {
    const handler = mock((_p: Record<string, string>) => {})
    const dispatch = createDispatcher({ "slr/:stationId/status": handler })
    dispatch("slr/alpha/status", "data")
    expect(handler.mock.calls[0][0]).toEqual({ stationId: "alpha" })
  })

  it("extracts multiple params", () => {
    const handler = mock((_p: Record<string, string>) => {})
    const dispatch = createDispatcher({ "slr/:stationId/tracking/:objId/pos": handler })
    dispatch("slr/test/tracking/sat1/pos", "{}")
    expect(handler.mock.calls[0][0]).toEqual({ stationId: "test", objId: "sat1" })
  })

  it("does not match a topic with wrong segment count", () => {
    const handler = mock(() => {})
    const dispatch = createDispatcher({ "slr/:id/status": handler })
    dispatch("slr/test/status/extra", "x")
    expect(handler).not.toHaveBeenCalled()
  })

  it("does not match a topic with wrong static segment", () => {
    const handler = mock(() => {})
    const dispatch = createDispatcher({ "slr/:id/status": handler })
    dispatch("slr/test/env", "x")
    expect(handler).not.toHaveBeenCalled()
  })

  it("calls only the first matching route", () => {
    const h1 = mock(() => {})
    const h2 = mock(() => {})
    const dispatch = createDispatcher({
      "slr/:id/status": h1,
      "slr/:any/status": h2,
    })
    dispatch("slr/test/status", "x")
    expect(h1).toHaveBeenCalledTimes(1)
    expect(h2).not.toHaveBeenCalled()
  })

  it("forwards payload as second argument", () => {
    const handler = mock((_p: unknown, payload: string) => payload)
    const dispatch = createDispatcher({ "a/b/c": handler })
    dispatch("a/b/c", '{"key":"value"}')
    expect(handler.mock.calls[0][1]).toBe('{"key":"value"}')
  })
})
