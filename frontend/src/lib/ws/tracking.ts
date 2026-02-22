import { Vector3 } from "three";


export const buildTrackingTopic = (stationId: string, objectId: string): string =>`slr/${stationId}/tracking/${objectId}/pos`

export interface TrackingPosition {
  vec: Vector3;
}

export interface TrackingMessage {
  position?: TrackingPosition;
  firing?:   boolean;
}

export function parseTrackingMessage(ev: MessageEvent): TrackingMessage | null {
  let msg: Record<string, unknown>;
  try {
    msg = JSON.parse(ev.data);
  } catch {
    return null;
  }

  const result: TrackingMessage = {};

  if (typeof msg.x === "number") {
    result.position = { vec: new Vector3(msg.x, msg.z as number, msg.y as number) };
  }

  if (typeof msg.firing === "boolean") {
    result.firing = msg.firing;
  }

  if (!result.position && result.firing === undefined) return null;

  return result;
}
