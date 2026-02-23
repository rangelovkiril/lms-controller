import Link from "next/link";
import { STATIONS } from "@/lib/data/stations";

const STATUS_STYLES = {
  online:   { dot: "bg-accent animate-pulse-dot", text: "text-accent",    label: "ОНЛАЙН"   },
  tracking: { dot: "bg-blue animate-pulse-dot",   text: "text-blue",      label: "TRACKING" },
  offline:  { dot: "bg-border-hi",                text: "text-text-muted", label: "ОФЛАЙН"  },
};

export default function StationsPage() {
  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">

        {/* Хедър */}
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">Станции</h1>
          <p className="text-sm text-text-muted font-mono">
            {STATIONS.filter(s => s.status !== "offline").length} активни · {STATIONS.length} общо
          </p>
        </div>

        {/* Карти */}
        <div className="grid grid-cols-1 gap-3">
          {STATIONS.map((station) => {
            const s = STATUS_STYLES[station.status];
            return (
              <div
                key={station.id}
                className="bg-surface border border-border rounded-xl p-5 flex items-center gap-6 hover:border-border-hi transition-colors"
              >
                {/* Аватар */}
                <div className="w-12 h-12 shrink-0 rounded-xl bg-surface-hi border border-border flex items-center justify-center font-mono text-sm font-semibold text-text-dim">
                  {station.id.slice(0, 2).toUpperCase()}
                </div>

                {/* Инфо */}
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
                    <span>{station.objects.length} обекта</span>
                  </div>
                </div>

                {/* Бутон */}
                <Link
                  href={`/station/${station.id}`}
                  className={[
                    "shrink-0 px-4 py-2 rounded-lg text-[12px] font-mono font-medium border transition-colors no-underline",
                    station.status !== "offline"
                      ? "bg-accent-dim border-accent/30 text-accent hover:bg-accent/20"
                      : "bg-surface-hi border-border text-text-muted cursor-not-allowed pointer-events-none",
                  ].join(" ")}
                >
                  {station.status !== "offline" ? "Отвори →" : "Офлайн"}
                </Link>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}