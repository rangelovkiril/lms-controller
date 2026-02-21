"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Stars } from "@react-three/drei";
import { Vector3 } from "three";
import Target from "./Target";
import LaserLine from "./LaserLine";
import { useWebSocket } from "@/hooks/useWebSocket";

const WS_URL = "ws://localhost:3000";
const bgColor = "#050505";

const STATION_ID = "dispatcher_test"
const OBJ_ID = "sat1"
const TOPIC = `slr/${STATION_ID}/tracking/${OBJ_ID}/pos`

export default function Scene() {
  const [isFiring, setIsFiring] = useState(false);
  const [wsStatus, setWsStatus] = useState<"CONNECTED" | "DISCONNECTED">("DISCONNECTED");
  const isRecordingRef = useRef(false);
  const targetPosVec = useRef(new Vector3(0, 0, 0));

  const handleOpen = useCallback((socket: WebSocket) => {
    setWsStatus("CONNECTED");
    socket.send(JSON.stringify({ action: "subscribe", topic: TOPIC }));
  }, []);

  const handleMessage = useCallback((ev: MessageEvent) => {
    try {
      const msg = JSON.parse(ev.data);

      if (msg.x !== undefined) {
        targetPosVec.current.set(msg.x, msg.z, msg.y);
      }

      if (msg.firing !== undefined) {
        setIsFiring(msg.firing);
      }

      if (isRecordingRef.current && msg.record !== undefined) {
        console.log("Recorded data:", msg.record);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const handleClose = useCallback(() => {
    setWsStatus("DISCONNECTED");
  }, []);

  const handleError = useCallback((ev: Event) => {
    console.error("WebSocket error:", ev);
  }, []);

  useWebSocket(WS_URL, {
    onOpen: handleOpen,
    onMessage: handleMessage,
    onClose: handleClose,
    onError: handleError,
  });

  useEffect(() => {
    console.log("Scene mounted");
  }, []);

  return (
    <div className="w-full h-screen">
      <Canvas camera={{ position: [5, 5, 5] }} style={{ flex: 1 }}>
        <color attach="background" args={[bgColor]} />
        <fog attach="fog" args={[bgColor, 20, 70]} />

        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />

        <Grid
          infiniteGrid
          fadeDistance={100}
          sectionSize={1.5}
          cellColor="#6f6f6f"
          sectionColor="#9d4b4b"
        />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <planeGeometry args={[2000, 2000]} />
          <meshBasicMaterial color={bgColor} />
        </mesh>

        <Stars radius={150} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        <Target targetPosVec={targetPosVec} />
        <LaserLine targetPosVec={targetPosVec} isFiring={true} />

        <OrbitControls maxPolarAngle={Math.PI / 2.1} makeDefault enablePan={false} />
      </Canvas>
    </div>
  );
}