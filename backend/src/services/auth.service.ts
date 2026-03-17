import db from "../db"
import { signJWT } from "../plugins/jwt"

const JWT_SECRET = Bun.env.JWT_SECRET ?? "change-me-in-production"

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateInviteCode(): string {
  // 8-char alphanumeric, easy to type
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // no 0/O/1/I to avoid confusion
  let code = ""
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  for (const b of bytes) code += chars[b % chars.length]
  return code
}

async function issueToken(user: { id: string; email: string; name: string }): Promise<string> {
  return signJWT({ sub: user.id, email: user.email, name: user.name }, JWT_SECRET)
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface AuthResult {
  token: string
  user:  { id: string; email: string; name: string }
  orgs:  OrgWithRole[]
}

export interface OrgWithRole {
  id:         string
  name:       string
  role:       string
  inviteCode: string
  memberCount: number
}

export interface OrgMember {
  id:    string
  email: string
  name:  string
  role:  string
  joinedAt: string
}

// ── Register (independent — no org) ──────────────────────────────────────

export async function register(email: string, password: string, name: string): Promise<AuthResult> {
  const existing = db.query("SELECT id FROM users WHERE email = ?").get(email)
  if (existing) throw Object.assign(new Error("Email already registered"), { status: 409 })

  const userId = crypto.randomUUID()
  const hash   = await Bun.password.hash(password, { algorithm: "bcrypt", cost: 10 })

  db.run(
    "INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)",
    [userId, email, hash, name],
  )

  const token = await issueToken({ id: userId, email, name })
  return { token, user: { id: userId, email, name }, orgs: [] }
}

// ── Login ────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<AuthResult> {
  const row = db.query(
    "SELECT id, email, name, password_hash FROM users WHERE email = ?"
  ).get(email) as any

  if (!row) throw Object.assign(new Error("Invalid credentials"), { status: 401 })
  if (!(await Bun.password.verify(password, row.password_hash)))
    throw Object.assign(new Error("Invalid credentials"), { status: 401 })

  const token = await issueToken({ id: row.id, email: row.email, name: row.name })
  const orgs  = getUserOrgs(row.id)
  return { token, user: { id: row.id, email: row.email, name: row.name }, orgs }
}

// ── Organization CRUD ────────────────────────────────────────────────────

export function createOrg(userId: string, name: string): OrgWithRole {
  const existing = db.query("SELECT id FROM orgs WHERE name = ?").get(name)
  if (existing) throw Object.assign(new Error("Organization name already taken"), { status: 409 })

  const orgId      = crypto.randomUUID()
  const inviteCode = generateInviteCode()

  db.run("INSERT INTO orgs (id, name, invite_code) VALUES (?, ?, ?)", [orgId, name, inviteCode])
  db.run(
    "INSERT INTO org_members (user_id, org_id, role) VALUES (?, ?, 'owner')",
    [userId, orgId],
  )

  return { id: orgId, name, role: "owner", inviteCode, memberCount: 1 }
}

export function joinOrg(userId: string, inviteCode: string): OrgWithRole {
  const org = db.query("SELECT id, name, invite_code FROM orgs WHERE invite_code = ?").get(inviteCode) as any
  if (!org) throw Object.assign(new Error("Invalid invite code"), { status: 404 })

  const already = db.query(
    "SELECT 1 FROM org_members WHERE user_id = ? AND org_id = ?"
  ).get(userId, org.id)
  if (already) throw Object.assign(new Error("Already a member"), { status: 409 })

  db.run(
    "INSERT INTO org_members (user_id, org_id, role) VALUES (?, ?, 'member')",
    [userId, org.id],
  )

  const count = (db.query(
    "SELECT COUNT(*) as c FROM org_members WHERE org_id = ?"
  ).get(org.id) as any).c

  return { id: org.id, name: org.name, role: "member", inviteCode: org.invite_code, memberCount: count }
}

export function leaveOrg(userId: string, orgId: string): void {
  const membership = db.query(
    "SELECT role FROM org_members WHERE user_id = ? AND org_id = ?"
  ).get(userId, orgId) as any

  if (!membership) throw Object.assign(new Error("Not a member"), { status: 404 })

  if (membership.role === "owner") {
    const otherOwners = (db.query(
      "SELECT COUNT(*) as c FROM org_members WHERE org_id = ? AND role = 'owner' AND user_id != ?"
    ).get(orgId, userId) as any).c
    if (otherOwners === 0)
      throw Object.assign(new Error("Cannot leave — you are the only owner. Transfer ownership or delete the org."), { status: 400 })
  }

  db.run("DELETE FROM org_members WHERE user_id = ? AND org_id = ?", [userId, orgId])
}

export function deleteOrg(userId: string, orgId: string): void {
  const membership = db.query(
    "SELECT role FROM org_members WHERE user_id = ? AND org_id = ?"
  ).get(userId, orgId) as any

  if (!membership || membership.role !== "owner")
    throw Object.assign(new Error("Only owners can delete an organization"), { status: 403 })

  db.run("DELETE FROM station_orgs WHERE org_id = ?", [orgId])
  db.run("DELETE FROM org_members WHERE org_id = ?", [orgId])
  db.run("DELETE FROM orgs WHERE id = ?", [orgId])
}

export function regenerateInviteCode(userId: string, orgId: string): string {
  const membership = db.query(
    "SELECT role FROM org_members WHERE user_id = ? AND org_id = ?"
  ).get(userId, orgId) as any

  if (!membership || (membership.role !== "owner" && membership.role !== "admin"))
    throw Object.assign(new Error("Only owners/admins can regenerate invite codes"), { status: 403 })

  const newCode = generateInviteCode()
  db.run("UPDATE orgs SET invite_code = ? WHERE id = ?", [newCode, orgId])
  return newCode
}

export function updateMemberRole(actorId: string, orgId: string, targetUserId: string, newRole: string): void {
  const actorMembership = db.query(
    "SELECT role FROM org_members WHERE user_id = ? AND org_id = ?"
  ).get(actorId, orgId) as any

  if (!actorMembership || actorMembership.role !== "owner")
    throw Object.assign(new Error("Only owners can change roles"), { status: 403 })

  if (!["admin", "member"].includes(newRole))
    throw Object.assign(new Error("Invalid role"), { status: 400 })

  db.run(
    "UPDATE org_members SET role = ? WHERE user_id = ? AND org_id = ?",
    [newRole, targetUserId, orgId],
  )
}

export function removeMember(actorId: string, orgId: string, targetUserId: string): void {
  const actorMembership = db.query(
    "SELECT role FROM org_members WHERE user_id = ? AND org_id = ?"
  ).get(actorId, orgId) as any

  if (!actorMembership || (actorMembership.role !== "owner" && actorMembership.role !== "admin"))
    throw Object.assign(new Error("Insufficient permissions"), { status: 403 })

  if (actorId === targetUserId)
    throw Object.assign(new Error("Use leave instead"), { status: 400 })

  db.run("DELETE FROM org_members WHERE user_id = ? AND org_id = ?", [targetUserId, orgId])
}

// ── Queries ──────────────────────────────────────────────────────────────

export function getUserOrgs(userId: string): OrgWithRole[] {
  const rows = db.query(`
    SELECT o.id, o.name, o.invite_code, m.role,
           (SELECT COUNT(*) FROM org_members WHERE org_id = o.id) as member_count
    FROM org_members m
    JOIN orgs o ON m.org_id = o.id
    WHERE m.user_id = ?
    ORDER BY m.joined_at
  `).all(userId) as any[]

  return rows.map(r => ({
    id: r.id, name: r.name, role: r.role,
    inviteCode: r.invite_code, memberCount: r.member_count,
  }))
}

export function getOrgMembers(orgId: string): OrgMember[] {
  return db.query(`
    SELECT u.id, u.email, u.name, m.role, m.joined_at
    FROM org_members m
    JOIN users u ON m.user_id = u.id
    WHERE m.org_id = ?
    ORDER BY m.role = 'owner' DESC, m.joined_at
  `).all(orgId) as OrgMember[]
}

export function getOrgInfo(orgId: string) {
  return db.query("SELECT id, name, invite_code, created_at FROM orgs WHERE id = ?").get(orgId) as any
}

// ── Station ↔ Org (unchanged) ────────────────────────────────────────────

export function linkStationToOrg(stationId: string, orgId: string): void {
  db.run("INSERT OR REPLACE INTO station_orgs (station_id, org_id) VALUES (?, ?)", [stationId, orgId])
}

export function getOrgStationIds(orgId: string): string[] {
  return (db.query("SELECT station_id FROM station_orgs WHERE org_id = ?").all(orgId) as any[]).map(r => r.station_id)
}

export function stationBelongsToOrg(stationId: string, orgId: string): boolean {
  return !!db.query("SELECT 1 FROM station_orgs WHERE station_id = ? AND org_id = ?").get(stationId, orgId)
}

export function unlinkStation(stationId: string): void {
  db.run("DELETE FROM station_orgs WHERE station_id = ?", [stationId])
}

export function getUser(userId: string) {
  return db.query("SELECT id, email, name FROM users WHERE id = ?").get(userId) as any
}
