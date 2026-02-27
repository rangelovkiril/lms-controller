"use client";
import { useRef, useState, useEffect } from "react";
import { useTranslations }             from "next-intl";
import { ObsSet, PRESET_COLORS }       from "@/types";
import { useObservationSets }          from "@/hooks/useObservationSets";

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
        className="flex-1 bg-transparent border-b border-accent outline-none font-mono text-[11px] text-accent"
      />
    );
  }
  return (
    <span
      className="flex-1 truncate"
      onDoubleClick={(e) => { e.stopPropagation(); setDraft(value); setEditing(true); }}
      title={t("renameHint")}
    >
      {value}
    </span>
  );
}

function SetMenu({ set, onUpdate, onRemove, onClear }: {
  set:      ObsSet;
  onUpdate: <K extends keyof ObsSet>(id: string, key: K, val: ObsSet[K]) => void;
  onRemove: (id: string) => void;
  onClear:  (id: string) => void;
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
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        title={t("options")}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:text-text text-text-muted"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 w-44 rounded-lg border border-border bg-surface shadow-xl flex flex-col py-1"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 flex items-center gap-1.5 flex-wrap border-b border-border">
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
          <button
            onClick={() => { onClear(set.id); setOpen(false); }}
            className="w-full text-left px-3 py-1.5 font-mono text-[11px] text-text-muted hover:text-text hover:bg-white/5 transition-colors"
          >
            {t("clearPoints")}
          </button>
          <button
            onClick={() => { onRemove(set.id); setOpen(false); }}
            className="w-full text-left px-3 py-1.5 font-mono text-[11px] text-red-400/60 hover:text-red-400 hover:bg-white/5 transition-colors"
          >
            {t("deleteSet")}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ObservationSetPanel({
  sets, activeSetId, onSelect, onAdd, onRemove, onUpdate, onClear,
}: Props) {
  const t               = useTranslations("observationSets");
  const { openFilePicker } = useObservationSets();

  return (
    <div className="flex flex-col gap-3">

      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">
          {t("title")}
        </span>
        <div className="flex items-center gap-1">
          {/* Load file shortcut */}
          <button
            onClick={openFilePicker}
            title={t("loadFile")}
            className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-border text-text-muted hover:border-border-hi hover:text-text transition-colors"
          >
            ↑
          </button>
          {/* New empty set */}
          <button
            onClick={onAdd}
            className="font-mono text-[10px] px-2 py-0.5 rounded border border-border text-text-muted hover:border-border-hi hover:text-text transition-colors"
          >
            {t("newSet")}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {sets.length === 0 ? (
        <p className="text-[11px] font-mono text-text-muted/50 text-center py-3">
          {t("empty")}
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {sets.map((s) => (
            <div
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={[
                "flex items-center gap-2 w-full px-3 py-2 rounded-lg border font-mono text-[11px] transition-colors cursor-pointer group",
                s.id === activeSetId
                  ? "border-accent/50 bg-accent-dim text-accent"
                  : "border-border text-text-muted hover:border-border-hi hover:text-text",
              ].join(" ")}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0 ring-1 ring-white/10"
                style={{ background: s.color ?? "linear-gradient(135deg,#00e5ff 0%,#69ff47 50%,#ff4444 100%)" }}
              />

              <EditableLabel value={s.label} onChange={(v) => onUpdate(s.id, "label", v)} />

              <span className="shrink-0 font-mono text-[9px] text-text-muted/60">
                {s.points.length}
              </span>

              <button
                onClick={(e) => { e.stopPropagation(); onUpdate(s.id, "visible", !s.visible); }}
                title={s.visible ? t("hide") : t("show")}
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-text"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {s.visible
                    ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                    : <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                  }
                </svg>
              </button>

              <SetMenu set={s} onUpdate={onUpdate} onRemove={onRemove} onClear={onClear} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}