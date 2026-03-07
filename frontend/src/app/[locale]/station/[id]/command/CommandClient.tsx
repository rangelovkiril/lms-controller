"use client"
import { useStation }      from "@/contexts/stationContext";
import { useTranslations } from "next-intl";
import Link                from "next/link";
import { PropertyGrid } from "./PropertyGrid";
import { ControlPanel } from "./ControlPanel";
import { LogViewer }    from "./LogViewer";
import { MeteoTiles }   from "./MeteoTiles";

export default function CommandClient() {
  const { station, state, fire, stop } = useStation();
  const t = useTranslations("command");

  return (
    <div className="h-full overflow-hidden flex flex-col">

      {/* Breadcrumb */}
      <div className="shrink-0 flex items-center gap-1.5 px-5 py-2.5 border-b border-border font-mono text-[12px] text-text-muted">
        <Link href="/stations" className="hover:text-text transition-colors no-underline">{t("stations")}</Link>
        <span className="text-border-hi">/</span>
        <span className="text-text">{station.name}</span>
        <span className="text-border-hi">/</span>
        <span className="text-accent">{t("commandCenter")}</span>

        <div className="ml-auto flex items-center gap-3">
          <a
            href={`/station/${station.id}`}
            className="flex items-center gap-1.5 text-text-muted hover:text-accent transition-colors no-underline"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            {t("view3d")}
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
          <div className="flex-1 min-h-0 p-5 flex flex-col">
            <LogViewer stationId={station.id} />
          </div>
          <div className="shrink-0 border-t border-border p-5">
            <MeteoTiles stationId={station.id} />
          </div>
        </div>

      </div>
    </div>
  );
}
