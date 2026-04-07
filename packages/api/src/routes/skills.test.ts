import { describe, it, expect } from 'vitest'

const hasDb = !!process.env.DATABASE_URL

describe.skipIf(!hasDb)('GET /skills', () => {
  it('returns 200 with data array', async () => {
    const { skillsRoute } = await import('./skills.js')
    const res = await skillsRoute.request('/')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toHaveProperty('data')
    expect(Array.isArray(body.data)).toBe(true)
  })

  it('returns skills with correct shape', async () => {
    const { skillsRoute } = await import('./skills.js')
    const res = await skillsRoute.request('/')
    const body = await res.json()

    if (body.data.length > 0) {
      const skill = body.data[0]
      expect(skill).toHaveProperty('id')
      expect(skill).toHaveProperty('name')
      expect(skill).toHaveProperty('category')
      expect(skill).toHaveProperty('sortOrder')
    }
  })
})
