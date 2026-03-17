import { verifyJWT } from "./jwt"
import db from "../db"

const JWT_SECRET   = Bun.env.JWT_SECRET ?? "change-me-in-production"
const INTERNAL_KEY = Bun.env.INTERNAL_KEY ?? ""

export interface AuthUser {
  id:    string
  email: string
  name:  string
}

function getMembership(userId: string, orgId: string) {
  return db.query(
    "SELECT role FROM org_members WHERE user_id = ? AND org_id = ?"
  ).get(userId, orgId) as { role: string } | null
}

function userExists(userId: string): boolean {
  return !!db.query("SELECT 1 FROM users WHERE id = ?").get(userId)
}

export async function resolveAuth(request: Request): Promise<{
  user:  AuthUser
  orgId: string | null
  role:  string | null
}> {
  // 1) Internal key bypass (SSR)
  const internalKey = request.headers.get("x-internal-key")
  if (INTERNAL_KEY && internalKey === INTERNAL_KEY) {
    return {
      user:  { id: "_internal", email: "internal@system", name: "System" },
      orgId: "_all",
      role:  "owner",
    }
  }

  // 2) JWT
  const auth = request.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) {
    throw Object.assign(new Error("Missing or invalid Authorization header"), { status: 401 })
  }

  const payload = await verifyJWT(auth.slice(7), JWT_SECRET)
  if (!payload) {
    throw Object.assign(new Error("Invalid or expired token"), { status: 401 })
  }

  // 3) Verify user still exists in DB (handles stale JWT after DB reset)
  if (!userExists(payload.sub)) {
    throw Object.assign(new Error("User no longer exists — please register again"), { status: 401 })
  }

  const user: AuthUser = {
    id:    payload.sub,
    email: payload.email,
    name:  payload.name,
  }

  // 4) Optional org context
  const orgId = request.headers.get("x-org-id")
  if (!orgId) return { user, orgId: null, role: null }

  const membership = getMembership(user.id, orgId)
  if (!membership) {
    // Don't throw — org may have been deleted. Just clear org context.
    return { user, orgId: null, role: null }
  }

  return { user, orgId, role: membership.role }
}
