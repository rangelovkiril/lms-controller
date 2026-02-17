"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Box } from "@react-three/drei";
export default function Scene() {
  return (
     
    <Canvas camera={{ position: [3, 3, 3] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />

        <Box>
          <meshStandardMaterial color="orange" />
        </Box>

        <OrbitControls />
      </Canvas>

  );
}
