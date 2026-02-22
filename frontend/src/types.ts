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

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
