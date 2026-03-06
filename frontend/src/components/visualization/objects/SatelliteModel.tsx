import { useEffect } from "react";
import { useModel }  from "@/hooks/useModel";

interface Props {
  onLoad?: () => void;
}

export default function SatelliteModel({ onLoad }: Props) {
  const { scene } = useModel("/satellite.glb");

  useEffect(() => {
    onLoad?.();
  }, [onLoad]);

  return <primitive object={scene} scale={0.25} />;
}
