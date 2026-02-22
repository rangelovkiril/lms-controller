"use client";
import { Vector3 } from "three";

interface Props {
  stationId:    string;
  stationInfo?: string;
  objectId:     string;
  objectInfo?:  string;
  position:     Vector3 | null;
  wsStatus:     "CONNECTED" | "DISCONNECTED";
  isFiring:     boolean;
  onFire:       () => void;
  onStop:       () => void;
  onFullscreen: () => void;
}

export default function TrackingDashboard({
  stationId, stationInfo, objectId, objectInfo,
  position, wsStatus, isFiring, onFire, onStop, onFullscreen,
}: Props) {
  const connected = wsStatus === "CONNECTED";

  return (
    <div className="absolute bottom-6 right-6 flex flex-col items-end pointer-events-none gap-2 w-[clamp(460px,36vw,680px)] text-[clamp(11px,1vw,16px)]">
      
      <button
        onClick={onFullscreen}
        title="Fullscreen"
        className="pointer-events-auto self-end rounded-lg border border-border text-text-muted hover:text-text hover:border-border-hi transition-colors bg-surface/90 backdrop-blur-sm p-2"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 3H5a2 2 0 00-2 2v3M16 3h3a2 2 0 012 2v3M21 16v3a2 2 0 01-2 2h-3M8 21H5a2 2 0 01-2-2v-3"/>
        </svg>
      </button>

      <div className="pointer-events-auto w-full bg-surface/90 backdrop-blur-sm border border-border rounded-xl overflow-hidden grid grid-cols-[45%_1fr] grid-rows-[auto_auto_1fr_auto]">
        
        <div className="flex items-center justify-between border-r border-border p-4 pb-3 gap-2">
          <span className="font-mono uppercase tracking-widest text-text font-semibold text-[0.85em]">
            Station
          </span>
          <span
            className={[
              "inline-flex items-center font-mono rounded-full border text-[0.72em] gap-2 px-3 py-1",
              connected
                ? "text-accent bg-accent-dim border-accent-glow"
                : "text-text-muted bg-surface-hi/50 border-border",
            ].join(" ")}
          >
            <span
              className={["rounded-full w-2 h-2", connected ? "bg-accent animate-pulse-dot" : "bg-text-muted/40"].join(" ")}
            />
            {connected ? "LIVE" : "ОФЛАЙН"}
          </span>
        </div>

        <div className="flex items-center p-4 pb-3">
          <span className="font-mono uppercase tracking-widest text-text font-semibold text-[0.85em]">
            Object
          </span>
        </div>

        <div className="border-r border-border px-4 pb-3">
          <div className="rounded-lg border border-border-hi bg-bg flex items-center w-full px-3 py-2">
            <span className="font-mono text-text text-[0.9em]">{stationId}</span>
          </div>
        </div>

        <div className="px-4 pb-3">
          <div className="rounded-lg border border-border-hi bg-bg flex items-center w-full px-3 py-2">
            <span className="font-mono text-accent text-[0.9em]">{objectId}</span>
          </div>
        </div>

        <div className="border-r border-border px-4 pb-3">
          <div className="rounded-lg border border-dashed border-border bg-bg flex items-center justify-center h-full min-h-[4em] p-3">
            <span className="font-mono text-text-muted text-center text-[0.8em]">
              {stationInfo ?? "Няма информация"}
            </span>
          </div>
        </div>

        <div className="px-4 pb-3">
          <div className="rounded-lg border border-dashed border-border bg-bg flex items-center justify-center h-full min-h-[4em] p-3">
            <span className="font-mono text-text-muted text-center text-[0.8em]">
              {objectInfo ?? "Няма информация"}
            </span>
          </div>
        </div>

        {/* Row 4: Controls & Position */}
        <div className="border-r border-border p-4">
          {isFiring ? (
            <button
              onClick={onStop}
              disabled={!connected}
              className="w-full font-medium font-mono bg-danger/20 border border-danger/40 text-danger hover:bg-danger/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed rounded-lg py-2.5 text-[0.9em]"
            >
              ■ Стоп
            </button>
          ) : (
            <button
              onClick={onFire}
              disabled={!connected}
              className="w-full font-medium font-mono bg-accent-dim border border-accent-glow text-accent hover:bg-accent/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed rounded-lg py-2.5 text-[0.9em]"
            >
              ▶ Старт
            </button>
          )}
        </div>

        <div className="p-4">
          <div className="rounded-lg border border-border bg-bg flex flex-col p-3 gap-2">
            <span className="font-mono uppercase tracking-widest text-text-muted text-[0.65em]">
              Картезианска позиция
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(["x", "y", "z"] as const).map((axis) => (
                <div
                  key={axis}
                  className="flex flex-col rounded-md border border-border bg-surface px-2 py-1.5"
                >
                  <span className="font-mono uppercase text-text-muted text-[0.65em]">{axis}</span>
                  <span className="font-mono text-text text-[0.8em]">
                    {position ? position[axis].toFixed(2) : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}