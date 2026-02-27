import { useEffect }  from "react";
import { useModel }   from "@/hooks/useModel";

interface Props {
  onLoad?: () => void;
}

export default function SatelliteModel({ onLoad }: Props) {
  const { scene } = useModel("/satellite.glb");

  // useModel uses useLoader which suspends — by the time we reach this
  // useEffect, the model is fully loaded and the component has rendered.
  useEffect(() => {
    onLoad?.();
  }, [onLoad]);

  return <primitive object={scene} scale={0.5} />;
}