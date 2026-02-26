import Link              from "next/link";
import { getTranslations } from "next-intl/server";
import { STATIONS }      from "@/lib/data/stations";

export default async function StationsPage() {
  const t = await getTranslations("stations");

  const STATUS_STYLES = {
    online:   { dot: "bg-accent animate-pulse-dot", text: "text-accent",     label: t("status.online")   },
    tracking: { dot: "bg-blue animate-pulse-dot",   text: "text-blue",       label: t("status.tracking") },
    offline:  { dot: "bg-border-hi",                text: "text-text-muted", label: t("status.offline")  },
  };

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">

        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-text-muted font-mono">
            {t("summary", {
              active: STATIONS.filter(s => s.status !== "offline").length,
              total:  STATIONS.length,
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {STATIONS.map((station) => {
            const s = STATUS_STYLES[station.status];
            return (
              <div
                key={station.id}
                className="bg-surface border border-border rounded-xl p-5 flex items-center gap-6 hover:border-border-hi transition-colors"
              >
                <div className="w-12 h-12 shrink-0 rounded-xl bg-surface-hi border border-border flex items-center justify-center font-mono text-sm font-semibold text-text-dim">
                  {station.id.slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className="font-semibold text-sm text-text">{station.name}</span>
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono ${s.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                  </div>
                  <div className="flex gap-4 text-[11px] font-mono text-text-muted">
                    <span>{station.location}</span>
                    <span className="text-border-hi">·</span>
                    <span>{station.hardware}</span>
                    <span className="text-border-hi">·</span>
                    <span>{t("objects", { count: station.objects.length })}</span>
                  </div>
                </div>

                <Link
                  href={`/station/${station.id}`}
                  className={[
                    "shrink-0 px-4 py-2 rounded-lg text-[12px] font-mono font-medium border transition-colors no-underline",
                    station.status !== "offline"
                      ? "bg-accent-dim border-accent/30 text-accent hover:bg-accent/20"
                      : "bg-surface-hi border-border text-text-muted cursor-not-allowed pointer-events-none",
                  ].join(" ")}
                >
                  {station.status !== "offline" ? t("open") : t("offline")}
                </Link>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}