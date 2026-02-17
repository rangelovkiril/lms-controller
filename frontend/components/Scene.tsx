"use client";
import { useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Box } from "@react-three/drei";
import { Vector3 } from "three";

function MovingBox() {
  const meshRef = useRef(null);
  const targetPosition = useRef(new Vector3(0, 0, 0));

useEffect(() => {
  const ws = new WebSocket("ws://localhost:3000");

  ws.onopen = () => {

ws.send(JSON.stringify({ action: "subscribe", topic: "test/spiral" }))
};

ws.onmessage = (event) => {

  try {
    const data = JSON.parse(event.data);
    
    if (data && typeof data.x === 'number') 
      targetPosition.current.set(data.x, data.y, data.z);
    
  } catch (err) {}
};

  return () => ws.close();
}, []);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.position.lerp(targetPosition.current, delta );
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