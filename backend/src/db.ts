import { Database } from "bun:sqlite"
import { mkdirSync, existsSync } from "fs"
import { dirname } from "path"

const DB_PATH = Bun.env.AUTH_DB_PATH ?? "./data/auth.db"

const dir = dirname(DB_PATH)
if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

const db = new Database(DB_PATH)

db.run("PRAGMA journal_mode=WAL")
db.run("PRAGMA foreign_keys=ON")

// Users — independent, not tied to any org
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name          TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  )
`)

// Organizations — groups with invite codes
db.run(`
  CREATE TABLE IF NOT EXISTS orgs (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    invite_code TEXT NOT NULL UNIQUE,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  )
`)

// Membership — many-to-many
db.run(`
  CREATE TABLE IF NOT EXISTS org_members (
    user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    org_id    TEXT NOT NULL REFERENCES orgs(id)  ON DELETE CASCADE,
    role      TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('owner','admin','member')),
    joined_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, org_id)
  )
`)

// Station ↔ Org linking
db.run(`
  CREATE TABLE IF NOT EXISTS station_orgs (
    station_id TEXT PRIMARY KEY,
    org_id     TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE
  )
`)

db.run("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
db.run("CREATE INDEX IF NOT EXISTS idx_org_members_user ON org_members(user_id)")
db.run("CREATE INDEX IF NOT EXISTS idx_org_members_org ON org_members(org_id)")
db.run("CREATE INDEX IF NOT EXISTS idx_station_orgs_org ON station_orgs(org_id)")
db.run("CREATE INDEX IF NOT EXISTS idx_orgs_invite ON orgs(invite_code)")

export default db
