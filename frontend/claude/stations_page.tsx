import Link      from "next/link";
import { API_BASE } from "@/types";

interface StationMeta {
  stationId:   string;
  name:        string;
  lat:         number;
  lon:         number;
  description?: string;
}

async function fetchStations(): Promise<StationMeta[]> {
  try {
    const res = await fetch(`${API_BASE}/stations`, { cache: "no-store" });
    return res.ok ? res.json() : [];
  } catch {
    return [];
  }
}

export default async function StationsPage() {
  const stations = await fetchStations();

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto flex flex-col gap-5">

        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-text">Станции</h1>
            <p className="text-[11px] font-mono text-text-muted mt-0.5">
              {stations.length} регистрирани
            </p>
          </div>
          <Link
            href="/stations/new"
            className="px-3 py-1.5 rounded-md text-[12px] font-mono font-medium border border-border bg-surface text-text-muted hover:text-text hover:border-border-hi transition-colors no-underline"
          >
            + Нова станция
          </Link>
        </div>

        {stations.length === 0 ? (
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
              <StationCard key={station.stationId} station={station} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

function StationCard({ station }: { station: StationMeta }) {
  const initials = station.stationId.slice(0, 2).toUpperCase();

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden hover:border-border-hi transition-colors group">

      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-start gap-3">
        <div className="w-9 h-9 shrink-0 rounded-lg bg-surface-hi border border-border flex items-center justify-center font-mono text-[11px] font-bold text-text-dim">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[13px] text-text truncate">{station.name}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot shrink-0" />
          </div>
          <div className="font-mono text-[10.5px] text-text-muted mt-0.5 truncate">
            {station.stationId}
          </div>
        </div>
      </div>

      {/* Coords */}
      <div className="px-4 pb-3 flex gap-3 font-mono text-[10.5px] text-text-muted">
        <span>{station.lat.toFixed(3)}°N</span>
        <span className="text-border-hi">·</span>
        <span>{station.lon.toFixed(3)}°E</span>
        {station.description && (
          <>
            <span className="text-border-hi">·</span>
            <span className="truncate">{station.description}</span>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-border grid grid-cols-2">
        <Link
          href={`/station/${station.stationId}/command`}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-[11.5px] font-mono font-medium text-text-muted hover:text-text hover:bg-surface-hi border-r border-border transition-colors no-underline"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <path d="M8 21h8M12 17v4"/>
          </svg>
          Command Center
        </Link>
        <Link
          href={`/station/${station.stationId}`}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-[11.5px] font-mono font-medium text-text-muted hover:text-accent hover:bg-accent-dim transition-colors no-underline"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          3D View
        </Link>
      </div>
    </div>
  );
}
