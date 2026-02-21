"use client";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, BufferGeometry, Float32BufferAttribute } from "three";

interface LaserLineProps {
  targetPosVec: React.RefObject<Vector3>;
  isFiring: boolean;
}

export default function LaserLine({ targetPosVec, isFiring }: LaserLineProps) {
  const lineRef = useRef<null>(null);
  const endPoint = useRef(new Vector3());
  const blinkTimer = useRef(0);
  const visible = useRef(true);

  const BLINK_ON  = 0.08;
  const BLINK_OFF = 0.04;

  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    geo.setAttribute(
      "position",
      new Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3)
    );
    return geo;
  }, []);

  useFrame((_, delta) => {
    if (!isFiring || !lineRef.current) return;

    endPoint.current.lerp(targetPosVec.current, 0.1);

    const positions = lineRef.current.geometry.attributes.position;
    positions.setXYZ(1, endPoint.current.x, endPoint.current.y, endPoint.current.z);
    positions.needsUpdate = true;

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
      <lineBasicMaterial color="#00dc82" linewidth={1.5} />
    </line>
  );
}