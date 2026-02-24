import { useState, useEffect } from "react";
import { API_BASE, TIME_PRESETS } from "@/types";

export function useExport(stations: string[], loadingStations: boolean) {
  const [state, setState] = useState({
    station: "",
    object: "",
    objects: [] as string[],
    preset: "1h",
    customStart: "",
    customStop: "",
    status: "idle" as "idle" | "loading-objects" | "exporting",
    error: "",
    lastExport: null as { rows: number; format: string; time: string } | null,
  });

  const patch = (val: Partial<typeof state>) => setState(prev => ({ ...prev, ...val }));

  useEffect(() => {
    if (!loadingStations && stations.length && !state.station) {
      patch({ station: stations[0] });
    }
  }, [stations, loadingStations, state.station]);

  useEffect(() => {
    if (!state.station) return;
    const controller = new AbortController();

    const loadObjects = async () => {
      patch({ status: "loading-objects", objects: [], object: "" });
      try {
        const res = await fetch(`${API_BASE}/objects?station=${state.station}`, { signal: controller.signal });
        const data = await res.json();
        patch({ objects: data, object: data[0] || "", status: "idle" });
      } catch (e: any) {
        if (e.name !== "AbortError") patch({ status: "idle", error: "Failed to load objects" });
      }
    };

    loadObjects();
    return () => controller.abort();
  }, [state.station]);

  const download = async (format: "csv" | "json") => {
    patch({ status: "exporting", error: "", lastExport: null });
    try {
      const flux = TIME_PRESETS.find(p => p.value === state.preset)?.flux;
      const params = new URLSearchParams({ station: state.station, object: state.object });
      
      if (state.preset === "custom") {
        params.set("start", new Date(state.customStart).toISOString());
        if (state.customStop) params.set("stop", new Date(state.customStop).toISOString());
      } else {
        params.set("start", flux || "");
      }

      const res = await fetch(`${API_BASE}/data?${params}`);
      if (!res.ok) throw new Error("Fetch failed");
      
      const rows = await res.json();
      
      patch({
        status: "idle",
        lastExport: { rows: rows.length, format: format.toUpperCase(), time: new Date().toLocaleTimeString("bg-BG") }
      });
    } catch (e: any) {
      patch({ status: "idle", error: e.message });
    }
  };

  return { ...state, patch, download };
}