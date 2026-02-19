"use client";
import { useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Vector3 } from "three";
import Target from "./Target";
import LaserLine from "./LaserLine";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function Scene() {
  const [isFiring, setIsFiring] = useState(false);
  const isRecordingRef = useRef(false);
  
  const targetPosVec = useRef(new Vector3(0, 0, 0));

  useWebSocket("ws://localhost:3000", {
    onStatus: (status: string) => console.log("WS Status:", status),
    onTargetPos: (pos: { x: number; y: number; z: number }) => {
      // Мащабиране и трансформация на координатите директне тук
      targetPosVec.current.set(pos.x, pos.z, pos.y);
    },
    onFiring: (firing: boolean) => setIsFiring(firing),
    onRecord: (data) => console.log(data),
    isRecordingRef: isRecordingRef,
  });

  return (
    <div className="w-full h-screen">
      <Canvas camera={{ position: [5, 5, 5] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        <Target targetPosVec={targetPosVec} />
        <LaserLine targetPosVec={targetPosVec} isFiring={true} />
        
        <OrbitControls />
        <gridHelper args={[40, 40]} />
      </Canvas>
    </div>
  );
}