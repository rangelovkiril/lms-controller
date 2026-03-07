"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { API_BASE } from "@/types";
import { Spinner } from "@/components/ui/Spinner";
import { SectionHeader } from "./SectionHeader";

interface StationMeta {
  stationId:    string;
  name:         string;
  lat:          number;
  lon:          number;
  description?: string;
}

const inputCls =
  "w-full bg-transparent border-0 font-mono text-[13px] text-text outline-none " +
  "focus:bg-surface-hi rounded px-1.5 py-0.5 transition-colors placeholder:text-text-muted/40 " +
  "[color-scheme:dark]";

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[90px_1fr] items-center gap-2 py-1.5 border-b border-border/50 last:border-0">
      <span className="font-mono text-[11.5px] text-text-muted uppercase tracking-wide shrink-0">
        {label}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function PropertyGrid({ stationId }: { stationId: string }) {
  const t = useTranslations("command");
  const [meta,    setMeta]    = useState<StationMeta | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [geocode, setGeocode] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/stations/${stationId}`)
      .then((r) => r.json())
      .then(setMeta)
      .catch(() => {});
  }, [stationId]);

  useEffect(() => {
    if (!meta) return;
    const id = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${meta.lat}&lon=${meta.lon}&format=json`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        setGeocode(data.display_name?.split(",").slice(0, 2).join(", ") ?? "");
      } catch {
        setGeocode("");
      }
    }, 800);
    return () => clearTimeout(id);
  }, [meta?.lat, meta?.lon]);

  const patch = (key: keyof StationMeta, value: string | number) =>
    setMeta((m) => m ? { ...m, [key]: value } : m);

  const save = async () => {
    if (!meta) return;
    setSaving(true);
    try {
      await fetch(`${API_BASE}/stations/${stationId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:        meta.name,
          lat:         meta.lat,
          lon:         meta.lon,
          description: meta.description,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (!meta) return (
    <div className="h-48 flex items-center justify-center">
      <Spinner />
    </div>
  );

  return (
    <div>
      <SectionHeader label={t("metadata")}>
        <button
          onClick={save}
          disabled={saving}
          className={[
            "text-[11.5px] font-mono px-2.5 py-1 rounded border transition-colors disabled:opacity-40",
            saved
              ? "border-accent/40 bg-accent-dim text-accent"
              : "border-border text-text-muted hover:border-border-hi hover:text-text",
          ].join(" ")}
        >
          {saving ? t("saving") : saved ? t("saved") : t("save")}
        </button>
      </SectionHeader>

      <div className="flex flex-col gap-0">
        <PropRow label={t("propId")}>
          <span className="font-mono text-[13px] text-text-muted">{meta.stationId}</span>
        </PropRow>
        <PropRow label={t("propName")}>
          <input
            className={inputCls}
            value={meta.name}
            onChange={(e) => patch("name", e.target.value)}
          />
        </PropRow>
        <PropRow label={t("propDescription")}>
          <input
            className={inputCls}
            value={meta.description ?? ""}
            placeholder="—"
            onChange={(e) => patch("description", e.target.value)}
          />
        </PropRow>
        <PropRow label={t("propLatitude")}>
          <input
            type="number"
            step="0.001"
            className={inputCls}
            value={meta.lat}
            onChange={(e) => patch("lat", parseFloat(e.target.value) || 0)}
          />
        </PropRow>
        <PropRow label={t("propLongitude")}>
          <input
            type="number"
            step="0.001"
            className={inputCls}
            value={meta.lon}
            onChange={(e) => patch("lon", parseFloat(e.target.value) || 0)}
          />
        </PropRow>
        {geocode && (
          <PropRow label={t("propLocation")}>
            <span className="font-mono text-[12px] text-text-muted truncate" title={geocode}>
              📍 {geocode}
            </span>
          </PropRow>
        )}
      </div>
    </div>
  );
}
