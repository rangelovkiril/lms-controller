import { useState, useEffect } from "react";
import { API_BASE, TIME_PRESETS } from "@/types";

interface LastExport {
  rows:   number;
  format: string;
  time:   string;
}

export type ExportStatus = "idle" | "loading-objects" | "exporting";

function flattenCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines   = [headers.join(",")];
  for (const row of rows) {
    lines.push(
      headers.map((h) => {
        const v = String(row[h] ?? "");
        return v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
      }).join(",")
    );
  }
  return lines.join("\n");
}

function downloadBlob(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function useExport(stations: string[], loadingStations: boolean) {
  const [station,    setStation]    = useState("");
  const [objects,    setObjects]    = useState<string[]>([]);
  const [object,     setObject]     = useState("");
  const [preset,     setPreset]     = useState("1h");
  const [customStart, setCustomStart] = useState("");
  const [customStop,  setCustomStop]  = useState("");
  const [status,     setStatus]     = useState<ExportStatus>("idle");
  const [error,      setError]      = useState("");
  const [lastExport, setLastExport] = useState<LastExport | null>(null);

  // Initialise station once station list is loaded
  useEffect(() => {
    if (!loadingStations && stations.length && !station) {
      setStation(stations[0]);
    }
  }, [stations, loadingStations, station]);

  // Fetch objects whenever selected station changes
  useEffect(() => {
    if (!station) return;
    let cancelled = false;

    async function load() {
      setStatus("loading-objects");
      setObjects([]);
      setObject("");
      try {
        const res  = await fetch(`${API_BASE}/objects?station=${encodeURIComponent(station)}`);
        const data: string[] = await res.json();
        if (!cancelled) {
          setObjects(data);
          if (data.length) setObject(data[0]);
        }
      } catch {
        if (!cancelled) {
          setObjects(["position"]);
          setObject("position");
        }
      } finally {
        if (!cancelled) setStatus("idle");
      }
    }

    load();
    return () => { cancelled = true; };
  }, [station]);

  async function download(format: "csv" | "json") {
    setError("");
    setLastExport(null);
    setStatus("exporting");
    try {
      const fluxPreset = TIME_PRESETS.find((p) => p.value === preset)!;
      const params     = new URLSearchParams({ station, object });

      if (preset === "custom") {
        params.set("start", new Date(customStart).toISOString());
        if (customStop) params.set("stop", new Date(customStop).toISOString());
      } else {
        params.set("start", fluxPreset.flux);
      }

      const res = await fetch(`${API_BASE}/data?${params}`);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

      const rows: Record<string, unknown>[] = await res.json();
      const ts       = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
      const filename = `${station}_${object}_${preset}_${ts}`;

      if (format === "csv") {
        downloadBlob(flattenCSV(rows), `${filename}.csv`, "text/csv");
      } else {
        downloadBlob(JSON.stringify(rows, null, 2), `${filename}.json`, "application/json");
      }

      setLastExport({
        rows:   rows.length,
        format: format.toUpperCase(),
        time:   new Date().toLocaleTimeString("bg-BG"),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setStatus("idle");
    }
  }

  return {
    station, setStation,
    objects, object, setObject,
    preset,  setPreset,
    customStart, setCustomStart,
    customStop,  setCustomStop,
    status, error, lastExport,
    download,
  };
}
