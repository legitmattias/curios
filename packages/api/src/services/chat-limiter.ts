/**
 * IP-based rate limiting and input validation for chat WebSocket.
 *
 * Layers:
 *  1. Connection limit — max concurrent WS connections per IP
 *  2. IP message rate  — sliding window across all sessions from one IP
 *  3. Session limit    — per-session cap (handled in chat-agent.ts)
 *  4. Input validation — length, format
 */

const MAX_CONNECTIONS_PER_IP = 3
const MAX_MESSAGES_PER_WINDOW = 30
const WINDOW_MS = 60 * 60 * 1000 // 1 hour
const MAX_MESSAGE_LENGTH = 500
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000 // 10 minutes

// Active connection count per IP
const connections = new Map<string, number>()

// Message timestamps per IP (sliding window)
const messageTimestamps = new Map<string, number[]>()

// Periodic cleanup of stale window entries
setInterval(() => {
  const now = Date.now()
  for (const [ip, timestamps] of messageTimestamps) {
    const recent = timestamps.filter((t) => now - t < WINDOW_MS)
    if (recent.length === 0) messageTimestamps.delete(ip)
    else messageTimestamps.set(ip, recent)
  }
}, CLEANUP_INTERVAL_MS)

// ── Connection tracking ───────────────────────────────────

export function canConnect(ip: string): boolean {
  return (connections.get(ip) ?? 0) < MAX_CONNECTIONS_PER_IP
}

export function onConnect(ip: string): void {
  connections.set(ip, (connections.get(ip) ?? 0) + 1)
}

export function onDisconnect(ip: string): void {
  const count = connections.get(ip) ?? 1
  if (count <= 1) connections.delete(ip)
  else connections.set(ip, count - 1)
}

// ── IP-level message rate limiting ────────────────────────

export function canSendMessage(ip: string): boolean {
  const now = Date.now()
  const timestamps = messageTimestamps.get(ip) ?? []
  const recent = timestamps.filter((t) => now - t < WINDOW_MS)

  if (recent.length >= MAX_MESSAGES_PER_WINDOW) return false

  recent.push(now)
  messageTimestamps.set(ip, recent)
  return true
}

// ── Input validation ──────────────────────────────────────

export type ValidationError = 'invalid_format' | 'empty' | 'too_long'

export function validateMessage(data: unknown): { content: string } | { error: ValidationError } {
  if (
    typeof data !== 'object' ||
    data === null ||
    !('type' in data) ||
    !('content' in data)
  ) {
    return { error: 'invalid_format' }
  }

  const { type, content } = data as Record<string, unknown>
  if (type !== 'message' || typeof content !== 'string') {
    return { error: 'invalid_format' }
  }

  const trimmed = content.trim()
  if (!trimmed) return { error: 'empty' }
  if (trimmed.length > MAX_MESSAGE_LENGTH) return { error: 'too_long' }

  return { content: trimmed }
}
