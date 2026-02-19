"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Target from "./Target";

export default function Scene() {
  return (
    <div className="w-full h-screen">
      <Canvas camera={{ position: [5, 5, 5] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        <Target />
        
        <OrbitControls />
        <gridHelper args={[40, 40]} />
      </Canvas>
    </div>
  );
}

