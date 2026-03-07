"use client";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { pad, toLocal, fromParts } from "@/lib/dateUtils";

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function startWeekday(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

interface DatePickerProps {
  value: string;
  onChange: (iso: string) => void;
  label?: string;
}

export function DatePicker({ value, onChange, label }: DatePickerProps) {
  const t = useTranslations("datePicker");
  const parsed = toLocal(value);
  const now = new Date();

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parsed?.year ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? now.getMonth());
  const [selDay, setSelDay] = useState(parsed?.day ?? now.getDate());

  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      if (btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    const p = toLocal(value);
    if (p) {
      setViewYear(p.year);
      setViewMonth(p.month);
      setSelDay(p.day);
    }
  }

  const hour = parsed?.hour ?? now.getHours();
  const min = parsed?.min ?? 0;

  const emit = (d: number) => {
    onChange(fromParts(viewYear, viewMonth, d, hour, min));
  };

  const pickDay = (d: number) => {
    setSelDay(d);
    emit(d);
    setOpen(false);
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else setViewMonth(viewMonth + 1);
  };

  const totalDays = daysInMonth(viewYear, viewMonth);
  const offset = startWeekday(viewYear, viewMonth);
  const cells: (number | null)[] = Array.from({ length: 42 }, (_, i) => {
    const d = i - offset + 1;
    return d >= 1 && d <= totalDays ? d : null;
  });
  while (cells.length > 0 && cells.slice(-7).every((c) => c === null))
    cells.splice(-7);

  const todayDay =
    now.getFullYear() === viewYear && now.getMonth() === viewMonth
      ? now.getDate()
      : -1;
  const displayStr = value
    ? `${pad(selDay)} ${MONTH_NAMES[viewMonth]} ${viewYear}`
    : "—";

  return (
    <div>
      {label && (
        <span className="block mb-1 text-[12px] font-mono text-text-muted uppercase tracking-wider">
          {label}
        </span>
      )}

      <button
        ref={btnRef}
        type="button"
        onClick={() => {
          if (btnRef.current) {
            const r = btnRef.current.getBoundingClientRect();
            setPos({ top: r.bottom + 6, left: r.left });
          }
          setOpen((v) => !v);
        }}
        className="w-full h-10 flex items-center gap-2 bg-bg border border-border rounded-md font-mono text-[13px] px-3 outline-none transition-[border-color,box-shadow] duration-150 hover:border-border-hi focus:border-accent focus:shadow-[0_0_0_3px_#00dc8220] text-left"
      >
        <svg
          className="w-3.5 h-3.5 text-text-muted shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span className={value ? "text-text" : "text-text-muted/50"}>
          {displayStr}
        </span>
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed z-[100] w-[252px] rounded-lg border border-border bg-surface shadow-xl p-3 flex flex-col gap-1"
            style={{ top: pos.top, left: pos.left }}
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 rounded hover:bg-white/5 text-text-muted hover:text-text transition-colors"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <span className="font-mono text-[13px] text-text font-medium">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1 rounded hover:bg-white/5 text-text-muted hover:text-text transition-colors"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-7">
              {DAYS.map((d) => (
                <span
                  key={d}
                  className="text-center font-mono text-[10px] text-text-muted/50 py-1"
                >
                  {d}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {cells.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={d === null}
                  onClick={() => d && pickDay(d)}
                  className={[
                    "h-7 rounded text-center font-mono text-[12px] transition-colors",
                    d === null
                      ? "invisible"
                      : d === selDay
                        ? "bg-accent text-black font-bold"
                        : d === todayDay
                          ? "text-accent hover:bg-accent/10"
                          : "text-text-muted hover:bg-white/5 hover:text-text",
                  ].join(" ")}
                >
                  {d}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  const n = new Date();
                  setViewYear(n.getFullYear());
                  setViewMonth(n.getMonth());
                  setSelDay(n.getDate());
                  onChange(
                    fromParts(
                      n.getFullYear(),
                      n.getMonth(),
                      n.getDate(),
                      hour,
                      min,
                    ),
                  );
                  setOpen(false);
                }}
                className="px-2 py-0.5 rounded border border-border font-mono text-[10px] text-text-muted hover:text-accent hover:border-accent/40 transition-colors"
              >
                {t("today")}
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
