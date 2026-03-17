"use client"
import { useState, useRef, useEffect } from "react"
import { useLocale, useTranslations }  from "next-intl"
import { useRouter, usePathname }      from "next/navigation"
import Link                            from "next/link"
import { useAuth }                     from "@/contexts/authContext"

export default function NavClient() {
  const locale   = useLocale()
  const router   = useRouter()
  const pathname = usePathname()
  const t        = useTranslations("nav")
  const { user, orgs, activeOrg, switchOrg, logout } = useAuth()

  const [orgOpen, setOrgOpen] = useState(false)
  const orgRef = useRef<HTMLDivElement>(null)

  const [userOpen, setUserOpen] = useState(false)
  const userRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!orgOpen && !userOpen) return
    const h = (e: MouseEvent) => {
      if (orgOpen && !orgRef.current?.contains(e.target as Node)) setOrgOpen(false)
      if (userOpen && !userRef.current?.contains(e.target as Node)) setUserOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [orgOpen, userOpen])

  const toggleLocale = () => {
    const next = locale === "bg" ? "en" : "bg"
    router.push(pathname.replace(`/${locale}`, `/${next}`))
  }

  const NAV_LINKS = [
    { href: "/stations",     label: t("stations") },
    { href: "/trajectories", label: t("trajectories") },
    ...(user ? [{ href: "/orgs", label: t("orgs") }] : []),
  ]

  return (
    <>
      {/* ── Left: org name + nav ── */}
      <div className="flex items-center gap-0 flex-1 min-w-0">
        {/* Active org name */}
        {user && activeOrg ? (
          <div ref={orgRef} className="relative mr-3">
            <button onClick={() => setOrgOpen(v => !v)}
              className="flex items-center gap-1.5 text-[14px] font-semibold text-text tracking-tight hover:text-accent transition-colors">
              {activeOrg.name}
              <svg className={`w-3 h-3 text-text-muted transition-transform ${orgOpen ? "rotate-180" : ""}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
            {orgOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-56 rounded-lg border border-border bg-surface shadow-xl z-50 overflow-hidden animate-fade-in">
                {orgs.length > 0 && (
                  <div className="max-h-52 overflow-y-auto">
                    {orgs.map(org => (
                      <button key={org.id} onClick={() => { switchOrg(org); setOrgOpen(false) }}
                        className={[
                          "w-full text-left px-3 py-2 font-mono text-[12px] flex items-center gap-2 transition-colors",
                          org.id === activeOrg?.id ? "bg-accent-dim text-accent" : "text-text-muted hover:bg-surface-hi hover:text-text",
                        ].join(" ")}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${org.id === activeOrg.id ? "bg-accent" : "bg-border-hi"}`} />
                        <span className="flex-1 truncate">{org.name}</span>
                        <span className="text-[9px] text-text-muted/50 uppercase">{org.role}</span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="border-t border-border">
                  <Link href="/orgs" onClick={() => setOrgOpen(false)}
                    className="w-full block px-3 py-2 font-mono text-[11px] text-text-muted hover:text-accent hover:bg-surface-hi transition-colors no-underline">
                    {t("manageOrgs")} →
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : user ? (
          <span className="text-[14px] font-semibold text-text tracking-tight mr-3">LMS</span>
        ) : null}

        {/* Nav links — always visible */}
        <div className="w-px h-5 bg-border mr-2" />
        <nav className="flex items-center gap-0.5">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href}
              className="px-3 py-1.5 rounded-md text-[13px] font-medium font-mono transition-colors no-underline text-text-muted hover:text-text hover:bg-surface">
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {/* ── Right ── */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Language toggle */}
        <button onClick={toggleLocale} title={locale === "bg" ? "Switch to English" : "Превключи на Български"}
          className="flex items-center gap-0.5 font-mono text-[11px] rounded border border-border overflow-hidden hover:border-border-hi transition-colors">
          <span className={`px-1.5 py-0.5 transition-colors ${locale === "bg" ? "bg-surface-hi text-text" : "text-text-muted"}`}>БГ</span>
          <span className="w-px h-3 bg-border" />
          <span className={`px-1.5 py-0.5 transition-colors ${locale === "en" ? "bg-surface-hi text-text" : "text-text-muted"}`}>EN</span>
        </button>

        {/* User — name with dropdown on hover/click containing logout */}
        {user ? (
          <div ref={userRef} className="relative"
            onMouseEnter={() => setUserOpen(true)}
            onMouseLeave={() => setUserOpen(false)}>
            <button onClick={() => setUserOpen(v => !v)}
              className="font-mono text-[11px] text-text-muted hover:text-text transition-colors px-2 py-1 rounded-md hover:bg-surface-hi">
              {user.name}
            </button>
            {userOpen && (
              <div className="absolute right-0 top-full mt-0.5 w-36 rounded-lg border border-border bg-surface shadow-xl z-50 overflow-hidden animate-fade-in">
                <button onClick={() => { logout(); setUserOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 font-mono text-[11px] text-text-muted hover:text-danger hover:bg-surface-hi transition-colors">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  {t("signOut")}
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login"
            className="font-mono text-[11px] text-text-muted hover:text-accent transition-colors no-underline px-2 py-1">
            {t("signIn")}
          </Link>
        )}
      </div>
    </>
  )
}
