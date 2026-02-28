"use client";
import {
  createContext, useContext, useCallback, type ReactNode,
} from "react";
import { Vector3 }           from "three";
import { useTracking, type TrackingState } from "@/hooks/useTracking";
import { useObservationSets }              from "@/hooks/useObservationSets";
import type { Station }                    from "@/lib/data/stations";

interface StationContextValue {
  station:      Station;
  state:        TrackingState;
  targetPosVec: React.RefObject<Vector3>;
  send:         (data: object) => void;
  fire:         () => void;
  stop:         () => void;
}

const Ctx = createContext<StationContextValue | null>(null);

export function StationProvider({
  station,
  children,
}: {
  station:  Station;
  children: ReactNode;
}) {
  const { addSetFromPoints } = useObservationSets();

  const handleRecordingComplete = useCallback(
    (objId: string, points: Vector3[]) => addSetFromPoints(objId, points),
    [addSetFromPoints],
  );

  const { state, targetPosVec, send } = useTracking(
    station.wsUrl,
    station.id,
    handleRecordingComplete,
  );

  const fire = useCallback(() => {
    if (state.kind !== "tracking") return;
    send({ action: "fire", station: station.id, objId: state.objId });
  }, [send, station.id, state]);

  const stop = useCallback(() => {
    if (state.kind !== "tracking") return;
    send({ action: "stop", station: station.id, objId: state.objId });
  }, [send, station.id, state]);

  return (
    <Ctx.Provider value={{ station, state, targetPosVec, send, fire, stop }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStation() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStation must be used inside StationProvider");
  return ctx;
}
