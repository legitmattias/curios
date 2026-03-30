import { describe, it, expect } from 'vitest'
import { healthRoute } from './health.js'

describe('GET /health', () => {
  it('returns ok status', async () => {
    const res = await healthRoute.request('/')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('ok')
    expect(typeof body.uptime).toBe('number')
  })
})
