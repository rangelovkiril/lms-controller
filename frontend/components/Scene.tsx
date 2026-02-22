"use client";
import { useState, useRef, useCallback, Suspense } from "react";
import { Canvas }        from "@react-three/fiber";
import { OrbitControls, Grid, Stars } from "@react-three/drei";
import { Vector3 }       from "three";
import Target            from "./Target";
import LaserLine         from "./LaserLine";
import { useWebSocket }  from "@/hooks/useWebSocket";

const BG = "#0a0f1a"; // тъмно синьо вместо чисто черно

export interface SceneProps {
  wsUrl:           string;
  stationId:       string;
  objectId:        string;
  onStatusChange?: (status: "CONNECTED" | "DISCONNECTED") => void;
  onFiringChange?: (firing: boolean) => void;
  onPositionChange?: (pos: Vector3) => void;
  /** Получава send() функцията за да могат бутоните отвън да изпращат команди */
  onSendReady?:    (send: (data: object) => void) => void;
}

export default function Scene({
  wsUrl, stationId, objectId,
  onStatusChange, onFiringChange, onPositionChange, onSendReady,
}: SceneProps) {
  const [isFiring, setIsFiring] = useState(true); // TODO: false когато WS е готов
  const targetPosVec = useRef(new Vector3(0, 0, 0));

  const topic = `slr/${stationId}/tracking/${objectId}/pos`;

  const handleOpen = useCallback((socket: WebSocket) => {
    onStatusChange?.("CONNECTED");
    socket.send(JSON.stringify({ action: "subscribe", topic }));
  }, [topic, onStatusChange]);

  const handleMessage = useCallback((ev: MessageEvent) => {
    try {
      const msg = JSON.parse(ev.data);
      if (msg.x !== undefined) {
        targetPosVec.current.set(msg.x, msg.z, msg.y);
        onPositionChange?.(targetPosVec.current.clone());
      }
      if (msg.firing !== undefined) {
        setIsFiring(msg.firing);
        onFiringChange?.(msg.firing);
      }
    } catch { /* ignore */ }
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

  // Излагаме send нагоре веднъж при mount
  useCallback(() => { onSendReady?.(send); }, [send, onSendReady])();

  return (
    // style е нужен защото Tailwind h-full изисква parent с конкретна height —
    // style="100%" е по-robust в контекста на R3F.
    <Canvas
      camera={{ position: [5, 5, 5] }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={[BG]} />
      <fog   attach="fog"        args={[BG, 20, 70]} />

      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]}  intensity={1.2} color="#ffffff" />
      <directionalLight position={[-5, 8, -5]} intensity={0.5} color="#7eb8ff" />

      {/* Suspense е задължителен вътре в Canvas за useLoader / lazy assets */}
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

        <Target    targetPosVec={targetPosVec} />
        <LaserLine targetPosVec={targetPosVec} isFiring={isFiring} />
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