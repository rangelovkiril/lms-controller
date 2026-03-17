const encoder = new TextEncoder()

export interface JWTPayload {
  sub:   string   // user id
  email: string
  name:  string
  iat?:  number
  exp?:  number
}

function b64url(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}
function b64urlBuf(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}
function b64urlDecode(s: string): string {
  s = s.replace(/-/g, "+").replace(/_/g, "/")
  while (s.length % 4) s += "="
  return atob(s)
}

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw", encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"],
  )
}

export async function signJWT(
  payload: Omit<JWTPayload, "iat" | "exp">,
  secret: string,
  expiresInSec = 86400 * 7,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const full: JWTPayload = { ...payload, iat: now, exp: now + expiresInSec }
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const body   = b64url(JSON.stringify(full))
  const data   = `${header}.${body}`
  const key = await getKey(secret)
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data))
  return `${data}.${b64urlBuf(sig)}`
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  const parts = token.split(".")
  if (parts.length !== 3) return null
  const [header, body, sig] = parts
  const data = `${header}.${body}`
  const key = await getKey(secret)
  const sigStr = b64urlDecode(sig)
  const sigBuf = new Uint8Array(sigStr.length)
  for (let i = 0; i < sigStr.length; i++) sigBuf[i] = sigStr.charCodeAt(i)
  const valid = await crypto.subtle.verify("HMAC", key, sigBuf, encoder.encode(data))
  if (!valid) return null
  const payload: JWTPayload = JSON.parse(b64urlDecode(body))
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null
  return payload
}
