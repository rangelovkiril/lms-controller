"use client";
import { useRef, useState, useEffect } from "react";
import { useTranslations }             from "next-intl";
import { ObsSet, PRESET_COLORS }       from "@/types";
import { useObservationSets } from "@/contexts/observationSetContext";

interface Props {
  sets:        ObsSet[];
  activeSetId: string;
  onSelect:    (id: string) => void;
  onAdd:       () => void;
  onRemove:    (id: string) => void;
  onUpdate:    <K extends keyof ObsSet>(id: string, key: K, val: ObsSet[K]) => void;
  onClear:     (id: string) => void;
}

function EditableLabel({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useTranslations("observationSets");
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value);
  const commit = () => { setEditing(false); onChange(draft.trim() || value); };

  if (editing) {
    return (
      <input
        autoFocus value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter")  commit();
          if (e.key === "Escape") { setDraft(value); setEditing(false); }
        }}
        onClick={(e) => e.stopPropagation()}
        className="flex-1 min-w-0 bg-transparent border-b border-accent outline-none font-mono text-[11px] text-accent"
      />
    );
  }
  return (
    <span
      className="flex-1 min-w-0 truncate"
      onDoubleClick={(e) => { e.stopPropagation(); setDraft(value); setEditing(true); }}
      title={t("renameHint")}
    >
      {value}
    </span>
  );
}

function ColorDot({ set, onUpdate }: {
  set:      ObsSet;
  onUpdate: <K extends keyof ObsSet>(id: string, key: K, val: ObsSet[K]) => void;
}) {
  const t               = useTranslations("observationSets");
  const [open, setOpen] = useState(false);
  const ref             = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <span
        className="block w-2 h-2 rounded-full ring-1 ring-white/10 cursor-pointer"
        style={{ background: set.color ?? "linear-gradient(135deg,#00e5ff 0%,#69ff47 50%,#ff4444 100%)" }}
        onDoubleClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
      />

      {open && (
        <div
          className="absolute left-0 top-full mt-1.5 z-50 w-44 rounded-lg border border-border bg-surface shadow-xl p-2 flex items-center gap-1.5 flex-wrap"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { onUpdate(set.id, "color", null); setOpen(false); }}
            className={[
              "px-1.5 py-0.5 rounded border font-mono text-[9px] transition-colors",
              set.color === null
                ? "border-accent/60 bg-accent-dim text-accent"
                : "border-border text-text-muted hover:text-text",
            ].join(" ")}
          >
            {t("speed")}
          </button>
          {PRESET_COLORS.map((hex) => (
            <button
              key={hex}
              onClick={() => { onUpdate(set.id, "color", hex); setOpen(false); }}
              className={[
                "w-4 h-4 rounded-sm border-2 transition-all",
                set.color === hex ? "border-white scale-110" : "border-transparent hover:scale-105",
              ].join(" ")}
              style={{ backgroundColor: hex }}
            />
          ))}
          <label className="w-4 h-4 rounded-sm border border-dashed border-border flex items-center justify-center cursor-pointer hover:border-border-hi relative" title="Custom">
            <span className="font-mono text-[9px] text-text-muted leading-none">+</span>
            <input
              type="color"
              value={set.color ?? "#00ffaa"}
              onChange={(e) => onUpdate(set.id, "color", e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            />
          </label>
        </div>
      )}
    </div>
  );
}

export default function ObservationSetPanel({
  sets, activeSetId, onSelect, onAdd, onRemove, onUpdate, onClear,
}: Props) {
  const t                  = useTranslations("observationSets");
  const { openFilePicker } = useObservationSets();

  return (
    <div className="flex flex-col gap-3">

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">
          {t("title")}
        </span>
        <button
          onClick={openFilePicker}
          title={t("loadFile")}
          className="font-mono text-[10px] px-2 py-0.5 rounded border border-border text-text-muted hover:border-border-hi hover:text-text transition-colors flex items-center gap-1"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </button>
      </div>

      {sets.length === 0 ? (
        <button
          onClick={openFilePicker}
          className="w-full flex flex-col items-center justify-center gap-1.5 py-4 rounded-lg border border-dashed border-border text-text-muted/50 hover:text-text-muted hover:border-border-hi transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span className="font-mono text-[10px]">{t("loadFile")}</span>
        </button>
      ) : (
        <div className="flex flex-col gap-1">
          {sets.map((s) => (
            <div
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={[
                "flex items-center gap-2 w-full min-w-0 px-3 py-2 rounded-lg border font-mono text-[11px] transition-colors cursor-pointer group",
                s.id === activeSetId
                  ? "border-accent/50 bg-accent-dim text-accent"
                  : "border-border text-text-muted hover:border-border-hi hover:text-text",
              ].join(" ")}
            >
              <ColorDot set={s} onUpdate={onUpdate} />

              <EditableLabel value={s.label} onChange={(v) => onUpdate(s.id, "label", v)} />

              <span className="shrink-0 font-mono text-[9px] text-text-muted/60">
                {s.points.length}
              </span>

              {/* Visibility toggle — always visible */}
              <button
                onClick={(e) => { e.stopPropagation(); onUpdate(s.id, "visible", !s.visible); }}
                title={s.visible ? t("hide") : t("show")}
                className="shrink-0 text-text-muted hover:text-text transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {s.visible
                    ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                    : <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                  }
                </svg>
              </button>

              {/* Delete — always visible */}
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(s.id); }}
                title={t("deleteSet")}
                className="shrink-0 text-text-muted hover:text-red-400 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
