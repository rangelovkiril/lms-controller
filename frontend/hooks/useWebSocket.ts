import { useEffect, useRef, useCallback } from "react";

export interface WebSocketOptions {
  onOpen?:    (socket: WebSocket) => void;
  onMessage?: (event: MessageEvent) => void;
  onClose?:   () => void;
  onError?:   (event: Event) => void;
  reconnectDelay?: number;
}

export interface WebSocketHandle {
  send: (data: string | object) => void;
}

export function useWebSocket(
  url: string,
  options: WebSocketOptions = {}
): WebSocketHandle {
  const { reconnectDelay = 3000 } = options;
  const socketRef = useRef<WebSocket | null>(null);

  const onOpenRef    = useRef(options.onOpen);
  const onMessageRef = useRef(options.onMessage);
  const onCloseRef   = useRef(options.onClose);
  const onErrorRef   = useRef(options.onError);

  useEffect(() => { onOpenRef.current    = options.onOpen;    }, [options.onOpen]);
  useEffect(() => { onMessageRef.current = options.onMessage; }, [options.onMessage]);
  useEffect(() => { onCloseRef.current   = options.onClose;   }, [options.onClose]);
  useEffect(() => { onErrorRef.current   = options.onError;   }, [options.onError]);

  useEffect(() => {
    let active = true;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      if (!active) return;
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
        if (!active) return;
        onCloseRef.current?.();
        reconnectTimer = setTimeout(connect, reconnectDelay);
      };

      socket.onerror = (ev) => {
        if (active) onErrorRef.current?.(ev);
      };
    };

    connect();

    return () => {
      active = false;
      clearTimeout(reconnectTimer);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [url, reconnectDelay]);

  const send = useCallback((data: string | object) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket not open - message dropped:", data);
      return;
    }
    socket.send(typeof data === "string" ? data : JSON.stringify(data));
  }, []);

  return { send };
}