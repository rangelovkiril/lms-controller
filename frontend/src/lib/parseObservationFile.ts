import { Vector3 } from "three";

interface CartesianPoint { x: number; y: number; z: number }
interface SphericalPoint  { az: number; el: number; dist: number }

function isCartesian(p: unknown): p is CartesianPoint {
  return typeof p === "object" && p !== null &&
    typeof (p as any).x === "number" &&
    typeof (p as any).y === "number" &&
    typeof (p as any).z === "number";
}

function isSpherical(p: unknown): p is SphericalPoint {
  return typeof p === "object" && p !== null &&
    typeof (p as any).az   === "number" &&
    typeof (p as any).el   === "number" &&
    typeof (p as any).dist === "number";
}

function sphericalToCartesian({ az, el, dist }: SphericalPoint): Vector3 {
  const azR = (az * Math.PI) / 180;
  const elR = (el * Math.PI) / 180;
  return new Vector3(
    dist * Math.cos(elR) * Math.sin(azR),
    dist * Math.sin(elR),
    dist * Math.cos(elR) * Math.cos(azR),
  );
}

export class ParseError extends Error {}

export async function parseObservationFile(file: File): Promise<Vector3[]> {
  console.debug("[parser] file:", file.name, "size:", file.size, "mime:", file.type);

  let raw: unknown;
  try {
    const text = await file.text();
    console.debug("[parser] text length:", text.length, "| preview:", text.slice(0, 120));
    raw = JSON.parse(text);
  } catch (e) {
    console.error("[parser] JSON.parse failed:", e);
    throw new ParseError(`${file.name}: invalid JSON`);
  }

  console.debug("[parser] isArray:", Array.isArray(raw), "length:", (raw as any)?.length);

  if (!Array.isArray(raw) || raw.length === 0)
    throw new ParseError(`${file.name}: expected a non-empty array`);

  const first = raw[0];
  console.debug("[parser] first item:", JSON.stringify(first));
  console.debug("[parser] isCartesian:", isCartesian(first), "| isSpherical:", isSpherical(first));

  if (isCartesian(first)) {
    const result = (raw as CartesianPoint[]).map(({ x, y, z }) => new Vector3(x, y, z));
    console.debug("[parser] OK —", result.length, "cartesian points");
    return result;
  }

  if (isSpherical(first)) {
    const result = (raw as SphericalPoint[]).map(sphericalToCartesian);
    console.debug("[parser] OK —", result.length, "spherical points");
    return result;
  }

  console.error("[parser] unrecognised format. first item keys:", Object.keys(first as object));
  throw new ParseError(`${file.name}: unrecognised format — expected {x,y,z} or {az,el,dist}`);
}