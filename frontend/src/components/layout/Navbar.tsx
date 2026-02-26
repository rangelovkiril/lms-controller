import Link             from "next/link";
import { getTranslations } from "next-intl/server";

export default async function Navbar() {
  const t = await getTranslations("nav");

  const NAV_LINKS = [
    { href: "/stations",     label: t("stations")     },
    { href: "/trajectories", label: t("trajectories") },
    { href: "/about",        label: t("about")        },
  ];

  return (
    <header className="h-14 shrink-0 flex items-center gap-6 px-6 border-b border-border bg-bg z-50">
      <Link href="/" className="flex items-center gap-2.5 no-underline">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-accent to-[#00a86b]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5"/>
        </div>
        <span className="text-sm font-semibold tracking-tight text-text">Light My Satellite</span>
      </Link>
      <nav className="flex items-center gap-1">
        {NAV_LINKS.map(({ href, label }) => (
          <Link key={href} href={href} className="px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors no-underline text-text-muted hover:text-text hover:bg-surface">
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}