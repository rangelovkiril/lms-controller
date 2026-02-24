"use client";

import { TIME_PRESETS } from "../../types";
import { Dropdown } from "../ui/Dropdown";
import { StatusBar } from "../ui/StatusBar";
import { inputBase } from "../ui/inputStyles";
import { Spinner } from "../ui/Spinner";
import { Label } from "../ui/Label";

type Status = "idle" | "loading-objects" | "exporting";

export type ExportPanelProps = {
  stations:            string[];
  station:             string;
  apiBase:             string;
  objects:             string[];
  object:              string;
  preset:              string;
  customStart:         string;
  customStop:          string;
  status:              Status;
  loadingStations:     boolean;
  error:               string;
  lastExport:          { rows: number; format: string; time: string } | null;
  onStationChange:     (v: string) => void;
  onObjectChange:      (v: string) => void;
  onPresetChange:      (v: string) => void;
  onCustomStartChange: (v: string) => void;
  onCustomStopChange:  (v: string) => void;
  onDownload:          (format: "csv" | "json") => void;
  onOverlay:           () => void;
};

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

function OverlayIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
      <path d="M13 13l6 6"/>
    </svg>
  );
}

export default function ExportPanel({
  stations, station, apiBase, objects, object, preset,
  customStart, customStop, status, loadingStations, error, lastExport,
  onStationChange, onObjectChange, onPresetChange,
  onCustomStartChange, onCustomStopChange, onDownload, onOverlay,
}: ExportPanelProps) {
  const isCustom  = preset === "custom";
  const canExport = !!(station && object && (isCustom ? !!customStart : true) && status === "idle");

  return (
    <div className="bg-surface border border-border rounded-[14px] overflow-hidden flex flex-col h-full">

      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-accent-dim border border-accent/20 flex items-center justify-center text-accent">
          <DownloadIcon />
        </div>
        <div>
          <div className="text-sm font-semibold text-text">Експорт</div>
          <div className="text-[11px] font-mono text-text-muted">{apiBase}/data</div>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-5 flex-1">

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Станция</Label>
            <Dropdown
              value={station}
              options={stations}
              onChange={onStationChange}
              loading={loadingStations}
              placeholder="Избери станция"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Обект</Label>
            <Dropdown
              value={object}
              options={objects}
              onChange={onObjectChange}
              disabled={!station}
              loading={status === "loading-objects"}
              placeholder="Избери обект"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Времеви прозорец</Label>
          <div className="flex flex-wrap gap-1.5">
            {TIME_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => onPresetChange(p.value)}
                className={[
                  "font-mono text-[11.5px] px-2.5 py-1.5 rounded-md border transition-all duration-100 cursor-pointer",
                  preset === p.value
                    ? "bg-accent-dim border-accent/50 text-accent"
                    : "bg-bg border-border text-text-muted hover:border-border-hi hover:text-text",
                ].join(" ")}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {isCustom && (
          <div className="grid grid-cols-2 gap-2 animate-fade-in">
            <div className="flex flex-col gap-1.5">
              <Label>От</Label>
              <input type="datetime-local" className={inputBase} value={customStart} onChange={(e) => onCustomStartChange(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>До</Label>
              <input type="datetime-local" className={inputBase} value={customStop}  onChange={(e) => onCustomStopChange(e.target.value)} />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-1 mt-auto">
          <div className="flex gap-2">
            <button
              disabled={!canExport}
              onClick={() => onDownload("csv")}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md text-[13px] font-medium bg-accent text-black transition-all duration-150 disabled:opacity-35 disabled:cursor-not-allowed hover:enabled:bg-[#00f090] hover:enabled:shadow-[0_0_20px_#00dc8230] cursor-pointer"
            >
              {status === "exporting" ? <><Spinner />Експортира…</> : <><DownloadIcon />CSV</>}
            </button>
            <button
              disabled={!canExport}
              onClick={() => onDownload("json")}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md text-[13px] font-medium bg-blue text-white transition-all duration-150 disabled:opacity-35 disabled:cursor-not-allowed hover:enabled:bg-[#1a80ff] hover:enabled:shadow-[0_0_20px_#0070f330] cursor-pointer"
            >
              {status === "exporting" ? <><Spinner />Експортира…</> : <><DownloadIcon />JSON</>}
            </button>
          </div>

        </div>
      </div>

      <StatusBar
        status={status}
        error={error}
        lastAction={lastExport ? { label: `${lastExport.rows.toLocaleString()} реда · ${lastExport.format}`, time: lastExport.time } : null}
        idleLabel="Готов за експорт"
        station={station}
        object={object}
      />
    </div>
  );
}