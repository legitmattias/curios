import { describe, it, expect } from 'vitest'

const hasDb = !!process.env.DATABASE_URL

describe.skipIf(!hasDb)('GET /profile', () => {
  it('returns 200 with profile data', async () => {
    const { profileRoute } = await import('./profile.js')
    const res = await profileRoute.request('/')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toHaveProperty('data')
    expect(body.data).toHaveProperty('name')
    expect(body.data).toHaveProperty('title')
    expect(body.data).toHaveProperty('bio')
    expect(body.data).toHaveProperty('email')
  })
})
