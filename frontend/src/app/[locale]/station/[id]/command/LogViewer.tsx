"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { API_BASE } from "@/types";
import { SectionHeader } from "./SectionHeader";

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

const POLL_OPTIONS = [2, 5, 10] as const;
type PollInterval = (typeof POLL_OPTIONS)[number];

const LEVEL_COLORS: Record<string, string> = {
  ERROR: "text-danger",
  WARN: "text-yellow-400",
  INFO: "text-text-muted",
  DEBUG: "text-text-dim",
};

const LEVELS = ["ALL", "ERROR", "WARN", "INFO", "DEBUG"];

export function LogViewer({ stationId }: { stationId: string }) {
  const t = useTranslations("command");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [paused, setPaused] = useState(false);
  const [interval, setIntervalVal] = useState<PollInterval>(5);
  const [filter, setFilter] = useState("ALL");
  const bottomRef = useRef<HTMLDivElement>(null);
  const hovered = useRef(false);

  const load = useCallback(() => {
    fetch(`${API_BASE}/stations/${stationId}/logs?limit=200`)
      .then((r) => r.json())
      .then((data: LogEntry[]) => {
        setLogs(data);
        if (!hovered.current) {
          setTimeout(
            () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
            50,
          );
        }
      })
      .catch(() => {});
  }, [stationId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(load, interval * 1000);
    return () => clearInterval(id);
  }, [paused, interval, load]);

  const visible =
    filter === "ALL"
      ? logs
      : logs.filter((l) => l.level?.toUpperCase() === filter);

  return (
    <div className="flex flex-col h-full">
      <SectionHeader label={t("systemLog")}>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-bg border border-border rounded text-[11.5px] font-mono text-text-muted px-1.5 py-0.5 outline-none color-scheme:dark"
          >
            {LEVELS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>

          <div className="flex items-center gap-1">
            {POLL_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setIntervalVal(s)}
                className={[
                  "text-[11px] font-mono px-1.5 py-0.5 rounded transition-colors",
                  interval === s && !paused
                    ? "bg-accent-dim text-accent"
                    : "text-text-muted hover:text-text",
                ].join(" ")}
              >
                {s}s
              </button>
            ))}
          </div>

          <button
            onClick={() => setPaused((p) => !p)}
            className={[
              "text-[11px] font-mono px-1.5 py-0.5 rounded border transition-colors",
              paused
                ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-400"
                : "border-border text-text-muted hover:text-text",
            ].join(" ")}
          >
            {paused ? t("resume") : t("pause")}
          </button>
        </div>
      </SectionHeader>

      <div
        className="flex-1 overflow-y-auto font-mono text-[11.5px] bg-bg rounded-lg border border-border p-2 min-h-0"
        onMouseEnter={() => {
          hovered.current = true;
        }}
        onMouseLeave={() => {
          hovered.current = false;
        }}
      >
        {visible.length === 0 ? (
          <div className="text-text-muted p-2">{t("noLogs")}</div>
        ) : (
          visible.map((entry, i) => {
            const lvl = entry.level?.toUpperCase() ?? "INFO";
            const color = LEVEL_COLORS[lvl] ?? "text-text-muted";
            const ts = entry.timestamp
              ? new Date(entry.timestamp).toLocaleTimeString("en-GB", {
                  hour12: false,
                })
              : "";
            return (
              <div
                key={i}
                className="flex gap-2 py-px hover:bg-surface-hi px-1 rounded"
              >
                <span className="text-text-dim shrink-0 select-none">{ts}</span>
                <span className={`shrink-0 w-11 ${color}`}>[{lvl}]</span>
                <span className="text-text break-all">{entry.message}</span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
