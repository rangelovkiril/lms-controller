"use client";
import { useTranslations } from "next-intl";
import type { TrackingState } from "@/hooks/useTracking";
import { SectionHeader } from "./SectionHeader";

const STATUS_STYLE: Record<TrackingState["kind"], { color: string; pulse: boolean }> = {
  disconnected: { color: "text-text-muted",   pulse: false },
  online:       { color: "text-blue",         pulse: true  },
  locating:     { color: "text-yellow-400",   pulse: true  },
  tracking:     { color: "text-accent",       pulse: true  },
  offline:      { color: "text-text-muted",   pulse: false },
};

export function ControlPanel({
  state, fire, stop,
}: {
  state: TrackingState;
  fire:  () => void;
  stop:  () => void;
}) {
  const t = useTranslations("station");
  const tc = useTranslations("command");
  const { color, pulse } = STATUS_STYLE[state.kind];

  return (
    <div>
      <SectionHeader label={tc("stationControl")} />

      <div className="flex items-center gap-2 mb-4">
        <span className={[
          "w-2 h-2 rounded-full shrink-0",
          state.kind === "tracking" ? "bg-accent" :
          state.kind === "locating" ? "bg-yellow-400" :
          state.kind === "online"   ? "bg-blue" : "bg-border-hi",
          pulse ? "animate-pulse-dot" : "",
        ].join(" ")} />
        <span className={`font-mono text-[13px] ${color}`}>{t(`status.${state.kind}`)}</span>
        {state.kind === "tracking" && (
          <span className="ml-auto font-mono text-[12px] text-text-muted">
            obj: <span className="text-accent">{state.objId}</span>
          </span>
        )}
      </div>

      {state.kind === "tracking" && (
        <div className="grid grid-cols-3 gap-1.5 mb-4">
          {(["x","y","z"] as const).map((ax) => (
            <div key={ax} className="bg-bg border border-border rounded-md px-2 py-1.5">
              <div className="font-mono text-[10px] uppercase text-text-muted">{ax}</div>
              <div className="font-mono text-[13px] text-text">{state.position[ax].toFixed(2)}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={fire}
          disabled={state.kind !== "online"}
          className="py-2.5 rounded-lg border font-mono text-[13px] font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-accent-dim border-accent/40 text-accent hover:bg-accent/20"
        >
          {tc("track")}
        </button>
        <button
          onClick={stop}
          disabled={state.kind !== "locating" && state.kind !== "tracking"}
          className="py-2.5 rounded-lg border font-mono text-[13px] font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-danger/10 border-danger/40 text-danger hover:bg-danger/20"
        >
          {tc("stop")}
        </button>
      </div>
    </div>
  );
}
