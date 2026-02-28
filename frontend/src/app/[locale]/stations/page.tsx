"use client";

import Link      from "next/link";
import { useEffect, useState } from "react";
import { API_BASE } from "@/types";
import { StationCard } from "./StationCard";

interface StationMeta {
  stationId:    string;
  name:         string;
  lat:          number;
  lon:          number;
  description?: string;
  wsUrl?:       string;
}

export default function StationsPage() {
  const [stations, setStations] = useState<StationMeta[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/stations`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : [])
      .then(setStations)
      .catch(() => setStations([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (id: string) =>
    setStations((prev) => prev.filter((s) => s.stationId !== id));

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto flex flex-col gap-5">

        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-text">Станции</h1>
            <p className="text-[11px] font-mono text-text-muted mt-0.5">
              {loading ? "…" : `${stations.length} регистрирани`}
            </p>
          </div>
          <Link
            href="/stations/new"
            className="px-3 py-1.5 rounded-md text-[12px] font-mono font-medium border border-border bg-surface text-text-muted hover:text-text hover:border-border-hi transition-colors no-underline"
          >
            + Нова станция
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-5 h-5 border-[1.5px] border-border border-t-accent rounded-full animate-spin" />
          </div>
        ) : stations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-text-muted">
            <svg className="w-10 h-10 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3"/>
              <path d="M3 12h3M18 12h3M12 3v3M12 18v3"/>
            </svg>
            <span className="font-mono text-[12px]">Няма регистрирани станции</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {stations.map((station) => (
              <StationCard
                key={station.stationId}
                station={station}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}