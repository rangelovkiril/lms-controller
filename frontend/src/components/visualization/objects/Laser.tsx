"use client";
import { useRef, useMemo, useEffect } from "react";
import { useFrame }                   from "@react-three/fiber";
import {
  BufferGeometry, BufferAttribute, DynamicDrawUsage,
  Group, Line, LineBasicMaterial, Color,
} from "three";

const BLINK_ON  = 0.08;
const BLINK_OFF = 0.04;

interface LaserProps {
  targetRef: React.RefObject<Group>;
}

export default function Laser({ targetRef }: LaserProps) {
  const blinkTimer = useRef(0);
  const visible    = useRef(true);

  const { line, posAttr } = useMemo(() => {
    const arr    = new Float32Array([0, 0, 0, 0, 0, 0]);
    const posAttr = new BufferAttribute(arr, 3);
    posAttr.setUsage(DynamicDrawUsage);

    const geo = new BufferGeometry();
    geo.setAttribute("position", posAttr);

    const mat  = new LineBasicMaterial({ color: new Color("#00dc82"), toneMapped: false });
    const line = new Line(geo, mat);

    return { line, posAttr };
  }, []);

  useEffect(() => () => {
    line.geometry.dispose();
    (line.material as LineBasicMaterial).dispose();
  }, [line]);

  useFrame((_, delta) => {
    if (!targetRef.current) return;

    const { x, y, z } = targetRef.current.position;
    posAttr.setXYZ(1, x, y, z);
    posAttr.needsUpdate = true;

    blinkTimer.current += delta;
    const interval = visible.current ? BLINK_ON : BLINK_OFF;
    if (blinkTimer.current >= interval) {
      blinkTimer.current = 0;
      visible.current    = !visible.current;
    }
    line.visible = visible.current;
  });

  return <primitive object={line} />;
}