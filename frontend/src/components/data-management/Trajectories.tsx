"use client";

import { useState, useEffect } from "react";
import { API_BASE } from "@/types";
import { useExport } from "@/hooks/useExport";
import ExportPanel   from "./ExportPanel";
import ImportPanel   from "./ImportPanel";

export default function Trajectories() {
  const [stations,        setStations]        = useState<string[]>([]);
  const [loadingStations, setLoadingStations] = useState(true);

  useEffect(() => {
    async function load() {
      setLoadingStations(true);
      try {
        const res  = await fetch(`${API_BASE}/stations`);
        const data: string[] = await res.json();
        setStations(data);
      } catch {
        setStations(["test", "station-alpha", "station-beta"]);
      } finally {
        setLoadingStations(false);
      }
    }
    load();
  }, []);

  const exportCtx = useExport(stations, loadingStations);

  async function handleSend(file: File, observationSet: string) {
    const form = new FormData();
    form.append("file", file);
    form.append("observationSet", observationSet);
    const res = await fetch(`${API_BASE}/import`, { method: "POST", body: form });
    if (!res.ok) throw new Error(await res.text());
  }

  function handleOverlay(file: File, observationSet: string) {
    // TODO: parse file and push to 3D visualisation overlay
    console.log("Overlay:", file.name, observationSet);
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
            station={exportCtx.station}
            apiBase={API_BASE}
            objects={exportCtx.objects}
            object={exportCtx.object}
            preset={exportCtx.preset}
            customStart={exportCtx.customStart}
            customStop={exportCtx.customStop}
            status={exportCtx.status}
            loadingStations={loadingStations}
            error={exportCtx.error}
            lastExport={exportCtx.lastExport}
            onStationChange={exportCtx.setStation}
            onObjectChange={exportCtx.setObject}
            onPresetChange={exportCtx.setPreset}
            onCustomStartChange={exportCtx.setCustomStart}
            onCustomStopChange={exportCtx.setCustomStop}
            onDownload={exportCtx.download}
          />

          <ImportPanel
            onSend={handleSend}
            onOverlay={handleOverlay}
          />
        </div>

      </div>
    </div>
  );
}