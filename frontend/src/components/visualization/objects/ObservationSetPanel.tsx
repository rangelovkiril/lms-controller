"use client";
import { useRef, useState, useEffect } from "react";
import { ObsSet, PRESET_COLORS } from "@/types";

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
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value);

  const commit = () => { setEditing(false); onChange(draft.trim() || value); };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
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
      title="Double-click to rename"
    >
      {value}
    </span>
  );
}

// ─── Three-dot context menu ───────────────────────────────────────────────────

function SetMenu({
  set,
  onUpdate,
  onRemove,
  onClear,
}: {
  set:      ObsSet;
  onUpdate: <K extends keyof ObsSet>(id: string, key: K, val: ObsSet[K]) => void;
  onRemove: (id: string) => void;
  onClear:  (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref             = useRef<HTMLDivElement>(null);

  // Затвори при клик извън менюто
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      {/* Trigger */}
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        title="Options"
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:text-text text-text-muted"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5"  cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 w-44 rounded-lg border border-border bg-surface shadow-xl flex flex-col py-1"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Color presets */}
          <div className="px-3 py-1.5 flex items-center gap-1.5 flex-wrap border-b border-border">
            {/* Speed */}
            <button
              onClick={() => { onUpdate(set.id, "color", null); setOpen(false); }}
              className={[
                "px-1.5 py-0.5 rounded border font-mono text-[9px] transition-colors",
                set.color === null
                  ? "border-accent/60 bg-accent-dim text-accent"
                  : "border-border text-text-muted hover:text-text",
              ].join(" ")}
            >
              Speed
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

            {/* Custom */}
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

          {/* Actions */}
          <button
            onClick={() => { onClear(set.id); setOpen(false); }}
            className="w-full text-left px-3 py-1.5 font-mono text-[11px] text-text-muted hover:text-text hover:bg-white/5 transition-colors"
          >
            Clear points
          </button>
          <button
            onClick={() => { onRemove(set.id); setOpen(false); }}
            className="w-full text-left px-3 py-1.5 font-mono text-[11px] text-red-400/60 hover:text-red-400 hover:bg-white/5 transition-colors"
          >
            Delete set
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main panel ──────────────────────────────────────────────────────────────

export default function ObservationSetPanel({
  sets, activeSetId, onSelect, onAdd, onRemove, onUpdate, onClear,
}: Props) {
  return (
    <div className="flex flex-col gap-3">

      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">
          Observation Sets
        </span>
        <button
          onClick={onAdd}
          className="font-mono text-[10px] px-2 py-0.5 rounded border border-border text-text-muted hover:border-border-hi hover:text-text transition-colors"
        >
          + New Set
        </button>
      </div>

      {/* Set list */}
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
            {/* Color dot */}
            <span
              className="w-2 h-2 rounded-full shrink-0 ring-1 ring-white/10"
              style={{
                background: s.color
                  ?? "linear-gradient(135deg,#00e5ff 0%,#69ff47 50%,#ff4444 100%)",
              }}
            />

            {/* Editable label */}
            <EditableLabel
              value={s.label}
              onChange={(v) => onUpdate(s.id, "label", v)}
            />

            {/* Hidden badge — вместо point count когато е скрит */}
            

            {/* Visible toggle — на мястото на старото oko */}
            <button
              onClick={(e) => { e.stopPropagation(); onUpdate(s.id, "visible", !s.visible); }}
              title={s.visible ? "Hide" : "Show"}
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-text"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {s.visible
                  ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                  : <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                }
              </svg>
            </button>

            {/* Three-dot menu */}
            <SetMenu
              set={s}
              onUpdate={onUpdate}
              onRemove={onRemove}
              onClear={onClear}
            />
          </div>
        ))}
      </div>

    </div>
  );
}