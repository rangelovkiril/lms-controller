"use client";

import { useState, useEffect } from "react";
import { API_BASE } from "../../types";
import ExportPanel from "./ExportPanel";
import ImportPanel from "./Importpanel";

function flattenCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
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

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function Trajectories() {
  const [stations,     setStations]     = useState<string[]>([]);
  const [loadingStations, setLoadingStations] = useState(true);

  const [exportStation,   setExportStation]   = useState("");
  const [exportObjects,   setExportObjects]   = useState<string[]>([]);
  const [exportObject,    setExportObject]    = useState("");
  const [exportPreset,    setExportPreset]    = useState("1h");
  const [exportStart,     setExportStart]     = useState("");
  const [exportStop,      setExportStop]      = useState("");
  const [exportStatus,    setExportStatus]    = useState<"idle" | "loading-objects" | "exporting">("idle");
  const [exportError,     setExportError]     = useState("");
  const [lastExport,      setLastExport]      = useState<{ rows: number; format: string; time: string } | null>(null);

  const [importStation,   setImportStation]   = useState("");
  const [importObjects,   setImportObjects]   = useState<string[]>([]);
  const [importObject,    setImportObject]    = useState("");
  const [loadingImportObjects, setLoadingImportObjects] = useState(false);

  useEffect(() => {
    async function load() {
      setLoadingStations(true);
      try {
        const res  = await fetch(`${API_BASE}/stations`);
        const data: string[] = await res.json();
        setStations(data);
        if (data.length) {
          setExportStation(data[0]);
          setImportStation(data[0]);
        }
      } catch {
        const demo = ["test", "station-alpha", "station-beta"];
        setStations(demo);
        setExportStation(demo[0]);
        setImportStation(demo[0]);
      } finally {
        setLoadingStations(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!exportStation) return;
    async function load() {
      setExportStatus("loading-objects");
      setExportObjects([]);
      setExportObject("");
      try {
        const res  = await fetch(`${API_BASE}/objects?station=${encodeURIComponent(exportStation)}`);
        const data: string[] = await res.json();
        setExportObjects(data);
        if (data.length) setExportObject(data[0]);
      } catch {
        const demo = ["position"];
        setExportObjects(demo);
        setExportObject(demo[0]);
      } finally {
        setExportStatus("idle");
      }
    }
    load();
  }, [exportStation]);

  useEffect(() => {
    if (!importStation) return;
    async function load() {
      setLoadingImportObjects(true);
      setImportObjects([]);
      setImportObject("");
      try {
        const res  = await fetch(`${API_BASE}/objects?station=${encodeURIComponent(importStation)}`);
        const data: string[] = await res.json();
        setImportObjects(data);
        if (data.length) setImportObject(data[0]);
      } catch {
        const demo = ["position"];
        setImportObjects(demo);
        setImportObject(demo[0]);
      } finally {
        setLoadingImportObjects(false);
      }
    }
    load();
  }, [importStation]);

  async function handleDownload(format: "csv" | "json") {
    setExportError("");
    setLastExport(null);
    setExportStatus("exporting");
    try {
      const flux = [
        { value: "15m", flux: "-15m" }, { value: "1h",  flux: "-1h"  },
        { value: "6h",  flux: "-6h"  }, { value: "24h", flux: "-24h" },
        { value: "7d",  flux: "-7d"  }, { value: "30d", flux: "-30d" },
        { value: "custom", flux: "" },
      ].find((p) => p.value === exportPreset)!.flux;

      const params = new URLSearchParams({ station: exportStation, object: exportObject });
      if (exportPreset === "custom") {
        params.set("start", new Date(exportStart).toISOString());
        if (exportStop) params.set("stop", new Date(exportStop).toISOString());
      } else {
        params.set("start", flux);
      }

      const res  = await fetch(`${API_BASE}/data?${params}`);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const rows: Record<string, unknown>[] = await res.json();

      const ts       = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
      const filename = `${exportStation}_${exportObject}_${exportPreset}_${ts}`;

      if (format === "csv") {
        downloadBlob(flattenCSV(rows), `${filename}.csv`, "text/csv");
      } else {
        downloadBlob(JSON.stringify(rows, null, 2), `${filename}.json`, "application/json");
      }

      setLastExport({ rows: rows.length, format: format.toUpperCase(), time: new Date().toLocaleTimeString("bg-BG") });
    } catch (e) {
      setExportError(e instanceof Error ? e.message : String(e));
    } finally {
      setExportStatus("idle");
    }
  }

  function handleOverlay() {
    // TODO: визуализация
    console.log("Overlay trajectory:", exportStation, exportObject, exportPreset);
  }

  async function handleSend(file: File, station: string, object: string) {
    const formData = new FormData();
    formData.append("file",    file);
    formData.append("station", station);
    formData.append("object",  object);

    const res = await fetch(`${API_BASE}/trajectory/upload`, {
      method: "POST",
      body:   formData,
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">

        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">Траектории</h1>
          <p className="text-xs font-mono text-text-muted">Експорт и импорт на траектории към станция</p>
        </div>

        <div className="grid grid-cols-2 gap-4 items-start">
          <ExportPanel
            stations={stations}
            station={exportStation}
            apiBase={API_BASE}
            objects={exportObjects}
            object={exportObject}
            preset={exportPreset}
            customStart={exportStart}
            customStop={exportStop}
            status={exportStatus}
            loadingStations={loadingStations}
            error={exportError}
            lastExport={lastExport}
            onStationChange={setExportStation}
            onObjectChange={setExportObject}
            onPresetChange={setExportPreset}
            onCustomStartChange={setExportStart}
            onCustomStopChange={setExportStop}
            onDownload={handleDownload}
            onOverlay={handleOverlay}
          />

          <ImportPanel
            stations={stations}
            station={importStation}
            objects={importObjects}
            object={importObject}
            loadingStations={loadingStations}
            loadingObjects={loadingImportObjects}
            onStationChange={setImportStation}
            onObjectChange={setImportObject}
            onSend={handleSend}
          />
        </div>

      </div>
    </div>
  );
}