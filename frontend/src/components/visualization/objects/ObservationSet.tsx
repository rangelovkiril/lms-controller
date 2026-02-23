"use client";

import { useMemo } from "react";
import { BufferGeometry, BufferAttribute, Vector3 } from "three";
import { speedToColor, speedT } from "./trajectoryUtils";

interface Props {
  points:    Vector3[];
  minSpeed?: number;
  maxSpeed?: number;
  opacity?:  number;
}

export default function ObservationSet({
  points,
  minSpeed = 0,
  maxSpeed = 0.5,
  opacity  = 0.85,
}: Props) {
  const geo = useMemo(() => {
    const total     = points.length;
    const positions = new Float32Array(total * 3);
    const colors    = new Float32Array(total * 3);

    for (let k = 0; k < total; k++) {
      const p = points[k];
      positions[k * 3]     = p.x;
      positions[k * 3 + 1] = p.y;
      positions[k * 3 + 2] = p.z;

      const segLen    = k === 0 ? 0 : points[k].distanceTo(points[k - 1]);
      const ageFactor = 0.05 + 0.95 * (k / Math.max(total - 1, 1));
      speedToColor(speedT(segLen, minSpeed, maxSpeed), ageFactor, colors, k * 3);
    }

    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(positions, 3));
    geo.setAttribute("color",    new BufferAttribute(colors,    3));
    geo.computeBoundingSphere();
    return geo;
  }, [points, minSpeed, maxSpeed]);

  useMemo(() => () => geo.dispose(), [geo]);

  return (
    <line>
      <primitive object={geo} attach="geometry" />
      <lineBasicMaterial vertexColors transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </line>
  );
}