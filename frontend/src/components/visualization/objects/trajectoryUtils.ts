import { Color } from "three";

const _tmp = new Color();

export function speedToColor(
  t: number,
  ageFactor: number,
  out: Float32Array,
  offset: number
) {
  const hue = (1 - Math.max(0, Math.min(1, t))) * 240; // blue → red
  _tmp.setHSL(hue / 360, 1, 0.55);
  out[offset]     = _tmp.r * ageFactor;
  out[offset + 1] = _tmp.g * ageFactor;
  out[offset + 2] = _tmp.b * ageFactor;
}

export function speedToHue(t: number): number {
  return (1 - Math.max(0, Math.min(1, t))) * 240;
}

export function hueToRGB(hue: number, out: Float32Array, offset: number) {
  _tmp.setHSL(hue / 360, 1, 0.55);
  out[offset]     = _tmp.r;
  out[offset + 1] = _tmp.g;
  out[offset + 2] = _tmp.b;
}

export function speedT(segLen: number, minSpeed: number, maxSpeed: number) {
  return Math.min(Math.max(0, segLen - minSpeed) / Math.max(maxSpeed - minSpeed, 1e-6), 1);
}


