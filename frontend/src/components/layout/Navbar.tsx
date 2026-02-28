import Link                from "next/link";
import { getTranslations } from "next-intl/server";
import NavClient           from "./NavClient";

export default async function Navbar() {
  const t = await getTranslations("nav");

  const NAV_LINKS = [
    { href: "/stations",     label: t("stations")     },
    { href: "/trajectories", label: t("trajectories") },
  ];

  return (
    <header className="h-12 shrink-0 flex items-center gap-0 px-4 border-b border-border bg-bg z-50">

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 no-underline mr-4">
        <div className="w-6 h-6 rounded-md flex items-center justify-center bg-gradient-to-br from-accent to-[#00a86b]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
            <circle cx="12" cy="12" r="3"/>
            <path d="M3 12h3M18 12h3M12 3v3M12 18v3"/>
            <path d="M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M16.3 7.7l-2.1 2.1M7.7 16.3l-2.1 2.1"/>
          </svg>
        </div>
        <span className="text-[13px] font-semibold tracking-tight text-text">LMS</span>
      </Link>

      <div className="w-px h-5 bg-border mr-4" />

      {/* Nav links */}
      <nav className="flex items-center gap-0.5">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="px-3 py-1.5 rounded-md text-[12px] font-medium font-mono transition-colors no-underline text-text-muted hover:text-text hover:bg-surface"
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Right — live station count */}
      <div className="ml-auto">
        <NavClient />
      </div>

    </header>
  );
}
