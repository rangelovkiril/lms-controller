"use client";
import { useRef, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, Grid } from "@react-three/drei";
import { Group, Vector3 } from "three";
import { SceneContent, type TrajectoryConfig } from "./SceneContent";
import ObservationSet from "./objects/ObservationSet";
import StationModel from "./objects/StationModel";
import type { ObsSet } from "@/types";

const BG = "#0a0f1a";

const TRAJECTORY_DEFAULTS: Required<TrajectoryConfig> = {
  maxArcLength: 60,
  minSpeed: 0,
  maxSpeed: 0.5,
  opacity: 0.85,
  smoothSteps: 6,
};

export interface SceneProps {
  targetPosVec: React.RefObject<Vector3>;
  trajectory?: TrajectoryConfig;
  observationSets?: ObsSet[];
}

export default function Scene({
  targetPosVec,
  trajectory = {},
  observationSets = [],
}: SceneProps) {
  const targetRef = useRef<Group>(null!);
  const resolvedTrajectory = { ...TRAJECTORY_DEFAULTS, ...trajectory };

  return (
    <Canvas
      camera={{ position: [8, 5, 8], near: 0.1, far: 500 }}
      gl={{ antialias: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={[BG]} />

      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} color="#ffffff" />
      <directionalLight
        position={[-5, 8, -5]}
        intensity={0.5}
        color="#7eb8ff"
      />

      <Suspense fallback={null}>
        {/* Звезди */}
        <Stars
          radius={120}
          depth={60}
          count={8000}
          factor={5}
          saturation={0.3}
          fade
          speed={0.3}
        />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <planeGeometry args={[2000, 2000]} />
          <meshBasicMaterial color={BG} />
        </mesh>

        <Grid
          infiniteGrid
          fadeDistance={500}
          fadeStrength={1}
          cellSize={0.75}
          cellColor="#1a2540"
          sectionSize={3}
          sectionColor="#2a3f6f"
        />

        <StationModel />

        {/* Observation sets */}
        {observationSets
          .filter((s) => s.visible && s.points.length > 1)
          .map((s) => (
            <ObservationSet
              key={s.id}
              points={s.points}
              minSpeed={resolvedTrajectory.minSpeed}
              maxSpeed={resolvedTrajectory.maxSpeed}
              opacity={resolvedTrajectory.opacity}
              baseColor={s.color ?? undefined}
            />
          ))}

        <SceneContent
          targetRef={targetRef}
          targetPosVec={targetPosVec}
          trajectory={resolvedTrajectory}
        />
      </Suspense>

      <OrbitControls
        makeDefault
        zoomSpeed={0.6}
        rotateSpeed={0.5}
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={2}
        maxDistance={120}
      />
    </Canvas>
  );
}
