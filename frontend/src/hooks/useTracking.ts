import { useState, useRef, useCallback, useEffect } from "react";
import { Vector3 } from "three";
import { useWebSocket } from "@/hooks/useWebSocket";
import { buildTrackingTopic, parseTrackingMessage, type TrackingPosition } from "@/lib/ws/tracking";

export function useTracking(
  wsUrl: string,
  stationId: string,
  objectId: string,
  onStatusChange: (status: "CONNECTED" | "DISCONNECTED") => void,
  onPositionChange: (pos: TrackingPosition | null) => void,
  onSendReady: (send: (data: object) => void) => void
) {
  const [isFiring, setIsFiring] = useState(false);
  const targetPosVec = useRef(new Vector3(0, 0, 0));
  const topic = buildTrackingTopic(stationId, objectId);

  const onOpen = useCallback((socket: WebSocket) => {
    onStatusChange("CONNECTED");
    socket.send(JSON.stringify({ action: "subscribe", topic }));
  }, [topic, onStatusChange]);

  const onMessage = useCallback((ev: MessageEvent) => {
    const pos = parseTrackingMessage(ev);
    if (!pos) {
      setIsFiring(false);
      onPositionChange(null);
      return;
    }
    targetPosVec.current.set(pos.x, pos.y, pos.z);
    onPositionChange(pos);
    setIsFiring(true);
  }, [onPositionChange]);

  const onClose = useCallback(() => {
    onStatusChange("DISCONNECTED");
    setIsFiring(false);
    onPositionChange(null);
  }, [onStatusChange, onPositionChange]);

  const { send } = useWebSocket(wsUrl, {
    onOpen: onOpen,
    onMessage: onMessage,
    onClose: onClose,
    onError: (ev) => console.error("WebSocket error:", ev),
  });

  useEffect(() => {
    onSendReady(send);
  }, [send, onSendReady]);

  return { isFiring, targetPosVec };
}