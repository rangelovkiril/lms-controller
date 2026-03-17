import { API_BASE } from "@/types"

const INTERNAL_KEY = process.env.INTERNAL_KEY ?? ""

export interface Station {
  id: string; name: string; lat: number; lon: number
  description?: string; backendUrl: string; hardware?: string
}

function serverHeaders(): HeadersInit {
  if (INTERNAL_KEY) return { "X-Internal-Key": INTERNAL_KEY }
  return {}
}

export async function getStation(id: string): Promise<Station | null> {
  try {
    const res = await fetch(`${API_BASE}/stations/${id}`, { cache: "no-store", headers: serverHeaders() })
    if (!res.ok) return null
    return metaToStation(await res.json())
  } catch { return null }
}

export async function getAllStations(): Promise<Station[]> {
  try {
    const res = await fetch(`${API_BASE}/stations`, { cache: "no-store", headers: serverHeaders() })
    if (!res.ok) return []
    return (await res.json()).map(metaToStation)
  } catch { return [] }
}

function metaToStation(meta: any): Station {
  return {
    id: meta.stationId, name: meta.name ?? meta.stationId,
    lat: meta.lat ?? 0, lon: meta.lon ?? 0,
    description: meta.description, backendUrl: meta.backendUrl ?? "",
    hardware: meta.hardware,
  }
}

/**
 * WebSocket URL:
 *   - If station has a custom backendUrl → use that
 *   - Otherwise → same origin /ws (Caddy proxies to backend)
 */
export function getWsUrl(station: Station): string {
  if (typeof window === "undefined") return ""

  if (station.backendUrl) {
    const url = new URL(station.backendUrl)
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:"
    url.pathname = "/ws"
    return url.toString()
  }

  // Same origin — Caddy handles /ws → backend:3000
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:"
  return `${proto}//${window.location.host}/ws`
}
