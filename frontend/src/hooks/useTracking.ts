import { useState, useRef, useCallback } from "react";
import { Vector3 } from "three";
import { useWebSocket } from "@/hooks/useWebSocket";
import { DOME_APEX_Y } from "@/components/visualization/objects/StationModel";
import {
  buildSubscribeMessage,
  parseTrackingMessage,
  type TrackingState,
} from "@/lib/tracking";

export type { TrackingState };

export interface UseTrackingResult {
  state: TrackingState;
  targetPosVec: React.RefObject<Vector3>;
  send: (data: object) => void;
}

export function useTracking(
  wsUrl: string,
  stationId: string,
  onRecordingComplete: (objId: string, points: Vector3[]) => void,
): UseTrackingResult {
  const [state, setState] = useState<TrackingState>({ kind: "disconnected" });

  const targetPosVec = useRef(new Vector3());
  const recordingRef = useRef<{ objId: string; points: Vector3[] } | null>(
    null,
  );
  const onRecordingCompleteRef = useRef(onRecordingComplete);
  onRecordingCompleteRef.current = onRecordingComplete;

  const flushRecording = useCallback(() => {
    const rec = recordingRef.current;
    if (rec && rec.points.length > 0) {
      onRecordingCompleteRef.current(rec.objId, rec.points);
    }
    recordingRef.current = null;
  }, []);

  const onOpen = useCallback(
    (socket: WebSocket) => {
      setState({ kind: "online" });
      socket.send(buildSubscribeMessage("subscribe", stationId));
    },
    [stationId],
  );

  const onMessage = useCallback(
    (ev: MessageEvent) => {
      const msg = parseTrackingMessage(ev);
      if (!msg) return;

      if (msg.type === "position") {
        const COORD_SCALE = 100; // cm → m
        // Backend: x=horizontal, y=depth, z=vertical (z = r·sin(el))
        // Three.js: Y is up → backend z→Y, backend y→Z
        const x = msg.position.x * COORD_SCALE;
        const y = msg.position.z * COORD_SCALE + DOME_APEX_Y;
        const z = msg.position.y * COORD_SCALE;
        targetPosVec.current.set(x, y, z);

        const rec = recordingRef.current;
        if (rec && rec.objId === msg.objId) {
          rec.points.push(new Vector3(x, y, z));
        }

        setState({
          kind: "tracking",
          objId: msg.objId,
          position: msg.position,
        });
        return;
      }

      switch (msg.event) {
        case "online":
          setState({ kind: "online" });
          break;

        case "offline":
          flushRecording();
          setState({ kind: "offline" });
          break;

        case "locate_start":
          setState({ kind: "locating" });
          break;

        case "locate_stop":
          setState({ kind: "online" });
          break;

        case "tracking_start": {
          const newObjId = msg.objId!;
          if (recordingRef.current && recordingRef.current.objId !== newObjId) {
            flushRecording();
          }
          if (!recordingRef.current) {
            recordingRef.current = { objId: newObjId, points: [] };
          }
          setState({ kind: "online" });
          break;
        }

        case "tracking_stop":
          flushRecording();
          setState({ kind: "online" });
          break;
      }
    },
    [flushRecording],
  );

  const onClose = useCallback(() => {
    flushRecording();
    setState({ kind: "disconnected" });
  }, [flushRecording]);

  const { send } = useWebSocket(wsUrl, {
    onOpen,
    onMessage,
    onClose,
    onError: (ev) => console.error("WebSocket error:", ev),
  });

  const wrappedSend = useCallback((data: object) => send(data), [send]);

  return { state, targetPosVec, send: wrappedSend };
}
