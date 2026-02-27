"use client";
import { useRef, Suspense, forwardRef, useImperativeHandle, useCallback } from "react";
import { useFrame }       from "@react-three/fiber";
import { Vector3, Group } from "three";
import SatelliteModel     from "./SatelliteModel";

const FOLLOW_SPEED = 8;

interface TargetProps {
  targetPosVec: React.RefObject<Vector3>;
  readyRef:     React.RefObject<boolean>; // set true when model loaded + teleported
}

const Target = forwardRef<Group, TargetProps>(function Target({ targetPosVec, readyRef }, ref) {
  const groupRef    = useRef<Group>(null!);
  const initialized = useRef(false);

  useImperativeHandle(ref, () => groupRef.current, []);

  const handleModelLoad = useCallback(() => {
    // Model is loaded — teleport to current position and mark ready
    if (groupRef.current && targetPosVec.current) {
      groupRef.current.position.copy(targetPosVec.current);
    }
    initialized.current  = true;
    readyRef.current     = true;
  }, [targetPosVec, readyRef]);

  useFrame((_, delta) => {
    if (!groupRef.current || !targetPosVec.current || !initialized.current) return;
    const dist  = groupRef.current.position.distanceTo(targetPosVec.current);
    const alpha = Math.min(1, dist * FOLLOW_SPEED * delta);
    groupRef.current.position.lerp(targetPosVec.current, alpha);
  });

  return (
    <group ref={groupRef}>
      <Suspense>
        <SatelliteModel onLoad={handleModelLoad} />
      </Suspense>
    </group>
  );
});

export default Target;