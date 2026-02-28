import { Point } from "@influxdata/influxdb-client"
import { InfluxDecorator } from "../types"
import { toCartesian } from "../utils/coordinates"

const IMPORTED_BUCKET = "imported"

export interface ObservationPoint {
  timestamp?: string
  time?: string
  az?: number
  el?: number
  dist?: number
  x?: number
  y?: number
  z?: number
}

export interface ObservationResult {
  count: number
  setName: string
}

export const ObservationService = {
  async createFromImport(
    influx: InfluxDecorator,
    setName: string,
    filesData: ObservationPoint[][]
  ): Promise<ObservationResult> {
    const points: Point[] = []

    for (const rows of filesData) {
      for (const row of rows) {
        const { az, el, dist, x, y, z } = row
        const rowTime = row.time ?? row.timestamp

        const hasSpherical = az != null && el != null && dist != null
        const hasCartesian  = x  != null && y  != null && z  != null

        if (!hasSpherical && !hasCartesian) {
          console.warn(`[Observations] Row skipped — missing coordinates:`, row)
          continue
        }

        const spherical = hasSpherical
          ? { az: az!, el: el!, dist: dist! }
          : { az: 0, el: 0, dist: 0 } 

        const cartesian = hasCartesian
          ? { x: x!, y: y!, z: z! }
          : toCartesian(spherical.dist, spherical.az, spherical.el, true)

        const point = new Point(setName)
          .floatField("az",   spherical.az)
          .floatField("el",   spherical.el)
          .floatField("dist", spherical.dist)
          .floatField("x",    cartesian.x)
          .floatField("y",    cartesian.y)
          .floatField("z",    cartesian.z)

        if (rowTime) point.timestamp(new Date(rowTime))

        points.push(point)
      }
    }

    points.forEach(point => influx.writePoint(point, IMPORTED_BUCKET))

    return { count: points.length, setName }
  },
}
