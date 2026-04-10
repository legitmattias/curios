import type { WSEvents } from 'hono/ws'
import { createSession, handleChatMessage, type ChatSession } from '../services/chat-agent.js'
import {
  canConnect,
  onConnect,
  onDisconnect,
  canSendMessage,
  validateMessage,
} from '../services/chat-limiter.js'

export function createChatWsHandlers(clientIp: string): WSEvents {
  let session: ChatSession

  return {
    onOpen(_event, ws) {
      if (!canConnect(clientIp)) {
        ws.send(JSON.stringify({ type: 'error', message: 'connection_limit' }))
        ws.close()
        return
      }

      onConnect(clientIp)
      session = createSession()
      console.log(`Chat session opened [${clientIp}]`)
    },

    async onMessage(event, ws) {
      try {
        const data = JSON.parse(String(event.data))
        const result = validateMessage(data)

        if ('error' in result) {
          if (result.error !== 'empty') {
            ws.send(JSON.stringify({ type: 'error', message: result.error }))
          }
          return
        }

        if (!canSendMessage(clientIp)) {
          ws.send(JSON.stringify({ type: 'error', message: 'ip_rate_limit' }))
          return
        }

        await handleChatMessage(session, result.content, {
          onStatus(status) {
            ws.send(JSON.stringify({ type: 'status', status }))
          },
          onToolCall(tool, status) {
            ws.send(JSON.stringify({ type: 'tool_call', tool, status }))
          },
          onDelta(text) {
            ws.send(JSON.stringify({ type: 'stream', delta: text }))
          },
          onDone() {
            ws.send(JSON.stringify({ type: 'done' }))
          },
          onError(message) {
            ws.send(JSON.stringify({ type: 'error', message }))
          },
        })
      } catch (err) {
        console.error('Chat error:', err)
        ws.send(JSON.stringify({ type: 'error', message: 'internal_error' }))
      }
    },

    onClose() {
      onDisconnect(clientIp)
      console.log(`Chat session closed [${clientIp}]`)
    },

    onError() {
      onDisconnect(clientIp)
      console.log(`Chat session error [${clientIp}]`)
    },
  }
}
