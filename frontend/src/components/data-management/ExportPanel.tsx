"use client";
import { useTranslations } from "next-intl";
import { TIME_PRESETS } from "../../types";
import { Dropdown } from "../ui/Dropdown";
import { StatusBar } from "../ui/StatusBar";
import { TimePicker } from "@/components/ui/TimePicker";
import { DatePicker } from "@/components/ui/DatePicker";
import { Spinner } from "../ui/Spinner";
import { Label } from "../ui/Label";
import { useExport } from "@/hooks/useExport";

const DownloadIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
  >
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export default function ExportPanel({
  stations,
  loadingStations,
}: {
  stations: string[];
  loadingStations: boolean;
}) {
  const t = useTranslations("export");
  const {
    station,
    object,
    objects,
    preset,
    status,
    error,
    lastExport,
    customStart,
    customStop,
    patch,
    download,
  } = useExport(stations, loadingStations);

  const isCustom = preset === "custom";
  const canExport = !!(
    station &&
    object &&
    (isCustom ? !!customStart : true) &&
    status === "idle"
  );

  const DownloadButton = ({
    format,
    label,
    cls,
  }: {
    format: "csv" | "json";
    label: string;
    cls: string;
  }) => (
    <button
      disabled={!canExport}
      onClick={() => download(format)}
      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md text-[14px] font-medium transition-all duration-150 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer ${cls}`}
    >
      {status === "exporting" ? (
        <>
          <Spinner /> {t("exporting")}
        </>
      ) : (
        label
      )}
    </button>
  );

  return (
    <div className="bg-surface border border-border rounded-[14px] overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-accent-dim border border-accent/20 flex items-center justify-center text-accent">
          <DownloadIcon />
        </div>
        <div className="text-[15px] font-semibold text-text">{t("title")}</div>
      </div>

      <div className="p-6 flex flex-col gap-5 flex-1">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{t("station")}</Label>
            <Dropdown
              value={station}
              options={stations}
              onChange={(v) => patch({ station: v })}
              loading={loadingStations}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("object")}</Label>
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
          <Label>{t("timeWindow")}</Label>
          <div className="flex flex-wrap gap-1.5">
            {TIME_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => patch({ preset: p.value })}
                className={`font-mono text-[12.5px] px-2.5 py-1.5 rounded-md border transition-all ${
                  preset === p.value
                    ? "bg-accent-dim border-accent/50 text-accent"
                    : "bg-bg border-border text-text-muted"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {isCustom && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="flex flex-col gap-1.5">
              <Label>{t("from")}</Label>
              <div className="flex gap-3">
                <div className="flex-1 min-w-0">
                  <DatePicker
                    value={customStart}
                    onChange={(v) => patch({ customStart: v })}
                  />
                </div>
                <div className="shrink-0">
                  <TimePicker
                    value={customStart}
                    onChange={(v) => patch({ customStart: v })}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("to")}</Label>
              <div className="flex gap-3">
                <div className="flex-1 min-w-0">
                  <DatePicker
                    value={customStop}
                    onChange={(v) => patch({ customStop: v })}
                  />
                </div>
                <div className="shrink-0">
                  <TimePicker
                    value={customStop}
                    onChange={(v) => patch({ customStop: v })}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-auto">
          <DownloadButton
            format="csv"
            label="CSV"
            cls="bg-accent text-black hover:bg-[#00f090]"
          />
          <DownloadButton
            format="json"
            label="JSON"
            cls="bg-blue text-white hover:bg-[#1a80ff]"
          />
        </div>
      </div>

      <StatusBar
        status={status}
        error={error}
        lastAction={
          lastExport
            ? {
                label: t("rows", {
                  rows: lastExport.rows,
                  format: lastExport.format,
                }),
                time: lastExport.time,
              }
            : null
        }
        station={station}
        object={object}
      />
    </div>
  );
}
