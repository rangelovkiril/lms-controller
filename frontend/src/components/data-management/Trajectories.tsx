"use client";

import { useState, useEffect }  from "react";
import { useTranslations }      from "next-intl";
import { API_BASE }             from "@/types";
import ExportPanel              from "./ExportPanel";
import ImportPanel              from "./ImportPanel";

export default function Trajectories() {
  const t = useTranslations("trajectories");

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
        setStations([]);
      } finally {
        setLoadingStations(false);
      }
    }
    load();
  }, []);

  function handleOverlay(files: File[], observationSet: string) {
    // TODO: parse & push to 3D overlay
    console.warn("Overlay not yet implemented", files, observationSet);
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">

        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-xs font-mono text-text-muted">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 items-start">
          <ExportPanel stations={stations} loadingStations={loadingStations} />
          <ImportPanel onOverlay={handleOverlay} />
        </div>

      </div>
    </div>
  );
}