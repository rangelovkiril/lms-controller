export function toSpherical(x: number, y: number, z: number): { az: number, el: number, dist: number } {
  const dist = Math.hypot(x, y, z)

  if (dist === 0) return { az: 0, el: 0, dist }

  const el = Math.asin(z / dist) * (180 / Math.PI)
  const az = Math.atan2(y, x) * (180 / Math.PI)

  return { az, el, dist }
}

export function toCartesian(r: number, theta: number, phi: number, useDegrees: boolean = false): { x: number, y: number, z: number } {
  const t = useDegrees ? theta * (Math.PI / 180) : theta
  const p = useDegrees ? phi   * (Math.PI / 180) : phi

  return {
    x: r * Math.sin(p) * Math.cos(t),
    y: r * Math.sin(p) * Math.sin(t),
    z: r * Math.cos(p),
  }
}
