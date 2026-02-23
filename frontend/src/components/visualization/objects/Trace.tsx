"use client";

import { useRef, useMemo, RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BufferGeometry,
  BufferAttribute,
  DynamicDrawUsage,
  Vector3,
  Group,
} from "three";

import { hueToRGB, speedToHue } from "./trajectoryUtils";

interface Props {
  renderedGroupRef: RefObject<Group>;
  maxArcLength?: number;
  minSpeed?:     number;
  maxSpeed?:     number;
  opacity?:      number;
  pointsPerUnit?: number;
}

export default function Trace({
  renderedGroupRef,
  maxArcLength = 2,
  minSpeed     = 0,
  maxSpeed     = 0.5,
  opacity      = 0.85,
  pointsPerUnit = 2, 
}: Props) {

  
  const bufferCapacity = useMemo(() => {
    return Math.ceil(maxArcLength * pointsPerUnit) + 100; 
  }, [maxArcLength, pointsPerUnit]);

  const { geo, posAttr, colAttr, positions, colors } = useMemo(() => {
    const posArr = new Float32Array(bufferCapacity * 3);
    const colArr = new Float32Array(bufferCapacity * 3);

    const posAttr = new BufferAttribute(posArr, 3);
    const colAttr = new BufferAttribute(colArr, 3);
    posAttr.setUsage(DynamicDrawUsage);
    colAttr.setUsage(DynamicDrawUsage);

    const geo = new BufferGeometry();
    geo.setAttribute("position", posAttr);
    geo.setAttribute("color",    colAttr);
    geo.setDrawRange(0, 0);

    return { geo, posAttr, colAttr, positions: posArr, colors: colArr };
  }, [bufferCapacity]);

  useMemo(() => () => geo.dispose(), [geo]);

  const segLengths = useRef(new Float32Array(bufferCapacity));
  const count      = useRef(0);
  const arcLength  = useRef(0);
  const prevPos    = useRef(new Vector3(Infinity, Infinity, Infinity));

  useFrame(() => {
    if (!renderedGroupRef.current) return;
    const pos = renderedGroupRef.current.position;

    if (!isFinite(prevPos.current.x)) {
      prevPos.current.copy(pos);
      return;
    }

    const movedSq = pos.distanceToSquared(prevPos.current);
    if (movedSq < 1e-8) return;

    const segLen = Math.sqrt(movedSq);
    arcLength.current += segLen;

    while (count.current > 1 && arcLength.current > maxArcLength) {
      arcLength.current -= segLengths.current[1];
      
      positions.copyWithin(0, 3, count.current * 3);
      colors.copyWithin(0, 3, count.current * 3);
      segLengths.current.copyWithin(0, 1, count.current);
      
      count.current--;
    }

    if (count.current >= bufferCapacity) {
      arcLength.current -= segLengths.current[1];
      positions.copyWithin(0, 3, bufferCapacity * 3);
      colors.copyWithin(0, 3, bufferCapacity * 3);
      segLengths.current.copyWithin(0, 1, bufferCapacity);
      count.current--;
    }

    const idx = count.current;
    positions[idx * 3]     = pos.x;
    positions[idx * 3 + 1] = pos.y;
    positions[idx * 3 + 2] = pos.z;
    segLengths.current[idx] = segLen;
    count.current++;

    prevPos.current.copy(pos);

    const total = count.current;
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