"use client";
import { useEffect, useState } from "react";
import { useLocale }           from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { API_BASE }            from "@/types";

interface StationSummary { stationId: string; name: string }

export default function NavClient() {
  const [stations, setStations] = useState<StationSummary[] | null>(null);
  const locale   = useLocale();
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const load = () =>
      fetch(`${API_BASE}/stations`)
        .then((r) => r.json())
        .then(setStations)
        .catch(() => {});

    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  const toggleLocale = () => {
    const next = locale === "bg" ? "en" : "bg";
    const newPath = pathname.replace(`/${locale}`, `/${next}`);
    router.push(newPath);
  };

  const total  = stations?.length ?? 0;
  const online = total;

  return (
    <div className="flex items-center gap-3">

      {/* Locale toggle */}
      <button
        onClick={toggleLocale}
        className="flex items-center gap-0.5 font-mono text-[11px] rounded border border-border overflow-hidden hover:border-border-hi transition-colors"
        title={locale === "bg" ? "Switch to English" : "Превключи на Български"}
      >
        <span className={[
          "px-2 py-0.5 transition-colors",
          locale === "bg" ? "bg-surface-hi text-text" : "text-text-muted hover:text-text",
        ].join(" ")}>
          БГ
        </span>
        <span className="w-px h-3 bg-border" />
        <span className={[
          "px-2 py-0.5 transition-colors",
          locale === "en" ? "bg-surface-hi text-text" : "text-text-muted hover:text-text",
        ].join(" ")}>
          EN
        </span>
      </button>

      {/* Station count */}
      {stations && (
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />
          <span className="text-text-muted">
            <span className="text-text">{online}</span>/{total} online
          </span>
        </div>
      )}

    </div>
  );
}