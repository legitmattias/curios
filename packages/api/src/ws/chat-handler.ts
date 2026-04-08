import type { WSEvents } from 'hono/ws'
import { createSession, handleChatMessage, type ChatSession } from '../services/chat-agent.js'

export function createChatWsHandlers(): WSEvents {
  let session: ChatSession

  return {
    onOpen() {
      session = createSession()
      console.log('Chat session opened')
    },

    async onMessage(event, ws) {
      try {
        const data = JSON.parse(String(event.data))

        if (data.type !== 'message' || typeof data.content !== 'string') {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }))
          return
        }

        const userMessage = data.content.trim()
        if (!userMessage) return

        await handleChatMessage(session, userMessage, {
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
        const message = err instanceof Error ? err.message : 'Unknown error'
        ws.send(JSON.stringify({ type: 'error', message }))
      }
    },

    onClose() {
      console.log('Chat session closed')
    },

    onError() {
      console.log('Chat session error')
    },
  }
}
