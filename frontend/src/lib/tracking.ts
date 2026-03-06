export const buildSubscribeMessage = (
  action: "subscribe" | "unsubscribe",
  stationId: string
): string => JSON.stringify({ action, station: stationId });

export interface TrackingPosition {
  x: number;
  y: number;
  z: number;
}

export const STATION_EVENTS = [
  "online", "offline",
  "locate_start", "locate_stop",
  "tracking_start", "tracking_stop",
] as const;
export type StationEvent = (typeof STATION_EVENTS)[number];

/**
 * "disconnected" – WebSocket not connected
 * "online"       – station is up, idle
 * "locating"     – running locate scan (searching for target)
 * "tracking"     – actively tracking an object
 * "offline"      – station sent offline event
 */
export type TrackingState =
  | { kind: "disconnected" }
  | { kind: "online" }
  | { kind: "locating" }
  | { kind: "tracking"; objId: string; position: TrackingPosition }
  | { kind: "offline" }

export type TrackingMessage =
  | { type: "position"; objId: string; position: TrackingPosition }
  | { type: "event";    event: StationEvent; objId?: string };

export function parseTrackingMessage(ev: MessageEvent): TrackingMessage | null {
  let msg: Record<string, unknown>;
  try {
    msg = JSON.parse(ev.data as string);
  } catch {
    return null;
  }

  if (typeof msg.event !== "string") return null;

  if (
    msg.event === "position" &&
    typeof msg.objId === "string" &&
    msg.value !== null &&
    typeof msg.value === "object"
  ) {
    const v = msg.value as Record<string, unknown>;
    if (typeof v.x === "number" && typeof v.y === "number" && typeof v.z === "number") {
      return {
        type:     "position",
        objId:    msg.objId,
        position: { x: v.x, y: v.y, z: v.z },
      };
    }
  }

  if ((STATION_EVENTS as readonly string[]).includes(msg.event)) {
    return {
      type:  "event",
      event: msg.event as StationEvent,
      objId: typeof msg.objId === "string" ? msg.objId : undefined,
    };
  }

  return null;
}