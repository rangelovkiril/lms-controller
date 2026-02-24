import { useState, useEffect } from "react";
import { API_BASE } from "@/types";

export function useImport(stations: string[], loadingStations: boolean) {
  const [station,        setStation]        = useState("");
  const [objects,        setObjects]        = useState<string[]>([]);
  const [object,         setObject]         = useState("");
  const [loadingObjects, setLoadingObjects] = useState(false);

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
      setLoadingObjects(true);
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
        if (!cancelled) setLoadingObjects(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [station]);

  async function send(file: File): Promise<void> {
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

  return {
    station, setStation,
    objects, object, setObject,
    loadingObjects,
    send,
  };
}
