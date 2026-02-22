"use client";
import { useRef, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Stars } from "@react-three/drei";
import { Group } from "three";

import { SceneContent, TrajectoryConfig } from "./SceneContent";
import { useTracking } from "@/hooks/useTracking";
import { TrackingPosition } from "@/lib/ws/tracking";

const BG = "#0a0f1a";

const TRAJECTORY_DEFAULTS: Required<TrajectoryConfig> = {
  maxPoints:    600,
  maxArcLength: 200,
  minSpeed:     0,
  maxSpeed:     0.5,
  opacity:      0.85,
};

export interface SceneProps {
  wsUrl:            string;
  stationId:        string;
  objectId:         string;
  trajectory?:      TrajectoryConfig;
  onStatusChange:   (status: "CONNECTED" | "DISCONNECTED") => void;
  onPositionChange: (pos: TrackingPosition | null) => void;
  onSendReady:      (send: (data: object) => void) => void;
}

export default function Scene({
  wsUrl, stationId, objectId,
  trajectory = {},
  onStatusChange,
  onPositionChange,
  onSendReady,
}: SceneProps) {
  const groupRef = useRef<Group>(null!);
  const resolvedTrajectory = { ...TRAJECTORY_DEFAULTS, ...trajectory };

  const { isFiring, targetPosVec } = useTracking(
    wsUrl,
    stationId,
    objectId,
    onStatusChange,
    onPositionChange,
    onSendReady
  );

  return (
    <Canvas
      camera={{ position: [5, 5, 5] }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={[BG]} />
      <fog   attach="fog"        args={[BG, 20, 70]} />

      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]}  intensity={1.2} color="#ffffff" />
      <directionalLight position={[-5, 8, -5]} intensity={0.5} color="#7eb8ff" />

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

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <planeGeometry args={[2000, 2000]} />
          <meshBasicMaterial color={BG} />
        </mesh>

        <Stars
          radius={120}
          depth={60}
          count={8000}
          factor={5}
          saturation={0.3}
          fade
          speed={0.3}
        />

        {isFiring && (
          <SceneContent
            groupRef={groupRef}
            targetPosVec={targetPosVec}
            trajectory={resolvedTrajectory}
          />
        )}
      </Suspense>

      <OrbitControls
        maxPolarAngle={Math.PI / 2.1}
        makeDefault
        enablePan={false}
        zoomSpeed={0.6}
        rotateSpeed={0.5}
      />
    </Canvas>
  );
}