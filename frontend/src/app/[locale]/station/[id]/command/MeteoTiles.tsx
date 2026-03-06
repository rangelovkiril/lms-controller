"use client";
import { useState, useEffect } from "react";
import { API_BASE } from "@/types";
import { SectionHeader } from "./SectionHeader";

interface SparkPoint   { value: number }
interface MeteoReading { temp?: number; humidity?: number; pressure?: number; wind?: number }

function Sparkline({ points, color = "#00dc82" }: { points: SparkPoint[]; color?: string }) {
  if (points.length < 2) return null;

  const W = 100, H = 28;
  const vals  = points.map((p) => p.value);
  const min   = Math.min(...vals);
  const max   = Math.max(...vals);
  const range = max - min || 1;

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

export function MeteoTiles({ stationId }: { stationId: string }) {
  const [current,   setCurrent] = useState<MeteoReading>({});
  const [sparklines, setSpark]  = useState<Record<string, SparkPoint[]>>({});

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
