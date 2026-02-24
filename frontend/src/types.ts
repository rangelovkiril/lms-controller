export type TimePreset = { label: string; value: string; flux: string };

export const TIME_PRESETS: TimePreset[] = [
  { label: "15m",    value: "15m",    flux: "-15m"  },
  { label: "1h",     value: "1h",     flux: "-1h"   },
  { label: "6h",     value: "6h",     flux: "-6h"   },
  { label: "24h",    value: "24h",    flux: "-24h"  },
  { label: "7d",     value: "7d",     flux: "-7d"   },
  { label: "30d",    value: "30d",    flux: "-30d"  },
  { label: "Custom", value: "custom", flux: ""      },
];

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

import { Vector3 } from "three";

export interface ObsSet {
  id:      string;
  label:   string;
  points:  Vector3[];
  color:   string | null; 
  visible: boolean;
}

export const PRESET_COLORS = [
  "#00e5ff", // cyan
  "#69ff47", // green
  "#ff4444", // red
  "#ff9800", // orange
  "#c084fc", // purple
  "#ffffff",  // white
] as const;

export function nextColor(sets: ObsSet[]): string {
  return PRESET_COLORS[sets.length % PRESET_COLORS.length];
}

export function createSet(sets: ObsSet[], label?: string): ObsSet {
  const n = sets.length + 1;
  return {
    id:      crypto.randomUUID(),
    label:   label ?? `Set ${n}`,
    points:  [],
    color:   nextColor(sets),
    visible: true,
  };
}