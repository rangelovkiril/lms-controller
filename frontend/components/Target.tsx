"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { useWebSocket } from "@/hooks/useWebSocket"; 
import { useModel } from "@/hooks/useModel"; // Adjust path as needed

const SCALE = 1;

export default function Target() {
  const meshRef = useRef(null);
  const targetPosVec = useRef(new Vector3(0, 0, 0));
  const isRecordingRef = useRef(false);

  const { scene } = useModel('/satellite.glb');

  useWebSocket("ws://localhost:3000", {
    onStatus: (status: string) => console.log("WS Status:", status),
    onTargetPos: (pos: { x: number; y: number; z: number }) => {
      targetPosVec.current.set(
        pos.x * SCALE,
        pos.z * SCALE,
        pos.y * SCALE
      );
    },
    onFiring: () => {},
    onTrackingEvent: () => {},
    onRecord: (data) => {console.log(data)},
    isRecordingRef: isRecordingRef,
  });

  useFrame((_state, delta) => {
    if (!meshRef.current) return;
    
    meshRef.current.position.lerp(targetPosVec.current, delta / 2);
  });

  return (
    <primitive 
      ref={meshRef} 
      object={scene} 
      scale={0.5} 
    />
  );
}