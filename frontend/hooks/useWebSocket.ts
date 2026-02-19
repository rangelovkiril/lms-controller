import { useEffect, useRef } from "react";

export interface WebSocketOptions {
  onOpen?: (socket: WebSocket) => void;
  onMessage?: (event: MessageEvent) => void;
  onClose?: () => void;
  onError?: (event: Event) => void;
  reconnectDelay?: number;
}

export function useWebSocket(url: string, options: WebSocketOptions = {}) {
  const { onOpen, onMessage, onClose, onError, reconnectDelay = 3000 } = options;
  const socketRef = useRef<WebSocket | null>(null);

  const onOpenRef = useRef(onOpen);
  const onMessageRef = useRef(onMessage);
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);

  useEffect(() => { onOpenRef.current = onOpen; }, [onOpen]);
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    let active = true;

    const connect = () => {
      console.log("Attempting to connect to:", url);
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        if (!active) { socket.close(); return; }
        onOpenRef.current?.(socket);
      };

      socket.onmessage = (ev) => {
        if (!active) return;
        onMessageRef.current?.(ev);
      };

      socket.onclose = () => {
        if (active) {
          onCloseRef.current?.();
          setTimeout(connect, reconnectDelay);
        }
      };

      socket.onerror = (ev) => {
        if (active) onErrorRef.current?.(ev);
      };
    };

    connect();

    return () => {
      active = false;
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [url, reconnectDelay]);
}