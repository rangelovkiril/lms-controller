"use client"
import Link        from "next/link"
import { useAuth } from "@/contexts/authContext"
import { useTranslations } from "next-intl"

export function LoginGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const t = useTranslations("auth")

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-5 h-5 border-[1.5px] border-border border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 max-w-xs text-center">
          <div className="w-12 h-12 rounded-xl bg-surface-hi border border-border flex items-center justify-center">
            <svg className="w-5 h-5 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
          <div>
            <p className="text-[14px] font-medium text-text">{t("loginRequired")}</p>
            <p className="text-[12px] font-mono text-text-muted mt-1">{t("loginRequiredHint")}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/login"
              className="px-4 py-2 rounded-lg font-mono text-[13px] font-medium bg-accent text-black hover:bg-[#00ef8e] transition-all no-underline">
              {t("signInButton")}
            </Link>
            <Link href="/register"
              className="px-4 py-2 rounded-lg font-mono text-[13px] font-medium border border-border text-text-muted hover:text-text hover:border-border-hi transition-colors no-underline">
              {t("register")}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
