import type { WSEvents } from 'hono/ws'
import {
  getSnapshot,
  incrementConnections,
  decrementConnections,
} from '../services/metrics-store.js'

const BROADCAST_INTERVAL_MS = 2000

export function createMetricsWsHandlers(): WSEvents {
  let intervalId: ReturnType<typeof setInterval> | undefined

  return {
    onOpen(_event, ws) {
      incrementConnections()

      // Send initial snapshot immediately
      ws.send(JSON.stringify({ type: 'snapshot', payload: getSnapshot() }))

      // Start broadcasting
      intervalId = setInterval(() => {
        try {
          ws.send(JSON.stringify({ type: 'snapshot', payload: getSnapshot() }))
        } catch {
          // Client may have disconnected between interval ticks
          if (intervalId) clearInterval(intervalId)
        }
      }, BROADCAST_INTERVAL_MS)
    },

    onClose() {
      decrementConnections()
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = undefined
      }
    },

    onError() {
      decrementConnections()
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = undefined
      }
    },
  }
}
