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
  type TrackingPosition,
} from "@/lib/ws/tracking";

const BG = "#0a0f1a";

interface ContentProps {
  groupRef:     React.RefObject<Group>;
  targetPosVec: React.RefObject<Vector3>;
  trajectory:   Required<TrajectoryConfig>;
}

function SceneContent({ groupRef, targetPosVec, trajectory }: ContentProps) {
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
      <LaserLine renderedGroupRef={groupRef} />
    </>
  );
}

export interface TrajectoryConfig {
  maxPoints?:    number;
  maxArcLength?: number;
  minSpeed?:     number;
  maxSpeed?:     number;
  opacity?:      number;
}

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
  const resolvedTrajectory = { ...TRAJECTORY_DEFAULTS, ...trajectory };

  const [isFiring,   setIsFiring] = useState(false);
  const targetPosVec = useRef(new Vector3(0, 0, 0));
  const groupRef     = useRef<Group>(null!);

  const topic = buildTrackingTopic(stationId, objectId);

  const handleOpen = useCallback((socket: WebSocket) => {
    onStatusChange("CONNECTED");
    socket.send(JSON.stringify({ action: "subscribe", topic }));
  }, [topic, onStatusChange]);

  const handleMessage = useCallback((ev: MessageEvent) => {
    const pos = parseTrackingMessage(ev);
    if (!pos) {
      setIsFiring(false);
      onPositionChange(null);
      return;
    }
    targetPosVec.current.set(pos.x, pos.y, pos.z);
    onPositionChange(pos);
    setIsFiring(true);
  }, [onPositionChange]);

  const handleClose = useCallback(() => {
    onStatusChange("DISCONNECTED");
    setIsFiring(false);
    onPositionChange(null);
  }, [onStatusChange, onPositionChange]);

  const { send } = useWebSocket(wsUrl, {
    onOpen:    handleOpen,
    onMessage: handleMessage,
    onClose:   handleClose,
    onError:   (ev) => console.error("WebSocket error:", ev),
  });

  useEffect(() => { onSendReady(send); }, [send, onSendReady]);

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