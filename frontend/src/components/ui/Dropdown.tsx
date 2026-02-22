import { useState, useRef, useEffect } from "react";

import { Spinner } from "./Spinner";
import { StatusDot } from "./StatusDot";

export const inputBase =
  "w-full bg-bg border border-border rounded-md font-mono text-[13px] text-text px-3 py-[0.55rem] outline-none transition-[border-color,box-shadow] duration-150 focus:border-accent focus:shadow-[0_0_0_3px_#00dc8220] [color-scheme:dark]";

interface DropdownProps {
  value:        string;
  options:      string[];
  onChange:     (v: string) => void;
  disabled?:    boolean;
  loading?:     boolean;
  placeholder?: string;
}

export function Dropdown({ value, options, onChange, disabled, loading, placeholder }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isDisabled = disabled || loading;
  const label      = loading ? "Зарежда се…" : (value || placeholder || "—");

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !isDisabled && setOpen((o) => !o)}
        disabled={isDisabled}
        className={[
          "w-full flex items-center justify-between gap-2 px-3 py-[0.55rem]",
          "bg-bg border rounded-md font-mono text-[13px]",
          "outline-none transition-[border-color,box-shadow] duration-150",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          open
            ? "border-accent shadow-[0_0_0_3px_#00dc8220] text-text"
            : "border-border hover:border-border-hi text-text",
        ].join(" ")}
      >
        <span className={value ? "text-text" : "text-text-muted"}>{label}</span>
        <svg
          width="11" height="11" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2"
          className={`text-text-muted transition-transform duration-150 shrink-0 ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-surface border border-border rounded-md shadow-[0_8px_24px_#00000080] overflow-hidden animate-fade-in">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-[12px] font-mono text-text-muted">Няма опции</div>
          ) : (
            options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className={[
                  "w-full text-left px-3 py-2 text-[13px] font-mono transition-colors flex items-center gap-2",
                  opt === value
                    ? "bg-accent-dim text-accent"
                    : "text-text-dim hover:bg-surface-hi hover:text-text",
                ].join(" ")}
              >
                <span className={`w-3 shrink-0 ${opt === value ? "text-accent" : "opacity-0"}`}>✓</span>
                {opt}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface StatusBarProps {
  status:     string;
  error:      string;
  lastAction: { label: string; time: string } | null;
  idleLabel:  string;
  station:    string;
  object:     string;
}

export function StatusBar({ status, error, lastAction, idleLabel, station, object }: StatusBarProps) {
  const isLoading = status === "exporting" || status === "uploading";
  return (
    <div className={[
      "border-t border-border px-6 py-3 flex items-center gap-2.5 font-mono text-[11.5px] min-h-[44px]",
      error      ? "text-danger"      :
      lastAction ? "text-accent"      : "text-text-muted",
    ].join(" ")}>
      {isLoading ? (
        <><Spinner />Заявка към {station}/{object}…</>
      ) : error ? (
        <><StatusDot variant="error" />{error}</>
      ) : lastAction ? (
        <>
          <StatusDot variant="success" />
          {lastAction.label}
          <span className="ml-auto text-text-muted text-[10.5px]">{lastAction.time}</span>
        </>
      ) : (
        <span>{idleLabel}</span>
      )}
    </div>
  );
}