import { describe, it, expect } from 'vitest'

const hasDb = !!process.env.DATABASE_URL

describe.skipIf(!hasDb)('GET /experience', () => {
  it('returns 200 with data array', async () => {
    const { experienceRoute } = await import('./experience.js')
    const res = await experienceRoute.request('/')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toHaveProperty('data')
    expect(Array.isArray(body.data)).toBe(true)
  })

  it('returns experience entries with correct shape', async () => {
    const { experienceRoute } = await import('./experience.js')
    const res = await experienceRoute.request('/')
    const body = await res.json()

    if (body.data.length > 0) {
      const entry = body.data[0]
      expect(entry).toHaveProperty('id')
      expect(entry).toHaveProperty('company')
      expect(entry).toHaveProperty('role')
      expect(entry).toHaveProperty('description')
      expect(entry).toHaveProperty('startDate')
      expect(entry).toHaveProperty('tech')
      expect(Array.isArray(entry.tech)).toBe(true)
    }
  })
})
