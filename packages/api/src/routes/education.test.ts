import { describe, it, expect } from 'vitest'

const hasDb = !!process.env.DATABASE_URL

describe.skipIf(!hasDb)('GET /education', () => {
  it('returns 200 with data array', async () => {
    const { educationRoute } = await import('./education.js')
    const res = await educationRoute.request('/')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toHaveProperty('data')
    expect(Array.isArray(body.data)).toBe(true)
  })

  it('returns education entries with correct shape', async () => {
    const { educationRoute } = await import('./education.js')
    const res = await educationRoute.request('/')
    const body = await res.json()

    if (body.data.length > 0) {
      const entry = body.data[0]
      expect(entry).toHaveProperty('id')
      expect(entry).toHaveProperty('institution')
      expect(entry).toHaveProperty('degree')
      expect(entry).toHaveProperty('field')
      expect(entry).toHaveProperty('startDate')
    }
  })
})
