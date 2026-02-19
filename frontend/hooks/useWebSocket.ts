import { useEffect } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
export function useWebSocket(url: string, options: any) {
  const { onStatus, onTargetPos, onFiring, onTrackingEvent, onRecord, isRecordingRef } = options;
  useEffect(() => {
    let ws: WebSocket;

    const connect = () => {
      try {
        ws = new WebSocket(url);

        ws.onopen = () => {
          ws.send(JSON.stringify({ action: "subscribe", topic: "slr/test/position" }));
          onStatus("CONNECTED");
        };

        ws.onclose = () => {
          onStatus("DISCONNECTED");
          setTimeout(connect, 3000);
        };

        ws.onerror = () => onStatus("ERROR");

        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data);

            if (msg.x !== undefined) {
              const pos = { x: msg.x, y: msg.y, z: msg.z };
              onTargetPos(pos);
              if (isRecordingRef.current) {
                onRecord({ timestamp: Date.now(), ...pos });
              }
            }

          } catch (_) {}
        };
      } catch (_) {
        onStatus("ERROR");
      }
    };

    connect();
    return () => ws?.close();
  }, [url]);
}