import Link      from "next/link"
import NavClient from "./NavClient"

export default function Navbar() {
  return (
    <header className="h-12 shrink-0 flex items-center gap-0 px-4 border-b border-border bg-bg z-50">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 no-underline mr-3">
        <div className="w-6 h-6 rounded-md flex items-center justify-center bg-linear-to-br from-accent to-[#00a86b]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
            <circle cx="12" cy="12" r="3"/>
            <path d="M3 12h3M18 12h3M12 3v3M12 18v3"/>
            <path d="M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M16.3 7.7l-2.1 2.1M7.7 16.3l-2.1 2.1"/>
          </svg>
        </div>
      </Link>

      {/* Everything else is client-rendered (needs auth context) */}
      <NavClient />
    </header>
  )
}
