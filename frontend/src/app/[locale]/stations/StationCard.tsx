"use client";

import Link      from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";
import { getWsUrl, type Station } from "@/lib/stations";
import {
  buildSubscribeMessage,
  parseTrackingMessage,
} from "@/lib/tracking";

type ConnectionStatus = "connecting" | "online" | "offline" | "disconnected";

const STATUS_DOT: Record<ConnectionStatus, string> = {
  online:       "bg-accent animate-pulse-dot",
  offline:      "bg-red-500",
  connecting:   "bg-yellow-400 animate-pulse",
  disconnected: "bg-text-muted opacity-40",
};

export function StationCard({
  station,
  onDelete,
}: {
  station:  Station;
  onDelete: (id: string) => void;
}) {
  const t = useTranslations("stationCard");
  const initials = station.id.slice(0, 2).toUpperCase();
  const wsUrl    = getWsUrl(station);

  const [status,     setStatus]     = useState<ConnectionStatus>("connecting");
  const [deleting,   setDeleting]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!wsUrl) return;
    let active = true;
    let timer:  ReturnType<typeof setTimeout>;

    const connect = () => {
      if (!active) return;
      setStatus("connecting");
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (!active) { ws.close(); return; }
        ws.send(buildSubscribeMessage("subscribe", station.id));
      };

      ws.onmessage = (ev) => {
        if (!active) return;
        const msg = parseTrackingMessage(ev);
        if (!msg) return;
        if (msg.type === "event") {
          if (msg.event === "online" || msg.event === "tracking_start") setStatus("online");
          else if (msg.event === "offline") setStatus("offline");
        }
        if (msg.type === "position") setStatus("online");
      };

      ws.onclose = () => {
        if (!active) return;
        setStatus("disconnected");
        timer = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        if (active) setStatus("disconnected");
      };
    };

    connect();

    return () => {
      active = false;
      clearTimeout(timer);
      socketRef.current?.close();
      socketRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsUrl, station.id]);

  const handleDelete = async () => {
    if (!confirmDel) { setConfirmDel(true); return; }
    setDeleting(true);
    try {
      await apiFetch(`/stations/${station.id}`, { method: "DELETE" });
      onDelete(station.id);
    } catch {
      setDeleting(false);
      setConfirmDel(false);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden hover:border-border-hi transition-colors group">

      <div className="px-4 pt-4 pb-3 flex items-start gap-3">
        <div className="w-9 h-9 shrink-0 rounded-lg bg-surface-hi border border-border flex items-center justify-center font-mono text-[12px] font-bold text-text-dim">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[14px] text-text truncate">{station.name}</span>
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[status]}`}
              title={t(`status.${status}`)}
            />
          </div>
          <div className="font-mono text-[11.5px] text-text-muted mt-0.5 truncate">
            {station.id}
          </div>
        </div>

        <button
          onClick={handleDelete}
          disabled={deleting}
          title={confirmDel ? "Click again to confirm" : "Delete station"}
          className={[
            "shrink-0 w-7 h-7 rounded-md border flex items-center justify-center transition-colors",
            confirmDel
              ? "border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20"
              : "border-border text-text-muted opacity-0 group-hover:opacity-100 hover:border-border-hi hover:text-text",
            deleting ? "opacity-40 cursor-not-allowed" : "",
          ].join(" ")}
        >
          {deleting ? (
            <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          ) : confirmDel ? (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
            </svg>
          )}
        </button>
      </div>

      {confirmDel && !deleting && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/5 flex items-center justify-between gap-2">
          <span className="font-mono text-[11.5px] text-red-400">{t("deleteConfirm")}</span>
          <button
            onClick={() => setConfirmDel(false)}
            className="font-mono text-[11.5px] text-text-muted hover:text-text transition-colors"
          >
            {t("cancel")}
          </button>
        </div>
      )}

      <div className="px-4 pb-3 flex gap-3 font-mono text-[11.5px] text-text-muted">
        <span>{station.lat.toFixed(3)}°N</span>
        <span className="text-border-hi">·</span>
        <span>{station.lon.toFixed(3)}°E</span>
        {station.description && (
          <>
            <span className="text-border-hi">·</span>
            <span className="truncate">{station.description}</span>
          </>
        )}
      </div>

      <div className="border-t border-border grid grid-cols-2">
        <Link
          href={`/station/${station.id}/command`}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-[12.5px] font-mono font-medium text-text-muted hover:text-text hover:bg-surface-hi border-r border-border transition-colors no-underline"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <path d="M8 21h8M12 17v4"/>
          </svg>
          {t("commandCenter")}
        </Link>
        <Link
          href={`/station/${station.id}`}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-[12.5px] font-mono font-medium text-text-muted hover:text-accent hover:bg-accent-dim transition-colors no-underline"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          {t("view3d")}
        </Link>
      </div>
    </div>
  );
}
