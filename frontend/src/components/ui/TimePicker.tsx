"use client";
import { useTranslations } from "next-intl";
import { pad, toLocal, fromParts } from "@/lib/dateUtils";

interface TimePickerProps {
  value: string;
  onChange: (iso: string) => void;
  label?: string;
}

export function TimePicker({ value, onChange, label }: TimePickerProps) {
  const t = useTranslations("timePicker");
  const parsed = toLocal(value);
  const now = new Date();

  const hour = parsed?.hour ?? now.getHours();
  const min = parsed?.min ?? 0;
  const year = parsed?.year ?? now.getFullYear();
  const month = parsed?.month ?? now.getMonth();
  const day = parsed?.day ?? now.getDate();

  const emit = (h: number, m: number) => {
    onChange(fromParts(year, month, day, h, m));
  };

  const changeHour = (h: number) => emit(((h % 24) + 24) % 24, min);
  const changeMin = (m: number) => emit(hour, ((m % 60) + 60) % 60);

  const inputCls =
    "w-9 bg-bg border border-border rounded text-center font-mono text-[13px] text-text py-1.5 outline-none focus:border-accent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <div>
      {label && (
        <span className="block mb-1 text-[12px] font-mono text-text-muted uppercase tracking-wider">
          {label}
        </span>
      )}

      <div className="flex items-center gap-1.5 h-10 bg-bg border border-border rounded-md px-3">
        <svg
          className="w-3.5 h-3.5 text-text-muted shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>

        <input
          type="number"
          min={0}
          max={23}
          value={pad(hour)}
          onChange={(e) => changeHour(parseInt(e.target.value) || 0)}
          className={inputCls}
        />
        <span className="text-text-muted font-mono text-[14px] font-bold">
          :
        </span>
        <input
          type="number"
          min={0}
          max={59}
          value={pad(min)}
          onChange={(e) => changeMin(parseInt(e.target.value) || 0)}
          className={inputCls}
        />

        <button
          type="button"
          onClick={() => {
            const n = new Date();
            emit(n.getHours(), n.getMinutes());
          }}
          className="ml-auto px-2 py-0.5 rounded border border-border font-mono text-[10px] text-text-muted hover:text-accent hover:border-accent/40 transition-colors"
        >
          {t("now")}
        </button>
      </div>
    </div>
  );
}
