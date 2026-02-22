import { useModel } from "@/hooks/useModel";
import { Group } from "three";

export default function SatelliteModel({ groupRef }: { groupRef: React.RefObject<Group> }) {
  const { scene } = useModel("/satellite.glb");
  return <primitive object={scene} scale={0.5} />;
}
