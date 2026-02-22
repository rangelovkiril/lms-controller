"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import dynamic     from "next/dynamic";
import { Vector3 } from "three";
import { useParams, notFound } from "next/navigation";
import { getStation } from "@/lib/data/stations";
import TrackingDashboard from "@/components/visualization/TrackingDashboard";

const Scene = dynamic(
  () => import("@/components/visualization/Scene"),
  { ssr: false, loading: () => <SceneLoader /> }
);

function SceneLoader() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#050505]">
      <div className="flex flex-col items-center gap-3 text-text-muted">
        <div className="w-5 h-5 border-[1.5px] border-border border-t-accent rounded-full animate-spin" />
        <span className="text-xs font-mono">Visualization loading</span>
      </div>
    </div>
  );
}

export default function StationPage() {
  const params  = useParams();
  const station = getStation(params.id as string);

  if (!station) notFound();

  const [selectedObject, setSelectedObject] = useState(station.objects[0]);
  const [wsStatus,       setWsStatus]       = useState<"CONNECTED" | "DISCONNECTED">("DISCONNECTED");
  const [isFiring,       setIsFiring]       = useState(false);
  const [position,       setPosition]       = useState<Vector3 | null>(null);
  const [isFullscreen,   setIsFullscreen]   = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const sendRef    = useRef<((data: object) => void) | null>(null);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await wrapperRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const handleFire = useCallback(() => {
    sendRef.current?.({ action: "fire", stationId: station.id, objectId: selectedObject });
    setIsFiring(true);
  }, [station.id, selectedObject]);

  const handleStop = useCallback(() => {
    sendRef.current?.({ action: "stop", stationId: station.id, objectId: selectedObject });
    setIsFiring(false);
  }, [station.id, selectedObject]);

  return (
    <div className="flex h-full min-h-0">

      <div ref={wrapperRef} className="relative flex-1 min-h-0 overflow-hidden bg-[#050505]">
        <Scene
          wsUrl={station.wsUrl}
          stationId={station.id}
          objectId={selectedObject}
          onStatusChange={setWsStatus}
          onFiringChange={setIsFiring}
          onPositionChange={setPosition}
          onSendReady={(send) => { sendRef.current = send; }}
        />

        <TrackingDashboard
          stationId={station.id}
          objectId={selectedObject}
          position={position}
          wsStatus={wsStatus}
          isFiring={isFiring}
          onFire={handleFire}
          onStop={handleStop}
          onFullscreen={toggleFullscreen}
        />

        {isFullscreen && (
          <div className="absolute top-4 left-4 text-[10px] font-mono text-text-muted bg-surface/70 border border-border px-2 py-1 rounded-md backdrop-blur-sm">
            ESC за изход
          </div>
        )}
      </div>

    </div>
  );
}