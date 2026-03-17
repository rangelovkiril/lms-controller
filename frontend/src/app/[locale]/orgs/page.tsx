"use client"
import { useState, useEffect }   from "react"
import { useTranslations }       from "next-intl"
import { useAuth, type OrgInfo } from "@/contexts/authContext"
import { apiGet, apiPost, apiDelete } from "@/lib/api"
import { inputBase }              from "@/components/ui/inputStyles"
import { LoginGate }              from "@/components/ui/LoginGate"

interface OrgDetail extends OrgInfo {
  createdAt: string
  members: { id: string; email: string; name: string; role: string; joinedAt: string }[]
}

function CreateOrgForm({ onCreated }: { onCreated: () => void }) {
  const t = useTranslations("orgs")
  const [name, setName] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true)
    try { await apiPost("/orgs", { name }); setName(""); onCreated() }
    catch (err: any) { setError(err.message) } finally { setLoading(false) }
  }
  return (
    <form onSubmit={submit} className="flex gap-2">
      <input value={name} onChange={e => setName(e.target.value)} placeholder={t("createPlaceholder")} required className={inputBase + " flex-1"} />
      <button type="submit" disabled={loading || !name.trim()}
        className="px-4 py-2 rounded-lg font-mono text-[13px] font-medium bg-accent text-black hover:bg-[#00ef8e] transition-all disabled:opacity-40 shrink-0">
        {loading ? "…" : t("create")}
      </button>
      {error && <span className="text-danger text-[12px] font-mono self-center">{error}</span>}
    </form>
  )
}

function JoinOrgForm({ onJoined }: { onJoined: () => void }) {
  const t = useTranslations("orgs")
  const [code, setCode] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true)
    try { await apiPost("/orgs/join", { inviteCode: code.trim().toUpperCase() }); setCode(""); onJoined() }
    catch (err: any) { setError(err.message) } finally { setLoading(false) }
  }
  return (
    <form onSubmit={submit} className="flex gap-2">
      <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder={t("joinPlaceholder")}
        required maxLength={8} spellCheck={false} className={inputBase + " flex-1 uppercase tracking-widest text-center"} />
      <button type="submit" disabled={loading || code.trim().length < 4}
        className="px-4 py-2 rounded-lg font-mono text-[13px] font-medium border border-blue/40 bg-blue-dim text-blue hover:bg-blue/20 transition-all disabled:opacity-40 shrink-0">
        {loading ? "…" : t("join")}
      </button>
      {error && <span className="text-danger text-[12px] font-mono self-center">{error}</span>}
    </form>
  )
}

function InviteCodeBadge({ code, orgId, onRegenerate }: { code: string; orgId: string; onRegenerate: () => void }) {
  const t = useTranslations("orgs")
  const [copied, setCopied] = useState(false)
  const copy = async () => { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const regen = async () => { try { await apiPost(`/orgs/${orgId}/regenerate-invite`, {}); onRegenerate() } catch {} }
  return (
    <div className="flex items-center gap-2">
      <code className="px-3 py-1.5 rounded-md bg-bg border border-border font-mono text-[14px] tracking-[0.2em] text-accent select-all">{code}</code>
      <button onClick={copy} className="px-2 py-1 rounded border border-border font-mono text-[10px] text-text-muted hover:text-text hover:border-border-hi transition-colors">
        {copied ? "✓" : t("copied").charAt(0).toUpperCase() === "К" ? "Копирай" : "Copy"}
      </button>
      <button onClick={regen} title={t("regenerate")}
        className="px-2 py-1 rounded border border-border font-mono text-[10px] text-text-muted hover:text-text hover:border-border-hi transition-colors">↻</button>
    </div>
  )
}

const ROLE_BADGE: Record<string, string> = {
  owner: "bg-accent/20 text-accent border-accent/30",
  admin: "bg-blue/20 text-blue border-blue/30",
  member: "bg-surface-hi text-text-muted border-border",
}

function OrgCard({ org, isActive, onSelect, onRefresh }: {
  org: OrgInfo; isActive: boolean; onSelect: () => void; onRefresh: () => void
}) {
  const t = useTranslations("orgs")
  const [detail, setDetail] = useState<OrgDetail | null>(null)
  const [open, setOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const loadDetail = async () => { try { setDetail(await apiGet(`/orgs/${org.id}`)) } catch {} }
  useEffect(() => { if (open) loadDetail() }, [open, org.id])
  const leave = async () => {
    setLeaving(true)
    try { await apiPost(`/orgs/${org.id}/leave`, {}); onRefresh() }
    catch (err: any) { alert(err.message) } finally { setLeaving(false) }
  }
  const del = async () => {
    if (!confirm(t("deleteConfirm", { name: org.name }))) return
    try { await apiDelete(`/orgs/${org.id}`); onRefresh() } catch (err: any) { alert(err.message) }
  }
  return (
    <div className={["bg-surface border rounded-xl overflow-hidden transition-colors",
      isActive ? "border-accent/50" : "border-border hover:border-border-hi"].join(" ")}>
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-surface-hi border border-border flex items-center justify-center font-mono text-[11px] font-bold text-text-dim">
          {org.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[14px] text-text truncate">{org.name}</span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase border ${ROLE_BADGE[org.role] ?? ROLE_BADGE.member}`}>{org.role}</span>
            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />}
          </div>
          <div className="font-mono text-[11px] text-text-muted mt-0.5">{org.memberCount} {org.memberCount === 1 ? "member" : "members"}</div>
        </div>
        {!isActive && (
          <button onClick={onSelect} className="px-3 py-1.5 rounded-lg border border-accent/40 bg-accent-dim font-mono text-[11px] text-accent hover:bg-accent/20 transition-colors">
            {t("switch")}
          </button>
        )}
        <button onClick={() => setOpen(v => !v)} className="p-1.5 rounded-md border border-border text-text-muted hover:text-text hover:border-border-hi transition-colors">
          <svg className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
        </button>
      </div>
      {open && (
        <div className="border-t border-border px-4 py-3 flex flex-col gap-3 animate-fade-in">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">{t("inviteCode")}</span>
            <InviteCodeBadge code={detail?.inviteCode ?? org.inviteCode} orgId={org.id} onRegenerate={loadDetail} />
            <span className="text-[10px] font-mono text-text-muted">{t("inviteHint")}</span>
          </div>
          {detail?.members && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">{t("members")}</span>
              {detail.members.map(m => (
                <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-bg border border-border">
                  <span className="font-mono text-[12px] text-text flex-1 truncate">{m.name}</span>
                  <span className="font-mono text-[10px] text-text-muted truncate">{m.email}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase border ${ROLE_BADGE[m.role] ?? ROLE_BADGE.member}`}>{m.role}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2 pt-1">
            {org.role !== "owner" && (
              <button onClick={leave} disabled={leaving}
                className="px-3 py-1.5 rounded-lg border border-danger/40 bg-danger/10 font-mono text-[11px] text-danger hover:bg-danger/20 transition-colors disabled:opacity-40">
                {leaving ? t("leaving") : t("leave")}
              </button>
            )}
            {org.role === "owner" && (
              <button onClick={del}
                className="px-3 py-1.5 rounded-lg border border-danger/40 bg-danger/10 font-mono text-[11px] text-danger hover:bg-danger/20 transition-colors">
                {t("deleteOrg")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function OrgsContent() {
  const t = useTranslations("orgs")
  const { orgs, activeOrg, switchOrg, refreshOrgs } = useAuth()
  const [tab, setTab] = useState<"create" | "join">("create")
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-base font-semibold tracking-tight text-text">{t("title")}</h1>
          <p className="text-[13px] font-mono text-text-muted mt-0.5">{t("subtitle")}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="flex border-b border-border">
            {(["create", "join"] as const).map(tb => (
              <button key={tb} onClick={() => setTab(tb)}
                className={["flex-1 py-2.5 font-mono text-[13px] font-medium transition-colors",
                  tab === tb ? "text-text bg-surface-hi" : "text-text-muted hover:text-text"].join(" ")}>
                {tb === "create" ? t("createTab") : t("joinTab")}
              </button>
            ))}
          </div>
          <div className="p-4">
            {tab === "create" ? <CreateOrgForm onCreated={refreshOrgs} /> : <JoinOrgForm onJoined={refreshOrgs} />}
          </div>
        </div>
        {orgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-text-muted">
            <svg className="w-10 h-10 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
            <span className="font-mono text-[13px]">{t("noOrgs")}</span>
            <span className="font-mono text-[11px]">{t("noOrgsHint")}</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-text-muted">
              {t("yourOrgs", { count: orgs.length })}
            </span>
            {orgs.map(org => (
              <OrgCard key={org.id} org={org} isActive={activeOrg?.id === org.id}
                onSelect={() => switchOrg(org)} onRefresh={refreshOrgs} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function OrgsPage() {
  return <LoginGate><OrgsContent /></LoginGate>
}
