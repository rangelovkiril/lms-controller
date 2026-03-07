"use client";

import { useModel } from "@/hooks/useModel";

export const DOME_APEX_Y = 2;

export default function StationModel() {
  const { scene } = useModel("/Assem3.glb");

  return (
    <primitive
      object={scene}
      position={[-0.7, 0, -0.26]}
      scale={[0.01, 0.01, 0.01]}
      rotation={[Math.PI / 2, 0, 0]}
    />
  );
}
