"use client";
import { useRef, Suspense, forwardRef, useImperativeHandle } from "react";
import { useFrame }       from "@react-three/fiber";
import { Vector3, Group } from "three";
import SatelliteModel     from "./SatelliteModel";

interface TargetProps {
  targetPosVec: React.RefObject<Vector3>;
}

const Target = forwardRef<Group, TargetProps>(function Target(
  { targetPosVec },
  ref,
) {
  const groupRef = useRef<Group>(null!);

  useImperativeHandle(ref, () => groupRef.current, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (targetPosVec.current) {
      groupRef.current.position.lerp(targetPosVec.current, delta / 2);
    }
    // groupRef.current.rotation.y += delta * 0.6;
    // groupRef.current.rotation.x += delta * 0.3;
  });

  return (
    <group ref={groupRef}>
      <Suspense>
        <SatelliteModel groupRef={groupRef} />
      </Suspense>
    </group>
  );
});

export default Target;