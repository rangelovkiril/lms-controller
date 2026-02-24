// mockTrajectory.ts
import { Vector3 } from "three";

interface TrajectoryOptions {
  points?:     number;   // брой точки
  radius?:     number;   // радиус на движение
  noise?:      number;   // произволни отклонения
  pattern?:    "circle" | "spiral" | "wave" | "random_walk";
}

export function generateTrajectory({
  points      = 200,
  radius      = 5,
  noise       = 0.1,
  pattern     = "spiral",
}: TrajectoryOptions = {}): Vector3[] {
  const result: Vector3[] = [];
  const jitter = () => (Math.random() - 0.5) * noise;

  for (let i = 0; i < points; i++) {
    const t = i / points;
    const angle = t * Math.PI * 6; // 3 обиколки

    let x: number, y: number, z: number;

    switch (pattern) {
      case "circle":
        x = Math.cos(angle) * radius;
        z = Math.sin(angle) * radius;
        y = 0;
        break;

      case "spiral":
        const r = radius * (0.2 + 0.8 * t);
        x = Math.cos(angle) * r;
        z = Math.sin(angle) * r;
        y = t * radius * 0.5;
        break;

      case "wave":
        x = (t - 0.5) * radius * 2;
        z = Math.sin(t * Math.PI * 4) * radius * 0.5;
        y = Math.cos(t * Math.PI * 2) * radius * 0.3;
        break;

      case "random_walk":
        const prev = result[i - 1] ?? new Vector3(0, 0, 0);
        x = prev.x + (Math.random() - 0.5) * 0.3;
        z = prev.z + (Math.random() - 0.5) * 0.3;
        y = prev.y + (Math.random() - 0.49) * 0.05; // лек дрейф нагоре
        break;

      default:
        x = z = y = 0;
    }

    result.push(new Vector3(x + jitter(), y + jitter(), z + jitter()));
  }

  return result;
}