import { API_BASE } from "@/types"

const TOKEN_KEY  = "lms_token"
const USER_KEY   = "lms_user"
const ORG_KEY    = "lms_active_org"

// ── Token ────────────────────────────────────────────────────────────────
export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token: string): void { localStorage.setItem(TOKEN_KEY, token) }
export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(ORG_KEY)
}

// ── User ─────────────────────────────────────────────────────────────────
export interface StoredUser { id: string; email: string; name: string }
export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null
  try { return JSON.parse(localStorage.getItem(USER_KEY) ?? "null") } catch { return null }
}
export function setStoredUser(u: StoredUser): void { localStorage.setItem(USER_KEY, JSON.stringify(u)) }

// ── Active Org ───────────────────────────────────────────────────────────
export interface StoredOrg { id: string; name: string; role: string; inviteCode: string }
export function getStoredOrg(): StoredOrg | null {
  if (typeof window === "undefined") return null
  try { return JSON.parse(localStorage.getItem(ORG_KEY) ?? "null") } catch { return null }
}
export function setStoredOrg(o: StoredOrg | null): void {
  if (o) localStorage.setItem(ORG_KEY, JSON.stringify(o))
  else   localStorage.removeItem(ORG_KEY)
}

// ── Authenticated fetch ──────────────────────────────────────────────────
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = getToken()
  const org   = getStoredOrg()
  const headers = new Headers(init?.headers)
  if (token)  headers.set("Authorization", `Bearer ${token}`)
  if (org?.id) headers.set("X-Org-Id", org.id)

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })
  if (res.status === 401) {
    clearAuth()
    if (typeof window !== "undefined" && !window.location.pathname.includes("/login"))
      window.location.href = "/login"
  }
  return res
}

export async function apiGet<T = any>(path: string): Promise<T> {
  const res = await apiFetch(path); if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json()
}
export async function apiPost<T = any>(path: string, body: unknown): Promise<T> {
  const res = await apiFetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw Object.assign(new Error(err.message ?? `HTTP ${res.status}`), { status: res.status }) }
  return res.json()
}
export async function apiPatch<T = any>(path: string, body: unknown): Promise<T> {
  const res = await apiFetch(path, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json()
}
export async function apiDelete(path: string): Promise<void> {
  const res = await apiFetch(path, { method: "DELETE" }); if (!res.ok) throw new Error(`HTTP ${res.status}`)
}
