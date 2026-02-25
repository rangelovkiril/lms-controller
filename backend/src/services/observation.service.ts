import { Point } from "@influxdata/influxdb-client";
import { toSpherical } from "../utils/coordinates";

export const ObservationService = {
  async createFromImport(influx: any, setName: string, filesData: any[][]) {
    const bucket = "imported";
    let totalPoints = 0;

    for (const rawData of filesData) {
      for (const row of rawData) {
        const { x, y, z, az, el, dist, time, timestamp } = row;
        const rowTime = time || timestamp;

        const coords = (x !== undefined && y !== undefined && z !== undefined)
          ? toSpherical(x, y, z)
          : { az: az ?? 0, el: el ?? 0, dist: dist ?? 0 };

        const point = new Point(setName)
          .floatField("az", coords.az)
          .floatField("el", coords.el)
          .floatField("dist", coords.dist);

        if (rowTime) point.timestamp(new Date(rowTime));
        
        await influx.writePoint(point, bucket);
        totalPoints++;
      }
    }

    return { count: totalPoints, setName };
  }
};