"use client";
import {
  useState, useEffect, useRef, useCallback,
} from "react";
import { useStation }  from "@/lib/stationContext";
import { API_BASE }    from "@/types";
import type { TrackingState } from "@/hooks/useTracking";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StationMeta {
  stationId:    string;
  name:         string;
  lat:          number;
  lon:          number;
  description?: string;
}

interface LogEntry {
  timestamp: string;
  level:     string;
  message:   string;
}

interface SparkPoint { value: number }

interface MeteoReading {
  temp?:     number;
  humidity?: number;
  pressure?: number;
  wind?:     number;
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.12em] text-text-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

// ─── Property Grid ────────────────────────────────────────────────────────────

function PropertyGrid({ stationId }: { stationId: string }) {
  const [meta,    setMeta]    = useState<StationMeta | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [geocode, setGeocode] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/stations/${stationId}`)
      .then((r) => r.json())
      .then(setMeta)
      .catch(() => {});
  }, [stationId]);

  // Reverse geocode on lat/lon change (debounced)
  useEffect(() => {
    if (!meta) return;
    const id = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${meta.lat}&lon=${meta.lon}&format=json`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        setGeocode(data.display_name?.split(",").slice(0, 2).join(", ") ?? "");
      } catch {
        setGeocode("");
      }
    }, 800);
    return () => clearTimeout(id);
  }, [meta?.lat, meta?.lon]);

  const patch = (key: keyof StationMeta, value: string | number) =>
    setMeta((m) => m ? { ...m, [key]: value } : m);

  const save = async () => {
    if (!meta) return;
    setSaving(true);
    try {
      await fetch(`${API_BASE}/stations/${stationId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:        meta.name,
          lat:         meta.lat,
          lon:         meta.lon,
          description: meta.description,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (!meta) return (
    <div className="h-48 flex items-center justify-center">
      <Spinner />
    </div>
  );

  return (
    <div>
      <SectionHeader label="Metadata">
        <button
          onClick={save}
          disabled={saving}
          className={[
            "text-[10.5px] font-mono px-2.5 py-1 rounded border transition-colors disabled:opacity-40",
            saved
              ? "border-accent/40 bg-accent-dim text-accent"
              : "border-border text-text-muted hover:border-border-hi hover:text-text",
          ].join(" ")}
        >
          {saving ? "Saving…" : saved ? "✓ Saved" : "Save"}
        </button>
      </SectionHeader>

      <div className="flex flex-col gap-0">
        <PropRow label="ID">
          <span className="font-mono text-[12px] text-text-muted">{meta.stationId}</span>
        </PropRow>
        <PropRow label="Name">
          <input
            className={inputCls}
            value={meta.name}
            onChange={(e) => patch("name", e.target.value)}
          />
        </PropRow>
        <PropRow label="Description">
          <input
            className={inputCls}
            value={meta.description ?? ""}
            placeholder="—"
            onChange={(e) => patch("description", e.target.value)}
          />
        </PropRow>
        <PropRow label="Latitude">
          <input
            type="number"
            step="0.001"
            className={inputCls}
            value={meta.lat}
            onChange={(e) => patch("lat", parseFloat(e.target.value) || 0)}
          />
        </PropRow>
        <PropRow label="Longitude">
          <input
            type="number"
            step="0.001"
            className={inputCls}
            value={meta.lon}
            onChange={(e) => patch("lon", parseFloat(e.target.value) || 0)}
          />
        </PropRow>
        {geocode && (
          <PropRow label="Location">
            <span className="font-mono text-[11px] text-text-muted truncate" title={geocode}>
              📍 {geocode}
            </span>
          </PropRow>
        )}
      </div>
    </div>
  );
}

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[90px_1fr] items-center gap-2 py-1.5 border-b border-border/50 last:border-0">
      <span className="font-mono text-[10.5px] text-text-muted uppercase tracking-wide shrink-0">
        {label}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

const inputCls =
  "w-full bg-transparent border-0 font-mono text-[12px] text-text outline-none " +
  "focus:bg-surface-hi rounded px-1.5 py-0.5 transition-colors placeholder:text-text-muted/40 " +
  "[color-scheme:dark]";

// ─── Status & Controls ────────────────────────────────────────────────────────

function ControlPanel({
  state, fire, stop,
}: {
  state: TrackingState;
  fire:  () => void;
  stop:  () => void;
}) {
  const canInteract = state.kind !== "disconnected" && state.kind !== "offline";

  const STATUS_MAP: Record<TrackingState["kind"], { label: string; color: string; pulse: boolean }> = {
    disconnected: { label: "Disconnected", color: "text-text-muted", pulse: false },
    online:       { label: "Online",       color: "text-blue",       pulse: true  },
    tracking:     { label: "Tracking",     color: "text-accent",     pulse: true  },
    offline:      { label: "Offline",      color: "text-yellow-400", pulse: false },
  };

  const { label, color, pulse } = STATUS_MAP[state.kind];

  return (
    <div>
      <SectionHeader label="Station Control" />

      {/* Status */}
      <div className="flex items-center gap-2 mb-4">
        <span className={[
          "w-2 h-2 rounded-full shrink-0",
          state.kind === "tracking"  ? "bg-accent" :
          state.kind === "online"    ? "bg-blue"   :
          state.kind === "offline"   ? "bg-yellow-400" : "bg-border-hi",
          pulse ? "animate-pulse-dot" : "",
        ].join(" ")} />
        <span className={`font-mono text-[12px] ${color}`}>{label}</span>
        {state.kind === "tracking" && (
          <span className="ml-auto font-mono text-[11px] text-text-muted">
            obj: <span className="text-accent">{state.objId}</span>
          </span>
        )}
      </div>

      {/* Position */}
      {state.kind === "tracking" && (
        <div className="grid grid-cols-3 gap-1.5 mb-4">
          {(["x","y","z"] as const).map((ax) => (
            <div key={ax} className="bg-bg border border-border rounded-md px-2 py-1.5">
              <div className="font-mono text-[9px] uppercase text-text-muted">{ax}</div>
              <div className="font-mono text-[12px] text-text">{state.position[ax].toFixed(2)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={fire}
          disabled={!canInteract || state.kind === "tracking"}
          className="py-2.5 rounded-lg border font-mono text-[12px] font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-accent-dim border-accent/40 text-accent hover:bg-accent/20"
        >
          ▶ Fire
        </button>
        <button
          onClick={stop}
          disabled={!canInteract || state.kind !== "tracking"}
          className="py-2.5 rounded-lg border font-mono text-[12px] font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-danger/10 border-danger/40 text-danger hover:bg-danger/20"
        >
          ■ Stop
        </button>
      </div>
    </div>
  );
}

// ─── Log Viewer ───────────────────────────────────────────────────────────────

const POLL_OPTIONS = [2, 5, 10] as const;
type PollInterval  = (typeof POLL_OPTIONS)[number];

const LEVEL_COLORS: Record<string, string> = {
  ERROR: "text-danger",
  WARN:  "text-yellow-400",
  INFO:  "text-text-muted",
  DEBUG: "text-text-dim",
};

function LogViewer({ stationId }: { stationId: string }) {
  const [logs,    setLogs]    = useState<LogEntry[]>([]);
  const [paused,  setPaused]  = useState(false);
  const [interval, setIntervalVal] = useState<PollInterval>(5);
  const [filter,  setFilter]  = useState("ALL");
  const bottomRef = useRef<HTMLDivElement>(null);
  const hovered   = useRef(false);

  const load = useCallback(() => {
    fetch(`${API_BASE}/stations/${stationId}/logs?limit=200`)
      .then((r) => r.json())
      .then((data: LogEntry[]) => {
        setLogs(data);
        if (!hovered.current) {
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
      })
      .catch(() => {});
  }, [stationId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(load, interval * 1000);
    return () => clearInterval(id);
  }, [paused, interval, load]);

  const LEVELS = ["ALL", "ERROR", "WARN", "INFO", "DEBUG"];
  const visible = filter === "ALL"
    ? logs
    : logs.filter((l) => l.level?.toUpperCase() === filter);

  return (
    <div className="flex flex-col h-full">
      <SectionHeader label="System Log">
        <div className="flex items-center gap-2">
          {/* Level filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-bg border border-border rounded text-[10.5px] font-mono text-text-muted px-1.5 py-0.5 outline-none [color-scheme:dark]"
          >
            {LEVELS.map((l) => <option key={l}>{l}</option>)}
          </select>

          {/* Poll interval */}
          <div className="flex items-center gap-1">
            {POLL_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setIntervalVal(s)}
                className={[
                  "text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors",
                  interval === s && !paused
                    ? "bg-accent-dim text-accent"
                    : "text-text-muted hover:text-text",
                ].join(" ")}
              >
                {s}s
              </button>
            ))}
          </div>

          {/* Pause */}
          <button
            onClick={() => setPaused((p) => !p)}
            className={[
              "text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors",
              paused
                ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-400"
                : "border-border text-text-muted hover:text-text",
            ].join(" ")}
          >
            {paused ? "▶ Resume" : "⏸ Pause"}
          </button>
        </div>
      </SectionHeader>

      <div
        className="flex-1 overflow-y-auto font-mono text-[10.5px] bg-bg rounded-lg border border-border p-2 min-h-0"
        onMouseEnter={() => { hovered.current = true; }}
        onMouseLeave={() => { hovered.current = false; }}
      >
        {visible.length === 0 ? (
          <div className="text-text-muted p-2">No log entries.</div>
        ) : (
          visible.map((entry, i) => {
            const lvl   = entry.level?.toUpperCase() ?? "INFO";
            const color = LEVEL_COLORS[lvl] ?? "text-text-muted";
            const ts    = entry.timestamp
              ? new Date(entry.timestamp).toLocaleTimeString("en-GB", { hour12: false })
              : "";
            return (
              <div key={i} className="flex gap-2 py-[1px] hover:bg-surface-hi px-1 rounded">
                <span className="text-text-dim shrink-0 select-none">{ts}</span>
                <span className={`shrink-0 w-11 ${color}`}>[{lvl}]</span>
                <span className="text-text break-all">{entry.message}</span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ points, color = "#00dc82" }: { points: SparkPoint[]; color?: string }) {
  if (points.length < 2) return null;

  const W = 100, H = 28;
  const vals   = points.map((p) => p.value);
  const min    = Math.min(...vals);
  const max    = Math.max(...vals);
  const range  = max - min || 1;

  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-7 opacity-50">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// ─── Meteo Tiles ─────────────────────────────────────────────────────────────

const METEO_FIELDS = [
  {
    key:   "temp",
    label: "Temperature",
    unit:  "°C",
    color: "#ff9966",
    icon:  (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/>
      </svg>
    ),
  },
  {
    key:   "humidity",
    label: "Humidity",
    unit:  "%",
    color: "#66b3ff",
    icon:  (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/>
      </svg>
    ),
  },
  {
    key:   "pressure",
    label: "Pressure",
    unit:  "hPa",
    color: "#c084fc",
    icon:  (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4l3 3"/>
        <path d="M12 6v.5M18 12h-.5M12 18v-.5M6 12h.5"/>
      </svg>
    ),
  },
  {
    key:   "wind",
    label: "Wind",
    unit:  "km/h",
    color: "#4ade80",
    icon:  (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M9.59 4.59A2 2 0 1111 8H2"/>
        <path d="M12.59 19.41A2 2 0 1014 16H2"/>
        <path d="M17.59 11.41A2 2 0 1019 8H2"/>
      </svg>
    ),
  },
] as const;

function MeteoTiles({ stationId }: { stationId: string }) {
  const [current,  setCurrent]  = useState<MeteoReading>({});
  const [sparklines, setSpark]  = useState<Record<string, SparkPoint[]>>({});

  // Current values
  useEffect(() => {
    const load = () =>
      fetch(`${API_BASE}/stations/${stationId}/env`)
        .then((r) => r.json())
        .then(setCurrent)
        .catch(() => {});
    load();
    const id = setInterval(load, 10_000);
    return () => clearInterval(id);
  }, [stationId]);

  // Sparkline history for each field
  useEffect(() => {
    METEO_FIELDS.forEach(({ key }) => {
      fetch(`${API_BASE}/stations/${stationId}/env/history?field=${key}&window=-1h&points=50`)
        .then((r) => r.json())
        .then((data: { value: number }[]) =>
          setSpark((prev) => ({ ...prev, [key]: data }))
        )
        .catch(() => {});
    });
  }, [stationId]);

  return (
    <div>
      <SectionHeader label="Environment" />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
        {METEO_FIELDS.map(({ key, label, unit, color, icon }) => {
          const val    = current[key as keyof MeteoReading];
          const points = sparklines[key] ?? [];
          return (
            <div
              key={key}
              className="bg-bg border border-border rounded-xl px-3 pt-3 pb-2 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <span style={{ color }} className="opacity-70">{icon}</span>
                <span className="font-mono text-[9.5px] uppercase tracking-widest text-text-muted">
                  {label}
                </span>
              </div>
              <div className="font-mono text-[20px] font-semibold text-text leading-none">
                {val != null ? val.toFixed(1) : "—"}
                <span className="text-[11px] font-normal text-text-muted ml-1">{unit}</span>
              </div>
              <Sparkline points={points} color={color} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Spinner ─────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="w-4 h-4 border border-border border-t-accent rounded-full animate-spin" />
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CommandClient() {
  const { station, state, fire, stop } = useStation();

  return (
    <div className="h-full overflow-hidden flex flex-col">

      {/* Breadcrumb */}
      <div className="shrink-0 flex items-center gap-1.5 px-5 py-2.5 border-b border-border font-mono text-[11px] text-text-muted">
        <a href="/stations" className="hover:text-text transition-colors no-underline">Stations</a>
        <span className="text-border-hi">/</span>
        <span className="text-text">{station.name}</span>
        <span className="text-border-hi">/</span>
        <span className="text-accent">Command Center</span>

        <div className="ml-auto flex items-center gap-3">
          <a
            href={`/station/${station.id}`}
            className="flex items-center gap-1.5 text-text-muted hover:text-accent transition-colors no-underline"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            3D View
          </a>
        </div>
      </div>

      {/* Two-column body */}
      <div className="flex-1 min-h-0 grid grid-cols-[320px_1fr] xl:grid-cols-[360px_1fr]">

        {/* Left: Context & Control */}
        <div className="border-r border-border overflow-y-auto flex flex-col divide-y divide-border">
          <div className="p-5">
            <PropertyGrid stationId={station.id} />
          </div>
          <div className="p-5">
            <ControlPanel state={state} fire={fire} stop={stop} />
          </div>
        </div>

        {/* Right: Live Telemetry */}
        <div className="flex flex-col min-h-0 overflow-hidden">

          {/* Log Viewer — flex-1 to take available space */}
          <div className="flex-1 min-h-0 p-5 flex flex-col">
            <LogViewer stationId={station.id} />
          </div>

          {/* Meteo Tiles — fixed height bottom section */}
          <div className="shrink-0 border-t border-border p-5">
            <MeteoTiles stationId={station.id} />
          </div>

        </div>
      </div>
    </div>
  );
}
