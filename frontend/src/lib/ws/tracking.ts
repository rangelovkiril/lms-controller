// ─── Subscribe ────────────────────────────────────────────────────────────────

/**
 * Builds the JSON subscribe message for a station channel.
 * Backend expects: { action: "subscribe" | "unsubscribe", station: string }
 */
export const buildSubscribeMessage = (
  action: "subscribe" | "unsubscribe",
  stationId: string
): string => JSON.stringify({ action, station: stationId });

// ─── Position ────────────────────────────────────────────────────────────────

export interface TrackingPosition {
  x: number;
  y: number;
  z: number;
}

// ─── Events sent by the server ────────────────────────────────────────────────

export const STATION_EVENTS = ["online", "offline", "tracking_start", "tracking_stop"] as const;
export type  StationEvent   = (typeof STATION_EVENTS)[number];

// ─── State union ─────────────────────────────────────────────────────────────

/**
 * Reflects what the station is actually doing, as reported by the backend.
 *
 * "disconnected" – WebSocket not connected
 * "online"       – station is up but not tracking anything
 * "tracking"     – station is actively tracking an object (backend drives objId)
 * "offline"      – station sent LWT / offline event
 */
export type TrackingState =
  | { kind: "disconnected" }
  | { kind: "online" }
  | { kind: "tracking"; objId: string; position: TrackingPosition }
  | { kind: "offline" }

// ─── Parsed message discriminated union ──────────────────────────────────────

export type TrackingMessage =
  | { type: "position"; objId: string; position: TrackingPosition }
  | { type: "event";    event: StationEvent; objId?: string };

/**
 * Parse a raw WebSocket MessageEvent into a typed TrackingMessage, or null.
 *
 * Backend frame shapes:
 *   Position  – { event: "position",       objId: string, value: { x, y, z } }
 *   Status    – { event: "online" | "offline" }
 *   Tracking  – { event: "tracking_start" | "tracking_stop", objId: string }
 */
export function parseTrackingMessage(ev: MessageEvent): TrackingMessage | null {
  let msg: Record<string, unknown>;
  try {
    msg = JSON.parse(ev.data as string);
  } catch {
    return null;
  }

  if (typeof msg.event !== "string") return null;

  // Position frame
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

  // Named event frame
  if ((STATION_EVENTS as readonly string[]).includes(msg.event)) {
    return {
      type:  "event",
      event: msg.event as StationEvent,
      objId: typeof msg.objId === "string" ? msg.objId : undefined,
    };
  }

  return null;
}