"use client";
import { useState, useRef, useEffect } from "react";
import { useTranslations }             from "next-intl";
import { Spinner }                     from "./Spinner";

interface DropdownProps {
  value:         string;
  options:       string[];
  onChange:      (v: string) => void;
  disabled?:     boolean;
  loading?:      boolean;
  placeholder?:  string;
  loadingLabel?: string;
  emptyLabel?:   string;
}

export function Dropdown({
  value,
  options,
  onChange,
  disabled,
  loading,
  placeholder,
  loadingLabel,
  emptyLabel,
}: DropdownProps) {
  const t    = useTranslations("ui");
  const [open, setOpen] = useState(false);
  const ref  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isDisabled  = disabled || loading;
  const resolvedPlaceholder  = placeholder  ?? t("placeholder");
  const resolvedLoadingLabel = loadingLabel ?? t("loading");
  const resolvedEmptyLabel   = emptyLabel   ?? t("noOptions");
  const label       = loading ? resolvedLoadingLabel : (value || resolvedPlaceholder);

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
            <div className="px-3 py-2 text-[12px] font-mono text-text-muted">{resolvedEmptyLabel}</div>
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