import { API_BASE } from "@/types";

export interface Station {
  id:          string;
  name:        string;
  lat:         number;
  lon:         number;
  description?: string;
  wsUrl:       string;
  hardware?:   string;
}

/** Fetch a single station from the API. Returns null if not found. */
export async function getStation(id: string): Promise<Station | null> {
  try {
    const res = await fetch(`${API_BASE}/stations/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const meta = await res.json();
    return metaToStation(meta);
  } catch {
    return null;
  }
}

/** Fetch all stations from the API. */
export async function getAllStations(): Promise<Station[]> {
  try {
    const res = await fetch(`${API_BASE}/stations`, { cache: "no-store" });
    if (!res.ok) return [];
    const list = await res.json();
    return list.map(metaToStation);
  } catch {
    return [];
  }
}

function metaToStation(meta: any): Station {
  return {
    id:          meta.stationId,
    name:        meta.name        ?? meta.stationId,
    lat:         meta.lat         ?? 0,
    lon:         meta.lon         ?? 0,
    description: meta.description ?? undefined,
    wsUrl:       meta.wsUrl       ?? `ws://localhost:3000/ws`,
    hardware:    meta.hardware    ?? undefined,
  };
}