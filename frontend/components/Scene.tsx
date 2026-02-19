"use client";
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Box } from "@react-three/drei";
import { Vector3 } from "three";
import { useWebSocket } from "@/hooks/useWebSocket"; 

function MovingBox() {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const meshRef = useRef<any>(null);
  const targetPosition = useRef(new Vector3(0, 0, 0));
  const isRecordingRef = useRef(false);

  useWebSocket("ws://localhost:3000", {
    onStatus: (status: string) => console.log("WS Status:", status),
    onTargetPos: (pos: { x: number; y: number; z: number }) => {
      targetPosition.current.set(pos.x, pos.y, pos.z);
    },
    onFiring: () => {},
    onTrackingEvent: () => {},
    onRecord: (data: any) => console.log("Recording:", data),
    isRecordingRef: isRecordingRef,
  });

  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.position.lerp(targetPosition.current, delta);
    }
  });

  return (
    <Box ref={meshRef} args={[1, 1, 1]}>
      <meshStandardMaterial color="orange" />
    </Box>
  );
}

export default function Scene() {
  return (
    <div className="w-full h-screen">
      <Canvas camera={{ position: [5, 5, 5] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        <MovingBox />
        
        <OrbitControls />
        <gridHelper args={[10, 10]} />
      </Canvas>
    </div>
  );
}