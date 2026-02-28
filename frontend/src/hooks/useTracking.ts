import { useState, useRef, useCallback } from "react";
import { Vector3 }                        from "three";
import { useWebSocket }                   from "@/hooks/useWebSocket";
import {
  buildSubscribeMessage,
  parseTrackingMessage,
  type TrackingState,
} from "@/lib/ws/tracking";

export type { TrackingState };

// ─── Hook ────────────────────────────────────────────────────────────────────

export interface UseTrackingResult {
  /** Current station / tracking state — driven entirely by backend events. */
  state:        TrackingState;
  /** Mutable ref updated on every position frame, safe to read in rAF loops. */
  targetPosVec: React.RefObject<Vector3>;
  /** Send a raw action to the backend (e.g. fire / stop). */
  send:         (data: object) => void;
}

/**
 * Connects to a station's WebSocket channel.
 *
 * The station decides which object it is tracking — the frontend has no
 * control over object selection. When the tracked object changes or tracking
 * stops, the accumulated positions are flushed via `onRecordingComplete` so
 * the caller can persist them as an ObservationSet.
 *
 * @param wsUrl               WebSocket endpoint
 * @param stationId           Station identifier (used for subscribe message)
 * @param onRecordingComplete Called with (objId, points) when a recording ends.
 *                            Triggered by: tracking_stop, tracking_start for a
 *                            different object, or station going offline/disconnected.
 */
export function useTracking(
  wsUrl:               string,
  stationId:           string,
  onRecordingComplete: (objId: string, points: Vector3[]) => void,
): UseTrackingResult {
  const [state, setState] = useState<TrackingState>({ kind: "disconnected" });

  // Live position ref — avoids re-renders in the 3D animation loop
  const targetPosVec = useRef(new Vector3());

  // Accumulation buffer for the current recording
  const recordingRef = useRef<{ objId: string; points: Vector3[] } | null>(null);

  // Keep callback stable in message handler without causing re-subscriptions
  const onRecordingCompleteRef = useRef(onRecordingComplete);
  onRecordingCompleteRef.current = onRecordingComplete;

  /** Flush the current recording buffer if it has any points. */
  const flushRecording = useCallback(() => {
    const rec = recordingRef.current;
    if (rec && rec.points.length > 0) {
      onRecordingCompleteRef.current(rec.objId, rec.points);
    }
    recordingRef.current = null;
  }, []);

  const onOpen = useCallback((socket: WebSocket) => {
    setState({ kind: "online" });
    socket.send(buildSubscribeMessage("subscribe", stationId));
  }, [stationId]);

  const onMessage = useCallback((ev: MessageEvent) => {
    const msg = parseTrackingMessage(ev);
    if (!msg) return;

    if (msg.type === "position") {
      const { x, y, z } = msg.position;
      targetPosVec.current.set(x, y, z);

      // Accumulate into current recording
      const rec = recordingRef.current;
      if (rec && rec.objId === msg.objId) {
        rec.points.push(new Vector3(x, y, z));
      }

      setState({ kind: "tracking", objId: msg.objId, position: msg.position });
      return;
    }

    // Named event
    switch (msg.event) {
      case "online":
        setState({ kind: "online" });
        break;

      case "offline":
        // Save whatever was being recorded before the station went dark
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
        const rec = recordingRef.current;

        if (rec && rec.objId !== newObjId) {
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
  }, [flushRecording]);

  const onClose = useCallback(() => {
    // WebSocket dropped — save any in-flight recording
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