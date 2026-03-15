import { API_BASE } from "@/types";

export interface Station {
  id: string;
  name: string;
  lat: number;
  lon: number;
  description?: string;
  backendUrl: string;
  hardware?: string;
}

/** Fetch a single station from the API. Returns null if not found. */
export async function getStation(id: string): Promise<Station | null> {
  try {
    const res = await fetch(`${API_BASE}/stations/${id}`, {
      cache: "no-store",
    });
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
    id: meta.stationId,
    name: meta.name ?? meta.stationId,
    lat: meta.lat ?? 0,
    lon: meta.lon ?? 0,
    description: meta.description ?? undefined,
    backendUrl: meta.backendUrl ?? "",
    hardware: meta.hardware ?? undefined,
  };
}

/**
 * Derive the WebSocket URL for a station.
 *
 * If the station has a custom backendUrl (e.g. "http://192.168.1.50:3000"),
 * convert it to "ws://192.168.1.50:3000/ws".
 *
 * If empty (= same backend as the UI), use the current hostname + the
 * exposed backend port from NEXT_PUBLIC_BACKEND_PORT.
 */
export function getWsUrl(station: Station): string {
  if (typeof window === "undefined") return "";

  if (station.backendUrl) {
    const url = new URL(station.backendUrl);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = "/ws";
    return url.toString();
  }

  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  const port = process.env.NEXT_PUBLIC_BACKEND_PORT ?? "4000";
  return `${proto}//${window.location.hostname}:${port}/ws`;
}
