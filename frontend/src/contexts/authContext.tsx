"use client"
import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from "react"
import { useRouter }  from "next/navigation"
import { useLocale }  from "next-intl"
import { API_BASE }   from "@/types"
import {
  getToken, setToken, clearAuth,
  getStoredUser, setStoredUser, type StoredUser,
  getStoredOrg, setStoredOrg, type StoredOrg,
} from "@/lib/api"

export interface OrgInfo {
  id: string; name: string; role: string; inviteCode: string; memberCount: number
}

interface AuthContextValue {
  user:        StoredUser | null
  token:       string | null
  loading:     boolean
  orgs:        OrgInfo[]
  activeOrg:   StoredOrg | null
  login:       (email: string, password: string) => Promise<void>
  register:    (email: string, password: string, name: string) => Promise<void>
  logout:      () => void
  switchOrg:   (org: OrgInfo) => void
  refreshOrgs: () => Promise<void>
}

const AuthCtx = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const locale = useLocale()

  const [user,      setUser]      = useState<StoredUser | null>(null)
  const [token,     setTkn]       = useState<string | null>(null)
  const [orgs,      setOrgs]      = useState<OrgInfo[]>([])
  const [activeOrg, setActiveOrg] = useState<StoredOrg | null>(null)
  const [loading,   setLoading]   = useState(true)

  // Hydrate
  useEffect(() => {
    const t = getToken()
    const u = getStoredUser()
    const o = getStoredOrg()
    if (t && u) { setTkn(t); setUser(u); setActiveOrg(o) }
    setLoading(false)
  }, [])

  // Load orgs + validate JWT
  useEffect(() => {
    if (!token) return
    fetch(`${API_BASE}/orgs`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (res.status === 401) {
          clearAuth(); setTkn(null); setUser(null); setOrgs([]); setActiveOrg(null)
          return
        }
        if (!res.ok) return
        const data: OrgInfo[] = await res.json()
        setOrgs(data)
        const stored = getStoredOrg()
        if (data.length > 0 && (!stored || !data.find(o => o.id === stored.id))) {
          const first = data[0]
          const org: StoredOrg = { id: first.id, name: first.name, role: first.role, inviteCode: first.inviteCode }
          setActiveOrg(org); setStoredOrg(org)
        } else if (data.length === 0) {
          setActiveOrg(null); setStoredOrg(null)
        }
      })
      .catch(() => {})
  }, [token])

  const loginFn = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.message ?? "Login failed") }
    const data = await res.json()
    setToken(data.token); setStoredUser(data.user); setTkn(data.token); setUser(data.user)
    setOrgs(data.orgs ?? [])
    if (data.orgs?.length > 0) {
      const first = data.orgs[0]
      const org: StoredOrg = { id: first.id, name: first.name, role: first.role, inviteCode: first.inviteCode }
      setActiveOrg(org); setStoredOrg(org)
      router.push(`/${locale}/stations`)
    } else {
      setActiveOrg(null); setStoredOrg(null)
      router.push(`/${locale}/orgs`)
    }
  }, [locale, router])

  const registerFn = useCallback(async (email: string, password: string, name: string) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    })
    if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.message ?? "Registration failed") }
    const data = await res.json()
    setToken(data.token); setStoredUser(data.user); setTkn(data.token); setUser(data.user)
    setOrgs([]); setActiveOrg(null); setStoredOrg(null)
    router.push(`/${locale}/orgs`)
  }, [locale, router])

  const logout = useCallback(() => {
    clearAuth(); setTkn(null); setUser(null); setOrgs([]); setActiveOrg(null)
  }, [])

  const switchOrg = useCallback((org: OrgInfo) => {
    const stored: StoredOrg = { id: org.id, name: org.name, role: org.role, inviteCode: org.inviteCode }
    setActiveOrg(stored); setStoredOrg(stored)
  }, [])

  const refreshOrgs = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/orgs`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return
      const data: OrgInfo[] = await res.json()
      setOrgs(data)
      const current = getStoredOrg()
      if (current && !data.find(o => o.id === current.id)) {
        if (data.length > 0) {
          const first = data[0]
          const org: StoredOrg = { id: first.id, name: first.name, role: first.role, inviteCode: first.inviteCode }
          setActiveOrg(org); setStoredOrg(org)
        } else { setActiveOrg(null); setStoredOrg(null) }
      }
    } catch {}
  }, [token])

  return (
    <AuthCtx.Provider value={{
      user, token, loading, orgs, activeOrg,
      login: loginFn, register: registerFn, logout, switchOrg, refreshOrgs,
    }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
