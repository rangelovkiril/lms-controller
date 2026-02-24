// ─── Topic ───────────────────────────────────────────────────────────────────

export const buildTrackingTopic = (stationId: string, objectId: string): string =>
  `slr/${stationId}/tracking/${objectId}/pos`;

// ─── Position ────────────────────────────────────────────────────────────────

export interface TrackingPosition {
  x: number;
  y: number;
  z: number;
}

// ─── Named events sent by the server ─────────────────────────────────────────

export const TRACKING_EVENTS = [
  "no_object",   // requested object is not known to the station
  "track_lost",  // object was acquired but tracking dropped
  "acquire",     // object re-acquired after a loss
  "error",       // generic server-side error
] as const;

export type TrackingEvent = (typeof TRACKING_EVENTS)[number];

// ─── Parsed message discriminated union ──────────────────────────────────────

export type TrackingMessage =
  | { type: "position"; position: TrackingPosition }
  | { type: "event";    event: TrackingEvent }

/** Parse a raw WebSocket MessageEvent into a typed TrackingMessage, or null. */
export function parseTrackingMessage(ev: MessageEvent): TrackingMessage | null {
  let msg: Record<string, unknown>;
  try {
    msg = JSON.parse(ev.data as string);
  } catch {
    return null;
  }

  // Named event frame  e.g. { "event": "track_lost" }
  if (typeof msg.event === "string" && (TRACKING_EVENTS as readonly string[]).includes(msg.event)) {
    return { type: "event", event: msg.event as TrackingEvent };
  }

  // Position frame  e.g. { "x": 1.2, "y": 3.4, "z": 5.6 }
  if (typeof msg.x === "number" && typeof msg.y === "number" && typeof msg.z === "number") {
    return {
      type: "position",
      position: { x: msg.x, y: msg.y as number, z: msg.z as number },
    };
  }

  return null;
}