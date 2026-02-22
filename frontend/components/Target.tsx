"use client";
import { useRef, Suspense } from "react";
import { useFrame }         from "@react-three/fiber";
import { Vector3, Group }   from "three";
import { useModel }         from "@/hooks/useModel";

interface TargetProps {
  targetPosVec: React.RefObject<Vector3>;
}

// Вътрешен компонент — зарежда .glb, обвит в Suspense отвън
function SatelliteModel({ groupRef }: { groupRef: React.RefObject<Group> }) {
  const { scene } = useModel("/satellite.glb");
  return <primitive object={scene} scale={0.5} />;
}

// Placeholder докато моделът се зарежда или при грешка
function PlaceholderModel() {
  return (
    <>
      <mesh>
        <octahedronGeometry args={[0.28]} />
        <meshStandardMaterial color="#00dc82" emissive="#00dc82" emissiveIntensity={0.6} wireframe />
      </mesh>
      <mesh>
        <octahedronGeometry args={[0.38]} />
        <meshStandardMaterial color="#00dc82" emissive="#00dc82" emissiveIntensity={0.15} wireframe transparent opacity={0.25} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshBasicMaterial color="#00dc82" toneMapped={false} />
      </mesh>
      <pointLight color="#00dc82" intensity={2} distance={4} />
    </>
  );
}

export default function Target({ targetPosVec }: TargetProps) {
  const groupRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (targetPosVec.current) {
      groupRef.current.position.lerp(targetPosVec.current, delta * 2);
    }
    groupRef.current.rotation.y += delta * 0.6;
    groupRef.current.rotation.x += delta * 0.3;
  });

  return (
    <group ref={groupRef}>
      {/* Suspense показва placeholder докато .glb се зарежда */}
      <Suspense fallback={<PlaceholderModel />}>
        <SatelliteModel groupRef={groupRef} />
      </Suspense>
    </group>
  );
}