import { TrackingState } from "@/hooks/useTracking";
import { useTranslations } from "next-intl";


export function FireControls({ state, onFire, onStop }: {
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
