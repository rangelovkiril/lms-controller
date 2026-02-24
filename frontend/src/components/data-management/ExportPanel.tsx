import { TIME_PRESETS } from "../../types";
import { Dropdown } from "../ui/Dropdown";
import { StatusBar } from "../ui/StatusBar";
import { inputBase } from "../ui/inputStyles";
import { Spinner } from "../ui/Spinner";
import { Label } from "../ui/Label";
import { useExport } from "@/hooks/useExport"; 

export default function ExportPanel({ 
  stations, 
  loadingStations 
}: { 
  stations: string[], 
  loadingStations: boolean 
}) {
  const { 
    station, object, objects, preset, status, error, lastExport, 
    customStart, customStop, patch, download 
  } = useExport(stations, loadingStations);

  const isCustom = preset === "custom";
  const canExport = !!(station && object && (isCustom ? !!customStart : true) && status === "idle");

  const renderDownloadButton = (format: "csv" | "json", label: string, colorClass: string) => (
    <button
      disabled={!canExport}
      onClick={() => download(format)}
      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md text-[13px] font-medium transition-all duration-150 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer ${colorClass}`}
    >
      {status === "exporting" ? <><Spinner /> Експортира...</> : label}
    </button>
  );

  return (
    <div className="bg-surface border border-border rounded-[14px] overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border flex flex-col">
        <div className="text-sm font-semibold text-text">Експорт</div>
        <div className="text-[11px] font-mono text-text-muted">API: /data</div>
      </div>

      <div className="p-6 flex flex-col gap-5 flex-1">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Станция</Label>
            <Dropdown
              value={station}
              options={stations}
              onChange={(v) => patch({ station: v })}
              loading={loadingStations}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Обект</Label>
            <Dropdown
              value={object}
              options={objects}
              onChange={(v) => patch({ object: v })}
              disabled={!station}
              loading={status === "loading-objects"}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Времеви прозорец</Label>
          <div className="flex flex-wrap gap-1.5">
            {TIME_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => patch({ preset: p.value })}
                className={`font-mono text-[11.5px] px-2.5 py-1.5 rounded-md border transition-all ${
                  preset === p.value ? "bg-accent-dim border-accent/50 text-accent" : "bg-bg border-border text-text-muted"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {isCustom && (
          <div className="grid grid-cols-2 gap-2 animate-fade-in">
            <input type="datetime-local" className={inputBase} value={customStart} onChange={(e) => patch({ customStart: e.target.value })} />
            <input type="datetime-local" className={inputBase} value={customStop} onChange={(e) => patch({ customStop: e.target.value })} />
          </div>
        )}

        <div className="flex gap-2 mt-auto">
          {renderDownloadButton("csv", "CSV", "bg-accent text-black hover:bg-[#00f090]")}
          {renderDownloadButton("json", "JSON", "bg-blue text-white hover:bg-[#1a80ff]")}
        </div>
      </div>

      <StatusBar 
        status={status} 
        error={error} 
        lastAction={lastExport ? { label: `${lastExport.rows} реда · ${lastExport.format}`, time: lastExport.time } : null}
        station={station}
        object={object}
      />
    </div>
  );
}