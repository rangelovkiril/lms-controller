"use client"
import { useState } from "react"
import Link         from "next/link"
import { useAuth }  from "@/contexts/authContext"
import { inputBase } from "@/components/ui/inputStyles"

export default function LoginPage() {
  const { login } = useAuth()
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [error,    setError]    = useState("")
  const [loading,  setLoading]  = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true)
    try { await login(email, password) }
    catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-linear-to-br from-accent to-[#00a86b]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
              <circle cx="12" cy="12" r="3"/><path d="M3 12h3M18 12h3M12 3v3M12 18v3"/>
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-text">Welcome back</h1>
          <p className="text-[13px] font-mono text-text-muted">Sign in to LMS</p>
        </div>

        <form onSubmit={submit} className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-mono uppercase tracking-widest text-text-muted">Email</label>
            <input type="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className={inputBase} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-mono uppercase tracking-widest text-text-muted">Password</label>
            <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className={inputBase} />
          </div>
          {error && <div className="px-3 py-2 rounded-lg border border-danger/40 bg-danger/10 font-mono text-[12px] text-danger">{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg font-mono text-[13px] font-medium bg-accent text-black hover:bg-[#00ef8e] transition-all disabled:opacity-40">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-[13px] font-mono text-text-muted">
          No account? <Link href="/register" className="text-accent hover:underline no-underline">Register</Link>
        </p>
      </div>
    </div>
  )
}
