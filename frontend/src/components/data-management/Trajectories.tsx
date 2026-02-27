"use client";

import { useState, useEffect } from "react";
import { useTranslations }     from "next-intl";
import { API_BASE }            from "@/types";
import { useObservationSets }  from "@/hooks/useObservationSets";
import { ParseError }          from "@/lib/parseObservationFile";
import ExportPanel             from "./ExportPanel";
import ImportPanel             from "./ImportPanel";

export default function Trajectories() {
  const t = useTranslations("trajectories");

  const [stations,        setStations]        = useState<string[]>([]);
  const [loadingStations, setLoadingStations] = useState(true);
  const [overlayError,    setOverlayError]    = useState("");

  const { addSetFromFiles } = useObservationSets();

  useEffect(() => {
    setLoadingStations(true);
    fetch(`${API_BASE}/stations`)
      .then((r) => r.json())
      .then(setStations)
      .catch(() => setStations([]))
      .finally(() => setLoadingStations(false));
  }, []);

  async function handleOverlay(files: File[], label: string) {
    setOverlayError("");
    try {
      await addSetFromFiles(files, label);
    } catch (e) {
      setOverlayError(e instanceof ParseError ? e.message : t("overlayError"));
    }
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">

        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-xs font-mono text-text-muted">{t("subtitle")}</p>
        </div>

        {overlayError && (
          <div className="px-4 py-2.5 rounded-lg border border-danger/40 bg-danger/10 font-mono text-[12px] text-danger">
            {overlayError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 items-start">
          <ExportPanel stations={stations} loadingStations={loadingStations} />
          <ImportPanel onOverlay={handleOverlay} />
        </div>

      </div>
    </div>
  );
}