import Link               from "next/link";
import { getTranslations } from "next-intl/server";

export default async function HomePage() {
  const t = await getTranslations("nav");

  return (
    <div className="relative h-full overflow-y-auto overflow-x-hidden">

      {/* ── Background ── */}
      <BackgroundLayer />

      {/* ── Hero section ── */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-48px)] px-6 text-center gap-10">

        <SatelliteModel />

        <div className="flex flex-col items-center gap-5 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/25 bg-accent/8 font-mono text-[10px] text-accent tracking-[0.15em] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />
            Laser Management System
          </div>

          <h1 className="text-[clamp(2.4rem,6vw,4rem)] font-bold tracking-tight leading-[1.05]"
            style={{
              background: "linear-gradient(170deg, #ffffff 0%, #ededed 40%, #555 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Satellite<br />Laser Ranging
          </h1>

          <p className="text-text-muted font-mono text-[12px] leading-[1.8] max-w-sm">
            Real-time station management, 3D trajectory visualization,
            and observation recording for ground-based SLR networks.
          </p>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <Link href="/stations"
            className="group flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-black font-mono text-[12px] font-bold hover:bg-[#00ef8e] transition-all hover:shadow-[0_0_24px_#00dc8240] no-underline"
          >
            <IconStation />
            {t("stations")}
            <span className="ml-0.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">→</span>
          </Link>

          <Link href="/trajectories"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-surface text-text-muted font-mono text-[12px] hover:text-text hover:border-border-hi hover:bg-surface-hi transition-colors no-underline"
          >
            <IconTrajectory />
            {t("trajectories")}
          </Link>

          <Link href="/info"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-surface text-text-muted font-mono text-[12px] hover:text-text hover:border-border-hi hover:bg-surface-hi transition-colors no-underline"
          >
            <IconInfo />
            {t("info")}
          </Link>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-6 flex flex-col items-center gap-1 opacity-20">
          <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
            <rect x="1" y="1" width="14" height="22" rx="7" stroke="currentColor" strokeWidth="1.5"/>
            <style>{`.scroll-dot{animation:scrolldot 2s ease-in-out infinite}@keyframes scrolldot{0%{transform:translateY(0);opacity:.8}60%{transform:translateY(8px);opacity:.1}100%{transform:translateY(0);opacity:.8}}`}</style>
            <circle className="scroll-dot" cx="8" cy="7" r="2" fill="currentColor"/>
          </svg>
        </div>
      </section>

      {/* ── Visualization preview ── */}
      <section className="relative z-10 px-6 pb-20 flex flex-col items-center gap-10 max-w-5xl mx-auto">

        <div className="flex flex-col items-center gap-3 text-center">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent/60">Preview</span>
          <h2 className="text-2xl font-semibold tracking-tight">Live tracking, in your browser</h2>
          <p className="text-text-muted font-mono text-[11px] max-w-xs leading-relaxed">
            WebGL scene · real-time position · speed-colored trace · observation overlays
          </p>
        </div>

        <ScenePreviewMockup />
      </section>

      {/* ── Feature cards ── */}
      <section className="relative z-10 px-6 pb-32 max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3">
        {FEATURES.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </section>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Background

function BackgroundLayer() {
  return (
    <>
      {/* Dot grid */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden
        style={{
          backgroundImage: "radial-gradient(circle, #2a2a2a 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.35,
        }}
      />
      {/* Radial vignette over dots */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden
        style={{ background: "radial-gradient(ellipse 80% 70% at 50% 0%, transparent 0%, #080808 100%)" }}
      />
      {/* Accent glow */}
      <div className="pointer-events-none fixed z-0" aria-hidden
        style={{
          top: 0, left: "50%", transform: "translateX(-50%)",
          width: 700, height: 400,
          background: "radial-gradient(ellipse at 50% 0%, #00dc8210 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Animated SVG satellite model

function SatelliteModel() {
  return (
    <img src="/satellite-animation.svg" alt="" width="280" height="200" />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene preview mockup

function ScenePreviewMockup() {
  return (
    <div className="w-full rounded-2xl border border-border overflow-hidden"
      style={{ boxShadow: "0 0 0 1px #1e1e1e, 0 32px 80px #000000a0, 0 0 60px #00dc8210" }}
    >
      {/* Browser chrome */}
      <div className="h-9 bg-surface border-b border-border flex items-center gap-3 px-4 shrink-0">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/30" />
          <div className="w-2.5 h-2.5 rounded-full bg-accent/30" />
        </div>
        <div className="flex-1 h-5 mx-8 rounded bg-surface-hi flex items-center justify-center">
          <span className="font-mono text-[9px] text-text-muted/40 tracking-wider">
            lms.local / station / sofia-slr-01
          </span>
        </div>
      </div>

      {/* Main content — 3D scene + sidebar */}
      <div className="flex bg-[#0a0f1a]" style={{ aspectRatio: "16/6.5" }}>

        {/* 3D viewport SVG */}
        <div className="flex-1 relative overflow-hidden">
          <img src="/scene-preview.svg" alt="" width="640" height="248"
            className="w-full h-full object-cover" />
        </div>

        {/* Sidebar mockup */}
        <div className="w-44 shrink-0 border-l border-border/30 bg-surface/70 backdrop-blur-sm p-3 flex flex-col gap-3 font-mono">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />
            <span className="text-accent text-[10px]">Tracking</span>
          </div>

          {/* Object */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] uppercase tracking-[.15em] text-text-muted/40">Object</span>
            <span className="text-text text-[10px]">LAGEOS-2</span>
          </div>

          {/* XYZ readout */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] uppercase tracking-[.15em] text-text-muted/40">Position</span>
            <div className="grid grid-cols-3 gap-1">
              {["X","Y","Z"].map((a,i) => (
                <div key={a} className="bg-bg rounded border border-border p-1">
                  <div className="text-[7px] text-text-muted/50">{a}</div>
                  <div className="text-[9px] text-text">{["3241","1847","4521"][i]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Observation sets */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] uppercase tracking-[.15em] text-text-muted/40">Obs sets</span>
            {[{c:"#00dc82",n:"Set-01",p:482},{c:"#0070f3",n:"Set-02",p:317}].map(s=>(
              <div key={s.n} className="flex items-center gap-1.5 py-1 px-1.5 rounded border border-border bg-bg/50">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{background:s.c}}/>
                <span className="text-[9px] text-text-muted flex-1">{s.n}</span>
                <span className="text-[8px] text-text-muted/40">{s.p}</span>
              </div>
            ))}
          </div>

          {/* Stop button */}
          <div className="mt-auto rounded-lg border border-danger/30 bg-danger/8 py-1.5 text-center">
            <span className="font-mono text-[10px] text-danger">■ Stop</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Feature cards

function FeatureCard({ title, desc, icon }: { title: string; desc: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 p-5 rounded-xl border border-border bg-surface
      hover:border-accent/20 hover:bg-surface-hi transition-colors group">
      <div className="w-8 h-8 rounded-lg bg-bg border border-border flex items-center justify-center
        text-accent group-hover:border-accent/20 transition-colors">
        {icon}
      </div>
      <div>
        <div className="font-semibold text-[13px] text-text">{title}</div>
        <div className="font-mono text-[11px] text-text-muted mt-1.5 leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    title: "Multi-Station",
    desc:  "Manage multiple SLR stations simultaneously. Each with its own 3D view, telemetry stream and command interface.",
    icon: <IconStation />,
  },
  {
    title: "Live Telemetry",
    desc:  "MQTT → WebSocket pipeline delivers position data at up to 10 Hz. InfluxDB retains full observation history.",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    title: "Observation Sets",
    desc:  "Import, overlay and compare multiple observation sessions as speed-colored traces in the same 3D scene.",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    ),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Reusable micro-icons

function IconStation() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M3 12h3M18 12h3M12 3v3M12 18v3
               M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1
               M16.3 7.7l-2.1 2.1M7.7 16.3l-2.1 2.1"/>
    </svg>
  );
}

function IconTrajectory() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3l18 18M3 21C3 12 12 3 21 3"/>
    </svg>
  );
}

function IconInfo() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16v-4M12 8h.01"/>
    </svg>
  );
}
