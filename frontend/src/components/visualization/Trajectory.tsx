"use client";

import { useRef, useMemo, RefObject } from "react";
import { useFrame }      from "@react-three/fiber";
import {
  BufferGeometry,
  BufferAttribute,
  DynamicDrawUsage,
  Vector3,
  Color,
  Group,
} from "three";

interface Props {
  renderedGroupRef: RefObject<Group>;
  maxPoints?:    number;
  maxArcLength?: number;
  minSpeed?:     number;
  maxSpeed?:     number;
  opacity?:      number;
}

function speedToHue(t: number): number {
  t = Math.max(0, Math.min(1, t));
  return (1 - t) * 240; 
}

const _tmpColor = new Color();

function hueToRGB(hue: number, out: Float32Array, offset: number) {
  _tmpColor.setHSL(hue / 360, 1, 0.55);
  out[offset]     = _tmpColor.r;
  out[offset + 1] = _tmpColor.g;
  out[offset + 2] = _tmpColor.b;
}

export default function Trajectory({
  renderedGroupRef,
  maxPoints    = 600,
  maxArcLength = 200,
  minSpeed     = 0,
  maxSpeed     = 0.5,
  opacity      = 0.85,
}: Props) {

  const { geo, posAttr, colAttr, positions, colors } = useMemo(() => {
    const posArr = new Float32Array(maxPoints * 3);
    const colArr = new Float32Array(maxPoints * 3);

    const posAttr = new BufferAttribute(posArr, 3);
    const colAttr = new BufferAttribute(colArr, 3);
    posAttr.setUsage(DynamicDrawUsage);
    colAttr.setUsage(DynamicDrawUsage);

    const geo = new BufferGeometry();
    geo.setAttribute("position", posAttr);
    geo.setAttribute("color",    colAttr);
    geo.setDrawRange(0, 0);

    return { geo, posAttr, colAttr, positions: posArr, colors: colArr };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

 
  useRef(null); 
  useMemo(() => () => geo.dispose(), [geo]);

  const segLengths = useRef(new Float32Array(maxPoints));
  const count      = useRef(0);
  const arcLength  = useRef(0);
  const prevPos    = useRef(new Vector3(Infinity, Infinity, Infinity));

  useFrame(() => {
    if (!renderedGroupRef.current) return;
    const pos = renderedGroupRef.current.position;

    const moved = pos.distanceToSquared(prevPos.current);
    if (moved < 1e-8) return;

    const segLen = count.current === 0 ? 0 : Math.sqrt(moved);

    arcLength.current += segLen;
    while (count.current > 1 && arcLength.current > maxArcLength) {
      const n = count.current;
      positions.copyWithin(0, 3, n * 3);
      colors.copyWithin(0, 3, n * 3);
      segLengths.current.copyWithin(0, 1, n);
      arcLength.current -= segLengths.current[0] ?? 0;
      count.current -= 1;
    }

    const n = count.current;
    if (n < maxPoints) {
      const i = n * 3;
      positions[i]     = pos.x;
      positions[i + 1] = pos.y;
      positions[i + 2] = pos.z;
      segLengths.current[n] = segLen;
      count.current += 1;
    } else {
      arcLength.current -= segLengths.current[0] ?? 0;
      positions.copyWithin(0, 3, n * 3);
      segLengths.current.copyWithin(0, 1, n);
      const i = (maxPoints - 1) * 3;
      positions[i]     = pos.x;
      positions[i + 1] = pos.y;
      positions[i + 2] = pos.z;
      segLengths.current[maxPoints - 1] = segLen;
    }

    prevPos.current.copy(pos);

    const total      = count.current;
    const speedRange = Math.max(maxSpeed - minSpeed, 1e-6);

    for (let k = 0; k < total; k++) {
      const speed     = Math.max(0, segLengths.current[k] - minSpeed);
      const t         = Math.min(speed / speedRange, 1);
      const ageFactor = 0.05 + 0.95 * (k / Math.max(total - 1, 1));
      const ci        = k * 3;
      hueToRGB(speedToHue(t), colors, ci);
      colors[ci]     *= ageFactor;
      colors[ci + 1] *= ageFactor;
      colors[ci + 2] *= ageFactor;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    geo.setDrawRange(0, total);
    geo.computeBoundingSphere();
  });

  return (
    <line>
      <primitive object={geo} attach="geometry" />
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={opacity}
        depthWrite={false}
        toneMapped={false}
      />
    </line>
  );
}