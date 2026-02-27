"use client";
import { useState, useCallback, useEffect } from "react";
import { useTranslations }                  from "next-intl";
import dynamic                              from "next/dynamic";
import type { Station }                     from "@/lib/data/stations";
import { useTracking, type TrackingState }  from "@/hooks/useTracking";
import { useObservationSets }               from "@/hooks/useObservationSets";
import ObservationSetPanel                  from "@/components/visualization/objects/ObservationSetPanel";

const Scene = dynamic(() => import("@/components/visualization/Scene"), {
  ssr:     false,
  loading: () => <SceneLoader />,
});

function SceneLoader() {
  const t = useTranslations("station");
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#050505]">
      <div className="flex flex-col items-center gap-3 text-text-muted">
        <div className="w-5 h-5 border-[1.5px] border-border border-t-accent rounded-full animate-spin" />
        <span className="text-xs font-mono">{t("visualizationLoading")}</span>
      </div>
    </div>
  );
}

function SidebarRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">{label}</span>
      {children}
    </div>
  );
}

function PositionDisplay({ state }: { state: TrackingState }) {
  const t   = useTranslations("station");
  const pos = state.kind === "tracking" ? state.position : null;
  return (
    <SidebarRow label={t("position")}>
      <div className="grid grid-cols-3 gap-1.5">
        {(["x", "y", "z"] as const).map((axis) => (
          <div key={axis} className="flex flex-col rounded-md border border-border bg-bg px-2 py-1.5">
            <span className="font-mono uppercase text-text-muted text-[9px]">{axis}</span>
            <span className="font-mono text-text text-[12px]">
              {pos ? pos[axis].toFixed(2) : "—"}
            </span>
          </div>
        ))}
      </div>
    </SidebarRow>
  );
}

function StatusBadge({ state }: { state: TrackingState }) {
  const t = useTranslations("station");
  const STATUS_COLOR: Record<TrackingState["kind"], string> = {
    disconnected: "text-text-muted",
    connected:    "text-blue",
    tracking:     "text-accent",
    event:        "text-yellow-400",
  };
  const isLive = state.kind === "tracking";
  return (
    <div className="flex items-center gap-2">
      <span className={[
        "w-2 h-2 rounded-full shrink-0",
        isLive                     ? "bg-accent animate-pulse-dot" :
        state.kind === "connected" ? "bg-blue animate-pulse-dot"   :
                                     "bg-border-hi",
      ].join(" ")} />
      <span className={`font-mono text-[11px] ${STATUS_COLOR[state.kind]}`}>
        {t(`status.${state.kind}`)}
        {state.kind === "event" && ` — ${t(`events.${state.event}`, { defaultValue: state.event })}`}
      </span>
    </div>
  );
}

function ObjectSelector({ objects, selected, onSelect }: {
  objects:  string[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const t = useTranslations("station");
  return (
    <SidebarRow label={t("object")}>
      <div className="flex flex-col gap-1">
        {objects.map((id) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={[
              "w-full text-left px-3 py-2 rounded-lg border font-mono text-[12px] transition-colors",
              id === selected
                ? "border-accent/50 bg-accent-dim text-accent"
                : "border-border text-text-muted hover:border-border-hi hover:text-text",
            ].join(" ")}
          >
            {id}
          </button>
        ))}
      </div>
    </SidebarRow>
  );
}

function FireControls({ state, onFire, onStop }: {
  state:  TrackingState;
  onFire: () => void;
  onStop: () => void;
}) {
  const t           = useTranslations("station");
  const canInteract = state.kind !== "disconnected";
  return (
    <div className="mt-auto pt-4 border-t border-border flex flex-col gap-2">
      {state.kind === "tracking" ? (
        <button onClick={onStop} disabled={!canInteract}
          className="w-full font-medium font-mono bg-danger/20 border border-danger/40 text-danger hover:bg-danger/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed rounded-lg py-2.5 text-[12px]"
        >
          {t("stop")}
        </button>
      ) : (
        <button onClick={onFire} disabled={!canInteract}
          className="w-full font-medium font-mono bg-accent-dim border border-accent-glow text-accent hover:bg-accent/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed rounded-lg py-2.5 text-[12px]"
        >
          {t("fire")}
        </button>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function StationClient({ station }: { station: Station }) {
  const t = useTranslations("station");
  const [selectedObject, setSelectedObject] = useState(station.objects[0]);
  const [isFullscreen,   setIsFullscreen]   = useState(false);

  const { state, targetPosVec, send } = useTracking(
    station.wsUrl,
    station.id,
    selectedObject,
  );

  const { sets, activeSetId, setActiveSetId, addSet, removeSet, updateSet, clearSet } =
    useObservationSets();

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const handleFire = useCallback(() => {
    send({ action: "fire", stationId: station.id, objectId: selectedObject });
  }, [send, station.id, selectedObject]);

  const handleStop = useCallback(() => {
    send({ action: "stop", stationId: station.id, objectId: selectedObject });
  }, [send, station.id, selectedObject]);

  return (
    <div className="flex h-full min-h-0">

      <div className="relative flex-1 min-h-0 overflow-hidden bg-[#050505]">
        <Scene targetPosVec={targetPosVec} observationSets={sets} />

        {isFullscreen && (
          <div className="absolute top-4 left-4 text-[10px] font-mono text-text-muted bg-surface/70 border border-border px-2 py-1 rounded-md backdrop-blur-sm">
            {t("exitFullscreen")}
          </div>
        )}

        <button
          onClick={toggleFullscreen}
          title="Fullscreen"
          className="absolute top-3 right-3 pointer-events-auto rounded-lg border border-border text-text-muted hover:text-text hover:border-border-hi transition-colors bg-surface/80 backdrop-blur-sm p-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3H5a2 2 0 00-2 2v3M16 3h3a2 2 0 012 2v3M21 16v3a2 2 0 01-2 2h-3M8 21H5a2 2 0 01-2-2v-3"/>
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <aside className="w-72 shrink-0 flex flex-col gap-5 border-l border-border bg-surface p-5 overflow-y-auto">

        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-sm text-text">{station.name}</span>
          <span className="font-mono text-[11px] text-text-muted">{station.location}</span>
          <span className="font-mono text-[11px] text-text-muted mt-0.5">{station.hardware}</span>
        </div>

        <div className="h-px bg-border" />

        <SidebarRow label={t("status.label")}>
          <StatusBadge state={state} />
        </SidebarRow>

        <ObjectSelector objects={station.objects} selected={selectedObject} onSelect={setSelectedObject} />

        <PositionDisplay state={state} />

        <ObservationSetPanel
          sets={sets}
          activeSetId={activeSetId}
          onSelect={setActiveSetId}
          onAdd={addSet}
          onRemove={removeSet}
          onUpdate={updateSet}
          onClear={clearSet}
        />

        <FireControls state={state} onFire={handleFire} onStop={handleStop} />

      </aside>
    </div>
  );
}