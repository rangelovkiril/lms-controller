type Handler = (params: Record<string, string>, payload: string) => void

type RouteMap = {
  [pattern: string]: Handler
}

const patternSegments = (pattern: string) => pattern.split("/")

function match(patternSegs: string[], topicSegs: string[]): Record<string, string> | null {
  if (patternSegs.length !== topicSegs.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < patternSegs.length; i++) {
    const p = patternSegs[i]
    const t = topicSegs[i]
    if (p.startsWith(":")) params[p.slice(1)] = t
    else if (p !== t) return null
  }
  return params
}

export function createDispatcher(routes: RouteMap) {
  const compiled = Object.entries(routes).map(([pattern, handler]) => ({
    segments: patternSegments(pattern),
    handler,
  }))

  return (topic: string, payload: string) => {
    const topicSegs = topic.split("/")
    for (const { segments, handler } of compiled) {
      const params = match(segments, topicSegs)
      if (params) {
        handler(params, payload)
        return
      }
    }
    console.warn("[Dispatch] Unhandled topic:", topic)
  }
}

export const TOPICS = [
  "slr/+/cmd",
  "slr/+/tracking/+/pos",
  "slr/+/env",
  "slr/+/system",
  "slr/+/log/+",
] as const