"use client";
import { useTranslations } from "next-intl";
import { Spinner }         from "./Spinner";
import { StatusDot }       from "./StatusDot";

interface StatusBarProps {
  status:     string;
  error:      string;
  lastAction: { label: string; time: string } | null;
  idleLabel?: string;
  station:    string;
  object:     string;
}

export function StatusBar({ status, error, lastAction, idleLabel, station, object }: StatusBarProps) {
  const t        = useTranslations("ui");
  const isLoading = status === "exporting" || status === "uploading";

  return (
    <div
      className={[
        "border-t border-border px-6 py-3 flex items-center gap-2.5 font-mono text-[11.5px] min-h-[44px]",
        error      ? "text-danger"     :
        lastAction ? "text-accent"     : "text-text-muted",
      ].join(" ")}
    >
      {isLoading ? (
        <><Spinner />{t("querying", { station, object })}</>
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