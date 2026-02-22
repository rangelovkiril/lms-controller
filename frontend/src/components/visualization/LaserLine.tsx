"use client";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferGeometry, Float32BufferAttribute, Vector3 } from "three";

interface LaserLineProps {
  targetPosVec: React.RefObject<Vector3>;
  isFiring:     boolean;
}

export default function LaserLine({ targetPosVec, isFiring }: LaserLineProps) {
  const blinkTimer = useRef(0);
  const visible    = useRef(true);
  const lineRef    = useRef<any>(null);

  const BLINK_ON  = 0.08;
  const BLINK_OFF = 0.04;

  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    const positions = new Float32Array([0, 0, 0, 0, 0, 0]);
    geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((_, delta) => {
    if (!isFiring || !targetPosVec.current) return;

    const t = targetPosVec.current;
    const pos = geometry.attributes.position;
    pos.setXYZ(1, t.x, t.y, t.z);
    pos.needsUpdate = true;

    if (!lineRef.current) return;
    blinkTimer.current += delta;
    const interval = visible.current ? BLINK_ON : BLINK_OFF;
    if (blinkTimer.current >= interval) {
      blinkTimer.current = 0;
      visible.current = !visible.current;
      lineRef.current.visible = visible.current;
    }
  });

  if (!isFiring) return null;

  return (
    <line ref={lineRef} geometry={geometry}>
      <lineBasicMaterial color="#00dc82" toneMapped={false} />
    </line>
  );
}