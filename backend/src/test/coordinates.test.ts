import { describe, it, expect } from "bun:test"
import { toCartesian, toSpherical } from "../../src/utils/coordinates"

const DEG = Math.PI / 180
const EPSILON = 1e-6

function close(a: number, b: number, eps = EPSILON) {
  return Math.abs(a - b) < eps
}

describe("toCartesian (degrees)", () => {
  it("unit vector along x-axis: az=0, el=90 (polar) → (0, 0, 1) nope…", () => {
    // az=0, el=0 (polar angle 0 = along z-axis)
    const r = toCartesian(1, 0, 0, true)
    expect(close(r.x, 0)).toBe(true)
    expect(close(r.y, 0)).toBe(true)
    expect(close(r.z, 1)).toBe(true)
  })

  it("az=90°, el=90° (equatorial x-y plane) → (0, 1, 0)", () => {
    const r = toCartesian(1, 90, 90, true)
    expect(close(r.x, 0,   1e-5)).toBe(true)
    expect(close(r.y, 1,   1e-5)).toBe(true)
    expect(close(r.z, 0,   1e-5)).toBe(true)
  })

  it("scales by r", () => {
    const r = toCartesian(5, 0, 90, true)  // az=0, el=90 → along x
    expect(close(r.x, 5, 1e-5)).toBe(true)
  })

  it("radians mode gives same result as manual conversion", () => {
    const az = 45 * DEG
    const el = 60 * DEG
    const dist = 10
    const deg = toCartesian(dist, 45, 60, true)
    const rad = toCartesian(dist, az,  el,  false)
    expect(close(deg.x, rad.x)).toBe(true)
    expect(close(deg.y, rad.y)).toBe(true)
    expect(close(deg.z, rad.z)).toBe(true)
  })
})

describe("mock sensor round-trip: cartesian → spherical → toCartesian", () => {
  // Replicate exactly what mockMqtt does
  const RAD2DEG = 180 / Math.PI

  function mockCartesianToSpherical(x: number, y: number, z: number) {
    const dist = Math.hypot(x, y, z)
    if (dist === 0) return { az: 0, el: 0, dist: 0 }
    return {
      az:   Math.atan2(y, x) * RAD2DEG,
      el:   Math.acos(z / dist) * RAD2DEG,
      dist,
    }
  }

  const CASES: [string, number, number, number][] = [
    ["on x-axis",       10,  0,  0],
    ["on y-axis",        0, 10,  0],
    ["on z-axis",        0,  0, 10],
    ["positive octant",  3,  4,  5],
    ["negative x",      -6,  0,  8],
    ["heart point",      7.2, 12, -4.8],
  ]

  for (const [label, cx, cy, cz] of CASES) {
    it(`round-trips ${label} (${cx}, ${cy}, ${cz})`, () => {
      const { az, el, dist } = mockCartesianToSpherical(cx, cy, cz)
      const back = toCartesian(dist, az, el, true)
      expect(close(back.x, cx, 1e-4)).toBe(true)
      expect(close(back.y, cy, 1e-4)).toBe(true)
      expect(close(back.z, cz, 1e-4)).toBe(true)
    })
  }

  it("zero vector stays zero", () => {
    const s = mockCartesianToSpherical(0, 0, 0)
    expect(s.dist).toBe(0)
    expect(s.az).toBe(0)
    expect(s.el).toBe(0)
  })
})