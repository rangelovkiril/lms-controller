"use client";

import { useRef, useMemo, useEffect, RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BufferGeometry,
  BufferAttribute,
  DynamicDrawUsage,
  Vector3,
  Group,
  CatmullRomCurve3,
} from "three";

import { hueToRGB, speedToHue } from "./trajectoryUtils";

// Hard ceiling on stored control points. Arc-length eviction is the primary
// trim mechanism; this just prevents unbounded growth if eviction stalls.
const MAX_CTRL_PTS = 400;

interface Props {
  renderedGroupRef: RefObject<Group>;
  /**
   * Maximum trail length in Three.js world units.
   * Segments whose cumulative arc length exceeds this are evicted from the
   * head of the buffer. Tune this to match your coordinate scale:
   *   - positions in metres   → try 5 000 – 50 000
   *   - positions in km       → try 5 – 50
   *   - normalised/unit scene → try 2 – 20
   */
  maxArcLength?: number;
  minSpeed?:     number;
  maxSpeed?:     number;
  opacity?:      number;
  /**
   * CatmullRom subdivisions per control-point segment.
   * 1 = raw segments (original behaviour), 6 = smooth, 12 = very smooth.
   */
  smoothSteps?:  number;
}

export default function Trace({
  renderedGroupRef,
  maxArcLength = 10,
  minSpeed     = 0,
  maxSpeed     = 0.5,
  opacity      = 0.85,
  smoothSteps  = 6,
}: Props) {

  // ── Control-point ring buffer ─────────────────────────────────────────────
  const ctrlPositions  = useRef(new Float32Array(MAX_CTRL_PTS * 3));
  const ctrlSegLengths = useRef(new Float32Array(MAX_CTRL_PTS));
  const ctrlCount      = useRef(0);
  const arcLength      = useRef(0);
  const prevPos        = useRef(new Vector3(Infinity, Infinity, Infinity));

  // ── Smooth render buffer ──────────────────────────────────────────────────
  const renderCap = MAX_CTRL_PTS * smoothSteps;

  const { geo, posAttr, colAttr, renderPositions, renderColors } = useMemo(() => {
    const renderPositions = new Float32Array(renderCap * 3);
    const renderColors    = new Float32Array(renderCap * 3);

    const posAttr = new BufferAttribute(renderPositions, 3);
    const colAttr = new BufferAttribute(renderColors, 3);
    posAttr.setUsage(DynamicDrawUsage);
    colAttr.setUsage(DynamicDrawUsage);

    const geo = new BufferGeometry();
    geo.setAttribute("position", posAttr);
    geo.setAttribute("color",    colAttr);
    geo.setDrawRange(0, 0);

    return { geo, posAttr, colAttr, renderPositions, renderColors };
  }, [renderCap]);

  useEffect(() => () => geo.dispose(), [geo]);

  // ── Pre-allocated scratch objects (zero per-frame heap allocation) ────────
  const ctrlVec3Pool = useRef(
    Array.from({ length: MAX_CTRL_PTS }, () => new Vector3())
  );
  const curve  = useRef(new CatmullRomCurve3([], false, "centripetal", 0.5));
  const tmpVec = useRef(new Vector3());

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

    // Evict oldest segments to stay within maxArcLength
    while (ctrlCount.current > 1 && arcLength.current > maxArcLength) {
      arcLength.current -= ctrlSegLengths.current[1];
      ctrlPositions.current.copyWithin(0, 3, ctrlCount.current * 3);
      ctrlSegLengths.current.copyWithin(0, 1, ctrlCount.current);
      ctrlCount.current--;
    }

    // Hard cap
    if (ctrlCount.current >= MAX_CTRL_PTS) {
      arcLength.current -= ctrlSegLengths.current[1];
      ctrlPositions.current.copyWithin(0, 3, MAX_CTRL_PTS * 3);
      ctrlSegLengths.current.copyWithin(0, 1, MAX_CTRL_PTS);
      ctrlCount.current--;
    }

    const idx = ctrlCount.current;
    ctrlPositions.current[idx * 3]     = pos.x;
    ctrlPositions.current[idx * 3 + 1] = pos.y;
    ctrlPositions.current[idx * 3 + 2] = pos.z;
    ctrlSegLengths.current[idx]        = segLen;
    ctrlCount.current++;

    prevPos.current.copy(pos);

    const n = ctrlCount.current;
    if (n < 2) return;

    // ── Update curve control points in-place (no Vector3 allocation) ────────
    const pool = ctrlVec3Pool.current;
    for (let i = 0; i < n; i++) {
      pool[i].set(
        ctrlPositions.current[i * 3],
        ctrlPositions.current[i * 3 + 1],
        ctrlPositions.current[i * 3 + 2],
      );
    }
    // Reassigning .points is a cheap JS array-ref swap, not a deep copy
    curve.current.points = pool.slice(0, n);

    // ── Sample the smooth curve into the render buffer ───────────────────────
    const renderCount = Math.min((n - 1) * smoothSteps + 1, renderCap);
    const speedRange  = Math.max(maxSpeed - minSpeed, 1e-6);

    for (let i = 0; i < renderCount; i++) {
      const t = i / (renderCount - 1);

      // getPoint writes into tmpVec — no allocation per call
      curve.current.getPoint(t, tmpVec.current);
      renderPositions[i * 3]     = tmpVec.current.x;
      renderPositions[i * 3 + 1] = tmpVec.current.y;
      renderPositions[i * 3 + 2] = tmpVec.current.z;

      // Map smooth-curve t back to nearest control segment for speed/color
      const ctrlF     = t * (n - 1);
      const ctrlIdx   = Math.min(Math.floor(ctrlF), n - 2);
      const speed     = Math.max(0, ctrlSegLengths.current[ctrlIdx + 1] - minSpeed);
      const st        = Math.min(speed / speedRange, 1);
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