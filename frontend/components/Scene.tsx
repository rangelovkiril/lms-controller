"use client";
import { useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Stars } from "@react-three/drei";
import { Vector3 } from "three";
import Target from "./Target";
import LaserLine from "./LaserLine";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function Scene() {
  const [isFiring, setIsFiring] = useState(false);
  const isRecordingRef = useRef(false);
  const targetPosVec = useRef(new Vector3(0, 0, 0));

  // Дефинираме един цвят за всичко
  const bgColor = "#050505";

  useWebSocket("ws://localhost:3000", {
    onStatus: (status) => console.log("WS Status:", status),
    onTargetPos: (pos) => {
      targetPosVec.current.set(pos.x, pos.z, pos.y);
    },
    onFiring: (firing) => setIsFiring(firing),
    onRecord: (data) => console.log(data),
    isRecordingRef: isRecordingRef,
  });

  return (
    <div className="w-full h-screen">
      <Canvas
        camera={{ position: [5, 5, 5] }}
        // 1. Премахваме background от стила и го слагаме като обект в сцената
        style={{ flex: 1 }} 
      >
        {/* 2. Задаваме цвета на фона директно в R3F */}
        <color attach="background" args={[bgColor]} />
        
        {/* 3. Мъглата трябва да съвпада с цвета на фона */}
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

        <OrbitControls 
          maxPolarAngle={Math.PI / 2.1} 
          makeDefault 
          enablePan={false} 
        />
      </Canvas>
    </div>
  );
}