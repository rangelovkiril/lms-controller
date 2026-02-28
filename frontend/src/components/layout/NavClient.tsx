"use client";
import { useEffect, useState } from "react";
import { API_BASE }            from "@/types";

interface StationSummary { stationId: string; name: string }

export default function NavClient() {
  const [stations, setStations] = useState<StationSummary[] | null>(null);

  useEffect(() => {
    const load = () =>
      fetch(`${API_BASE}/stations`)
        .then((r) => r.json())
        .then(setStations)
        .catch(() => {});

    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  if (!stations) return null;

  // During dev, all stations in the static list are treated as reachable.
  // In production this would reflect real online/offline status from InfluxDB.
  const total  = stations.length;
  const online = total; // InfluxDB presence = station has ever written data

  return (
    <div className="flex items-center gap-2 font-mono text-[11px]">
      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />
      <span className="text-text-muted">
        <span className="text-text">{online}</span>/{total} online
      </span>
    </div>
  );
}
