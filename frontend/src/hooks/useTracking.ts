import { useState, useRef, useCallback } from "react";
import { Vector3 } from "three";
import { useWebSocket } from "@/hooks/useWebSocket";
import {
  buildTrackingTopic,
  parseTrackingMessage,
  type TrackingPosition,
  type TrackingEvent,
} from "@/lib/ws/tracking";

// ─── State union ─────────────────────────────────────────────────────────────

export type TrackingState =
  | { kind: "disconnected" }
  | { kind: "connected" }                              // ws open, waiting for first frame
  | { kind: "tracking"; position: TrackingPosition }  // live position data
  | { kind: "event"; event: TrackingEvent }            // named event from server

// ─── Hook ────────────────────────────────────────────────────────────────────

export interface UseTrackingResult {
  state:        TrackingState;
  targetPosVec: React.RefObject<Vector3>;
  send:         (data: object) => void;
}

export function useTracking(
  wsUrl:     string,
  stationId: string,
  objectId:  string,
): UseTrackingResult {
  const [state, setState] = useState<TrackingState>({ kind: "disconnected" });

  // Mutable vector updated every frame — avoids React re-renders in the 3D loop
  const targetPosVec = useRef(new Vector3());

  const topic = buildTrackingTopic(stationId, objectId);

  const onOpen = useCallback((socket: WebSocket) => {
    setState({ kind: "connected" });
    socket.send(JSON.stringify({ action: "subscribe", topic }));
  }, [topic]);

  const onMessage = useCallback((ev: MessageEvent) => {
    const msg = parseTrackingMessage(ev);
    if (!msg) return;

    if (msg.type === "position") {
      const { x, y, z } = msg.position;
      targetPosVec.current.set(x, y, z);
      setState({ kind: "tracking", position: msg.position });
    } else {
      // Named event — surface it as state; position display will freeze at last known
      setState({ kind: "event", event: msg.event });
    }
  }, []);

  const onClose = useCallback(() => {
    setState({ kind: "disconnected" });
  }, []);

  const { send } = useWebSocket(wsUrl, {
    onOpen,
    onMessage,
    onClose,
    onError: (ev) => console.error("WebSocket error:", ev),
  });

  const wrappedSend = useCallback(
    (data: object) => send(data),
    [send]
  );

  return { state, targetPosVec, send: wrappedSend };
}
