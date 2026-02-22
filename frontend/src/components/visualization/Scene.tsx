"use client";
import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { Canvas }                        from "@react-three/fiber";
import { OrbitControls, Grid, Stars }    from "@react-three/drei";
import { Vector3, Group }                from "three";
import Target                            from "./Target";
import LaserLine                         from "./LaserLine";
import TrajectoryLine                    from "./TrajectoryLine";
import { useWebSocket }                  from "@/hooks/useWebSocket";
import {
  buildTrackingTopic,
  parseTrackingMessage,
} from "@/lib/ws/tracking";

import { SceneProps, ContentProps } from "@/types/scene";
import { TrajectoryConfig } from "@/types/trajectory";

const BG = "#0a0f1a";

function SceneContent({ groupRef, targetPosVec, isFiring, trajectory }: ContentProps) {
  return (
    <>
      <TrajectoryLine
        renderedGroupRef={groupRef}
        maxPoints={trajectory.maxPoints}
        maxArcLength={trajectory.maxArcLength}
        minSpeed={trajectory.minSpeed}
        maxSpeed={trajectory.maxSpeed}
        opacity={trajectory.opacity}
      />
      <Target    ref={groupRef} targetPosVec={targetPosVec} />
      <LaserLine renderedGroupRef={groupRef} isFiring={isFiring} />
    </>
  );
}

const TRAJECTORY_DEFAULTS: Required<TrajectoryConfig> = {
  maxPoints:    600,
  maxArcLength: 200,
  minSpeed:     0,
  maxSpeed:     0.5,
  opacity:      0.85,
};

export default function Scene({
  wsUrl, stationId, objectId,
  callbacks = {},
  trajectory = {},
}: SceneProps) {
  const { onStatusChange, onFiringChange, onPositionChange, onSendReady } = callbacks;
  const resolvedTrajectory = { ...TRAJECTORY_DEFAULTS, ...trajectory };

  const [isFiring, setIsFiring] = useState(false);
  const [hasData,  setHasData]  = useState(false);
  const targetPosVec = useRef(new Vector3(0, 0, 0));
  const groupRef     = useRef<Group>(null!);

  const topic = buildTrackingTopic(stationId, objectId);

  const handleOpen = useCallback((socket: WebSocket) => {
    onStatusChange?.("CONNECTED");
    socket.send(JSON.stringify({ action: "subscribe", topic }));
  }, [topic, onStatusChange]);

  const handleMessage = useCallback((ev: MessageEvent) => {
    const msg = parseTrackingMessage(ev);
    if (!msg) return;

    if (msg.position) {
      targetPosVec.current.copy(msg.position.vec);
      onPositionChange?.(targetPosVec.current.clone());
      setHasData(true);
    }
    if (msg.firing !== undefined) {
      setIsFiring(msg.firing);
      onFiringChange?.(msg.firing);
    }
  }, [onPositionChange, onFiringChange]);

  const handleClose = useCallback(() => {
    onStatusChange?.("DISCONNECTED");
  }, [onStatusChange]);

  const { send } = useWebSocket(wsUrl, {
    onOpen:    handleOpen,
    onMessage: handleMessage,
    onClose:   handleClose,
    onError:   (ev) => console.error("WebSocket error:", ev),
  });

  useEffect(() => { onSendReady?.(send); }, [send, onSendReady]);

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

        {hasData && (
          <SceneContent
            groupRef={groupRef}
            targetPosVec={targetPosVec}
            isFiring={isFiring}
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
