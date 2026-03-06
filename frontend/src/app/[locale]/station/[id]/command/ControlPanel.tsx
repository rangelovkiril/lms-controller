"use client";
import type { TrackingState } from "@/hooks/useTracking";
import { SectionHeader } from "./SectionHeader";

const STATUS_MAP: Record<TrackingState["kind"], { label: string; color: string; pulse: boolean }> = {
  disconnected: { label: "Disconnected", color: "text-text-muted",   pulse: false },
  online:       { label: "Online",       color: "text-blue",         pulse: true  },
  locating:     { label: "Locating…",    color: "text-yellow-400",   pulse: true  },
  tracking:     { label: "Tracking",     color: "text-accent",       pulse: true  },
  offline:      { label: "Offline",      color: "text-text-muted",   pulse: false },
};

export function ControlPanel({
  state, fire, stop,
}: {
  state: TrackingState;
  fire:  () => void;
  stop:  () => void;
}) {
  const { label, color, pulse } = STATUS_MAP[state.kind];

  return (
    <div>
      <SectionHeader label="Station Control" />

      <div className="flex items-center gap-2 mb-4">
        <span className={[
          "w-2 h-2 rounded-full shrink-0",
          state.kind === "tracking" ? "bg-accent" :
          state.kind === "locating" ? "bg-yellow-400" :
          state.kind === "online"   ? "bg-blue" : "bg-border-hi",
          pulse ? "animate-pulse-dot" : "",
        ].join(" ")} />
        <span className={`font-mono text-[12px] ${color}`}>{label}</span>
        {state.kind === "tracking" && (
          <span className="ml-auto font-mono text-[11px] text-text-muted">
            obj: <span className="text-accent">{state.objId}</span>
          </span>
        )}
      </div>

      {state.kind === "tracking" && (
        <div className="grid grid-cols-3 gap-1.5 mb-4">
          {(["x","y","z"] as const).map((ax) => (
            <div key={ax} className="bg-bg border border-border rounded-md px-2 py-1.5">
              <div className="font-mono text-[9px] uppercase text-text-muted">{ax}</div>
              <div className="font-mono text-[12px] text-text">{state.position[ax].toFixed(2)}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={fire}
          disabled={state.kind !== "online"}
          className="py-2.5 rounded-lg border font-mono text-[12px] font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-accent-dim border-accent/40 text-accent hover:bg-accent/20"
        >
          ▶ Track
        </button>
        <button
          onClick={stop}
          disabled={state.kind !== "locating" && state.kind !== "tracking"}
          className="py-2.5 rounded-lg border font-mono text-[12px] font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-danger/10 border-danger/40 text-danger hover:bg-danger/20"
        >
          ■ Stop
        </button>
      </div>
    </div>
  );
}
