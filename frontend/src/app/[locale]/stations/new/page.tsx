"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter }     from "next/navigation";
import { API_BASE }      from "@/types";
import { inputBase }     from "@/components/ui/inputStyles";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  stationId:   string;
  name:        string;
  lat:         string;
  lon:         string;
  description: string;
  wsUrl:       string;
  hardware:    string;
}

interface FieldError { [key: string]: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validate(form: FormState): FieldError {
  const errors: FieldError = {};
  if (!form.stationId.trim())
    errors.stationId = "Required";
  else if (!/^[a-z0-9-]+$/.test(form.stationId))
    errors.stationId = "Lowercase letters, numbers and dashes only";

  if (!form.name.trim())
    errors.name = "Required";

  const lat = parseFloat(form.lat);
  if (form.lat === "" || isNaN(lat) || lat < -90 || lat > 90)
    errors.lat = "Must be between −90 and 90";

  const lon = parseFloat(form.lon);
  if (form.lon === "" || isNaN(lon) || lon < -180 || lon > 180)
    errors.lon = "Must be between −180 and 180";

  if (form.wsUrl && !/^wss?:\/\/.+/.test(form.wsUrl))
    errors.wsUrl = "Must start with ws:// or wss://";

  return errors;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldRow({
  label, required, error, hint, children,
}: {
  label:    string;
  required?: boolean;
  error?:   string;
  hint?:    string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-start gap-x-4 gap-y-1 py-2.5 border-b border-border/50 last:border-0">
      <div className="pt-[0.55rem]">
        <span className="font-mono text-[10.5px] uppercase tracking-wide text-text-muted">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        {children}
        {error && (
          <span className="font-mono text-[10.5px] text-danger">{error}</span>
        )}
        {hint && !error && (
          <span className="font-mono text-[10.5px] text-text-muted">{hint}</span>
        )}
      </div>
    </div>
  );
}

function TokenReveal({ token, stationId }: { token: string; stationId: string }) {
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const copy = async () => {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Success header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-accent-dim border border-accent/30 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        <div>
          <div className="text-[13px] font-semibold text-text">Station created</div>
          <div className="font-mono text-[11px] text-text-muted">{stationId}</div>
        </div>
      </div>

      {/* Token box */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <p className="font-mono text-[11px] text-amber-300 leading-relaxed">
            Save this write token — it will <strong>not be shown again</strong>.
            The station hardware needs it to publish MQTT data.
          </p>
        </div>

        <div className="bg-bg rounded-lg border border-border p-3 flex items-center gap-3 font-mono text-[12px]">
          <span className="flex-1 text-text break-all select-all">{token}</span>
          <button
            onClick={copy}
            className={[
              "shrink-0 px-2.5 py-1 rounded border text-[10.5px] transition-colors",
              copied
                ? "border-accent/40 bg-accent-dim text-accent"
                : "border-border text-text-muted hover:border-border-hi hover:text-text",
            ].join(" ")}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => router.push(`/station/${stationId}/command`)}
          className="w-full py-2.5 rounded-lg font-mono text-[12px] font-medium bg-accent-dim border border-accent/40 text-accent hover:bg-accent/20 transition-colors"
        >
          Open Command Center →
        </button>
        <button
          onClick={() => router.push(`/station/${stationId}`)}
          className="w-full py-2.5 rounded-lg font-mono text-[12px] font-medium border border-border text-text-muted hover:text-text hover:border-border-hi transition-colors"
        >
          Open 3D View →
        </button>
        <button
          onClick={() => router.push("/stations")}
          className="w-full py-2 rounded-lg font-mono text-[12px] text-text-muted hover:text-text transition-colors"
        >
          Back to stations
        </button>
      </div>
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

const EMPTY: FormState = {
  stationId:   "",
  name:        "",
  lat:         "",
  lon:         "",
  description: "",
  wsUrl:       "",
  hardware:    "",
};

export default function NewStationPage() {
  const [form,     setForm]     = useState<FormState>(EMPTY);
  const [errors,   setErrors]   = useState<FieldError>({});
  const [status,   setStatus]   = useState<"idle" | "submitting" | "done">("idle");
  const [apiError, setApiError] = useState("");
  const [token,    setToken]    = useState("");
  const [geocode,  setGeocode]  = useState("");

  const patch = (key: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Reverse geocode when lat/lon change
  useEffect(() => {
    const lat = parseFloat(form.lat);
    const lon = parseFloat(form.lon);
    if (isNaN(lat) || isNaN(lon)) { setGeocode(""); return; }

    const id = setTimeout(async () => {
      try {
        const res  = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        setGeocode(data.display_name?.split(",").slice(0, 3).join(", ") ?? "");
      } catch {
        setGeocode("");
      }
    }, 700);
    return () => clearTimeout(id);
  }, [form.lat, form.lon]);

  // Auto-populate stationId from name
  useEffect(() => {
    if (form.stationId && form.stationId !== slugify(form.name.slice(0, -1))) return;
    patch("stationId", slugify(form.name));
  }, [form.name]);

  const submit = useCallback(async () => {
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setStatus("submitting");
    setApiError("");

    try {
      const res = await fetch(`${API_BASE}/stations`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stationId:   form.stationId,
          name:        form.name,
          lat:         parseFloat(form.lat),
          lon:         parseFloat(form.lon),
          description: form.description || undefined,
          wsUrl:       form.wsUrl       || undefined,
          hardware:    form.hardware    || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }

      const { token } = await res.json();
      setToken(token);
      setStatus("done");
    } catch (e: any) {
      setApiError(e.message ?? "Unknown error");
      setStatus("idle");
    }
  }, [form]);

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-xl mx-auto flex flex-col gap-5">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-text-muted mb-3">
            <Link href="/stations" className="hover:text-text transition-colors no-underline">Stations</Link>
            <span className="text-border-hi">/</span>
            <span className="text-text">New Station</span>
          </div>
          <h1 className="text-base font-semibold text-text tracking-tight">Register Station</h1>
          <p className="font-mono text-[11px] text-text-muted mt-0.5">
            Creates an InfluxDB bucket and a write-only API token for the station hardware.
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="p-5">
            {status === "done" ? (
              <TokenReveal token={token} stationId={form.stationId} />
            ) : (
              <div className="flex flex-col">

                {/* Identity */}
                <div className="mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">
                    Identity
                  </span>
                </div>
                <FieldRow label="Station ID" required error={errors.stationId}
                  hint="URL-safe identifier, auto-filled from name">
                  <input
                    className={inputBase}
                    placeholder="sofia-slr-01"
                    value={form.stationId}
                    onChange={(e) => patch("stationId", slugify(e.target.value))}
                  />
                </FieldRow>
                <FieldRow label="Display Name" required error={errors.name}>
                  <input
                    className={inputBase}
                    placeholder="Sofia SLR Station"
                    value={form.name}
                    onChange={(e) => patch("name", e.target.value)}
                  />
                </FieldRow>
                <FieldRow label="Description" error={errors.description}>
                  <input
                    className={inputBase}
                    placeholder="Optional short description"
                    value={form.description}
                    onChange={(e) => patch("description", e.target.value)}
                  />
                </FieldRow>

                {/* Location */}
                <div className="mt-4 mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">
                    Location
                  </span>
                </div>
                <FieldRow label="Latitude" required error={errors.lat}>
                  <input
                    type="number" step="0.001" min="-90" max="90"
                    className={inputBase}
                    placeholder="42.698"
                    value={form.lat}
                    onChange={(e) => patch("lat", e.target.value)}
                  />
                </FieldRow>
                <FieldRow label="Longitude" required error={errors.lon}>
                  <input
                    type="number" step="0.001" min="-180" max="180"
                    className={inputBase}
                    placeholder="23.322"
                    value={form.lon}
                    onChange={(e) => patch("lon", e.target.value)}
                  />
                </FieldRow>
                {geocode && (
                  <FieldRow label="Resolved">
                    <span className="font-mono text-[11.5px] text-text-muted py-[0.55rem]">
                      📍 {geocode}
                    </span>
                  </FieldRow>
                )}

                {/* Connection */}
                <div className="mt-4 mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">
                    Connection
                  </span>
                </div>
                <FieldRow label="WS URL" error={errors.wsUrl}
                  hint="WebSocket endpoint for this station's backend">
                  <input
                    className={inputBase}
                    placeholder="ws://192.168.1.100:3000/ws"
                    value={form.wsUrl}
                    onChange={(e) => patch("wsUrl", e.target.value)}
                  />
                </FieldRow>
                <FieldRow label="Hardware" error={errors.hardware}
                  hint="e.g. Nd:YAG 532nm · 10Hz">
                  <input
                    className={inputBase}
                    placeholder="Nd:YAG 532nm · 10Hz"
                    value={form.hardware}
                    onChange={(e) => patch("hardware", e.target.value)}
                  />
                </FieldRow>

                {/* API error */}
                {apiError && (
                  <div className="mt-4 px-3 py-2.5 rounded-lg border border-danger/40 bg-danger/10 font-mono text-[11.5px] text-danger">
                    {apiError}
                  </div>
                )}

                {/* Submit */}
                <div className="mt-5 flex gap-2">
                  <button
                    onClick={submit}
                    disabled={status === "submitting"}
                    className="flex-1 py-2.5 rounded-lg font-mono text-[12px] font-medium bg-accent-dim border border-accent/40 text-accent hover:bg-accent/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {status === "submitting" ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-3.5 h-3.5 border border-accent/40 border-t-accent rounded-full animate-spin" />
                        Creating…
                      </span>
                    ) : (
                      "Create Station"
                    )}
                  </button>
                  <Link
                    href="/stations"
                    className="px-4 py-2.5 rounded-lg font-mono text-[12px] text-text-muted border border-border hover:border-border-hi hover:text-text transition-colors no-underline"
                  >
                    Cancel
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}