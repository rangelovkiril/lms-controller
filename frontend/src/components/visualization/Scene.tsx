"use client";
import { useRef, Suspense }                   from "react";
import { Canvas }                             from "@react-three/fiber";
import { OrbitControls, Grid, Stars }         from "@react-three/drei";
import { Group, Vector3 }                     from "three";
import { SceneContent, type TrajectoryConfig } from "./SceneContent";
import ObservationSet                          from "./objects/ObservationSet";
import type { ObsSet }                         from "@/types";

const BG = "#0a0f1a";

const TRAJECTORY_DEFAULTS: Required<TrajectoryConfig> = {
  maxArcLength: 60,
  minSpeed:     0,
  maxSpeed:     0.5,
  opacity:      0.85,
  smoothSteps:  6,
};

export interface SceneProps {
  targetPosVec:     React.RefObject<Vector3>;
  trajectory?:      TrajectoryConfig;
  observationSets?: ObsSet[];
}

export default function Scene({
  targetPosVec,
  trajectory      = {},
  observationSets = [],
}: SceneProps) {
  const targetRef          = useRef<Group>(null!);
  const resolvedTrajectory = { ...TRAJECTORY_DEFAULTS, ...trajectory };

  return (
    <Canvas camera={{ position: [5, 5, 5] }} style={{ width: "100%", height: "100%" }}>
      <color attach="background" args={[BG]} />
      <fog   attach="fog"        args={[BG, 20, 70]} />

      <ambientLight intensity={0.6} />
      <directionalLight position={[5,  10,  5]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-5,  8, -5]} intensity={0.5} color="#7eb8ff" />

      <Suspense fallback={null}>
        <Grid
          infiniteGrid
          fadeDistance={500}
          sectionSize={3}
          cellSize={0.75}
          cellColor="#1a2540"
          sectionColor="#2a3f6f"
          fadeStrength={1}
        />

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
          ))
        }

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <planeGeometry args={[2000, 2000]} />
          <meshBasicMaterial color={BG} />
        </mesh>

        <Stars radius={120} depth={60} count={8000} factor={5} saturation={0.3} fade speed={0.3} />

        <SceneContent
          targetRef={targetRef}
          targetPosVec={targetPosVec}
          trajectory={resolvedTrajectory}
        />
      </Suspense>

      <OrbitControls maxPolarAngle={Math.PI} makeDefault zoomSpeed={0.6} rotateSpeed={0.5} />
    </Canvas>
  );
}