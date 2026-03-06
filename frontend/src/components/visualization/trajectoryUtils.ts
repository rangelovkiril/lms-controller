import { Color } from "three";

const _tmp = new Color();

/** Map a normalized speed value [0,1] to a hue in degrees (blue=slow → red=fast) */
export function speedToHue(t: number): number {
  return (1 - Math.max(0, Math.min(1, t))) * 240;
}

/** Write an HSL color (full saturation, mid-lightness) into a Float32Array at offset */
export function hueToRGB(hue: number, out: Float32Array, offset: number): void {
  _tmp.setHSL(hue / 360, 1, 0.55);
  out[offset]     = _tmp.r;
  out[offset + 1] = _tmp.g;
  out[offset + 2] = _tmp.b;
}

/** Normalize a segment length to [0,1] within [minSpeed, maxSpeed] */
export function speedT(segLen: number, minSpeed: number, maxSpeed: number): number {
  return Math.min(Math.max(0, segLen - minSpeed) / Math.max(maxSpeed - minSpeed, 1e-6), 1);
}

/**
 * Compute and write a speed+age-adjusted color directly into a Float32Array.
 * Convenience wrapper used by static geometry (ObservationSet).
 */
export function speedToColor(
  t: number,
  ageFactor: number,
  out: Float32Array,
  offset: number
): void {
  hueToRGB(speedToHue(t), out, offset);
  out[offset]     *= ageFactor;
  out[offset + 1] *= ageFactor;
  out[offset + 2] *= ageFactor;
}
