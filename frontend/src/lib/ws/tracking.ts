export const buildTrackingTopic = (stationId: string, objectId: string): string =>
  `slr/${stationId}/tracking/${objectId}/pos`;

export interface TrackingPosition {
  x: number;
  y: number;
  z: number;
}

export function parseTrackingMessage(ev: MessageEvent): TrackingPosition | null {
  let msg: Record<string, unknown>;
  try {
    msg = JSON.parse(ev.data);
  } catch {
    return null;
  }

  if (typeof msg.x === "number" && typeof msg.y === "number" && typeof msg.z === "number") {
    return { x: msg.x, y: msg.z as number, z: msg.y as number };
  }

  return null;
}
