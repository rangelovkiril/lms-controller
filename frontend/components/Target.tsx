"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useModel } from "@/hooks/useModel";

export default function Target({ targetPosVec }) {
  const meshRef = useRef(null);
  const { scene } = useModel('/satellite.glb');

  useFrame((_state, delta) => {
    if (meshRef.current && targetPosVec.current) {
      meshRef.current.position.lerp(targetPosVec.current, delta * 2);
    }
  });

  return (
    <primitive 
      ref={meshRef} 
      object={scene} 
      scale={0.5} 
    />
  );
}