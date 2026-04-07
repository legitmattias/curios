import { describe, it, expect } from 'vitest'

const hasDb = !!process.env.DATABASE_URL

describe.skipIf(!hasDb)('GET /projects', () => {
  it('returns 200 with data array', async () => {
    const { projectsRoute } = await import('./projects.js')
    const res = await projectsRoute.request('/')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toHaveProperty('data')
    expect(Array.isArray(body.data)).toBe(true)
  })

  it('returns projects with correct shape', async () => {
    const { projectsRoute } = await import('./projects.js')
    const res = await projectsRoute.request('/')
    const body = await res.json()

    if (body.data.length > 0) {
      const project = body.data[0]
      expect(project).toHaveProperty('id')
      expect(project).toHaveProperty('slug')
      expect(project).toHaveProperty('title')
      expect(project).toHaveProperty('description')
      expect(project).toHaveProperty('tech')
      expect(Array.isArray(project.tech)).toBe(true)
    }
  })
})

describe.skipIf(!hasDb)('GET /projects/:slug', () => {
  it('returns 404 for non-existent slug', async () => {
    const { projectsRoute } = await import('./projects.js')
    const res = await projectsRoute.request('/nonexistent-slug-12345')
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body).toHaveProperty('error')
    expect(body).toHaveProperty('statusCode', 404)
  })
})
