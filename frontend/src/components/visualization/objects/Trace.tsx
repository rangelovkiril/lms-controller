"use client";

import { useRef, useMemo, useEffect, RefObject } from "react";
import { useFrame }                              from "@react-three/fiber";
import {
  BufferGeometry, BufferAttribute, DynamicDrawUsage,
  Vector3, Group, CatmullRomCurve3,
} from "three";

import { hueToRGB, speedToHue } from "./trajectoryUtils";

const MAX_CTRL_PTS = 400;

// If raw target jumps more than this in one frame → tab was throttled / data gap
// Wipe the trace instead of drawing a false streak.
const MAX_SEGMENT_JUMP = 2.0;

interface TraceProps {
  targetRef:     RefObject<Group>;
  targetPosVec:  RefObject<Vector3>;
  readyRef:      RefObject<boolean>; // don't start until model is loaded
  maxArcLength?: number;
  minSpeed?:     number;
  maxSpeed?:     number;
  opacity?:      number;
  smoothSteps?:  number;
}

export default function Trace({
  targetRef,
  targetPosVec,
  readyRef,
  maxArcLength = 10,
  minSpeed     = 0,
  maxSpeed     = 0.5,
  opacity      = 0.85,
  smoothSteps  = 6,
}: TraceProps) {

  const ctrlPositions  = useRef(new Float32Array(MAX_CTRL_PTS * 3));
  const ctrlSegLengths = useRef(new Float32Array(MAX_CTRL_PTS));
  const ctrlCount      = useRef(0);
  const arcLength      = useRef(0);
  const prevLerpPos    = useRef(new Vector3(Infinity, Infinity, Infinity));
  const prevRawPos      = useRef(new Vector3(Infinity, Infinity, Infinity));
  const smoothedSpeed   = useRef(0);

  const renderCap = MAX_CTRL_PTS * smoothSteps;

  const { geo, posAttr, colAttr, renderPositions, renderColors } = useMemo(() => {
    const renderPositions = new Float32Array(renderCap * 3);
    const renderColors    = new Float32Array(renderCap * 3);
    const posAttr = new BufferAttribute(renderPositions, 3);
    const colAttr = new BufferAttribute(renderColors,    3);
    posAttr.setUsage(DynamicDrawUsage);
    colAttr.setUsage(DynamicDrawUsage);
    const geo = new BufferGeometry();
    geo.setAttribute("position", posAttr);
    geo.setAttribute("color",    colAttr);
    geo.setDrawRange(0, 0);
    return { geo, posAttr, colAttr, renderPositions, renderColors };
  }, [renderCap]);

  useEffect(() => () => geo.dispose(), [geo]);

  const ctrlVec3Pool = useRef(Array.from({ length: MAX_CTRL_PTS }, () => new Vector3()));
  const curve        = useRef(new CatmullRomCurve3([], false, "centripetal", 0.5));
  const tmpVec       = useRef(new Vector3());

  useFrame(() => {
    if (!readyRef.current || !targetRef.current || !targetPosVec.current) return;

    const lerpPos = targetRef.current.position;
    const rawPos  = targetPosVec.current;

    if (!isFinite(prevLerpPos.current.x)) {
      prevLerpPos.current.copy(lerpPos);
      prevRawPos.current.copy(rawPos);
      return;
    }

    const movedSq = lerpPos.distanceToSquared(prevLerpPos.current);
    if (movedSq < 1e-8) return;

    const rawSegLen = rawPos.distanceTo(prevRawPos.current);

    // Teleport detected → reset trace cleanly
    if (rawSegLen > MAX_SEGMENT_JUMP) {
      ctrlCount.current = 0;
      arcLength.current = 0;
      smoothedSpeed.current = 0;
      geo.setDrawRange(0, 0);
      prevLerpPos.current.copy(lerpPos);
      prevRawPos.current.copy(rawPos);
      return;
    }

    // Exponential moving average — smooths out per-packet jitter in color
    const EMA_ALPHA     = 0.15;
    smoothedSpeed.current = EMA_ALPHA * rawSegLen + (1 - EMA_ALPHA) * smoothedSpeed.current;

    arcLength.current += Math.sqrt(movedSq);

    while (ctrlCount.current > 1 && arcLength.current > maxArcLength) {
      arcLength.current -= ctrlSegLengths.current[1];
      ctrlPositions.current.copyWithin(0, 3, ctrlCount.current * 3);
      ctrlSegLengths.current.copyWithin(0, 1, ctrlCount.current);
      ctrlCount.current--;
    }

    if (ctrlCount.current >= MAX_CTRL_PTS) {
      arcLength.current -= ctrlSegLengths.current[1];
      ctrlPositions.current.copyWithin(0, 3, MAX_CTRL_PTS * 3);
      ctrlSegLengths.current.copyWithin(0, 1, MAX_CTRL_PTS);
      ctrlCount.current--;
    }

    const idx = ctrlCount.current;
    ctrlPositions.current[idx * 3]     = lerpPos.x;
    ctrlPositions.current[idx * 3 + 1] = lerpPos.y;
    ctrlPositions.current[idx * 3 + 2] = lerpPos.z;
    ctrlSegLengths.current[idx]        = smoothedSpeed.current;
    ctrlCount.current++;

    prevLerpPos.current.copy(lerpPos);
    prevRawPos.current.copy(rawPos);

    const n = ctrlCount.current;
    if (n < 2) return;

    const pool = ctrlVec3Pool.current;
    for (let i = 0; i < n; i++) {
      pool[i].set(
        ctrlPositions.current[i * 3],
        ctrlPositions.current[i * 3 + 1],
        ctrlPositions.current[i * 3 + 2],
      );
    }
    curve.current.points = pool.slice(0, n);

    const renderCount = Math.min((n - 1) * smoothSteps + 1, renderCap);
    const speedRange  = Math.max(maxSpeed - minSpeed, 1e-6);

    for (let i = 0; i < renderCount; i++) {
      const t = i / (renderCount - 1);

      curve.current.getPoint(t, tmpVec.current);
      renderPositions[i * 3]     = tmpVec.current.x;
      renderPositions[i * 3 + 1] = tmpVec.current.y;
      renderPositions[i * 3 + 2] = tmpVec.current.z;

      const ctrlF    = t * (n - 1);
      const ctrlIdx  = Math.min(Math.floor(ctrlF), n - 2);
      const ctrlFrac = ctrlF - ctrlIdx;
      const s0       = ctrlSegLengths.current[ctrlIdx];
      const s1       = ctrlSegLengths.current[ctrlIdx + 1];
      const speed    = Math.max(0, s0 + (s1 - s0) * ctrlFrac - minSpeed);
      const st       = Math.min(speed / speedRange, 1);

      const ageFactor = 0.05 + 0.95 * (i / Math.max(renderCount - 1, 1));
      const ci        = i * 3;

      hueToRGB(speedToHue(st), renderColors, ci);
      renderColors[ci]     *= ageFactor;
      renderColors[ci + 1] *= ageFactor;
      renderColors[ci + 2] *= ageFactor;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    geo.setDrawRange(0, renderCount);
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