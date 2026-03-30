import { OpenAPIHono } from '@hono/zod-openapi'
import { healthRoute } from './routes/health.js'
import { projectsRoute } from './routes/projects.js'

const app = new OpenAPIHono()

// Routes
app.route('/health', healthRoute)
app.route('/projects', projectsRoute)

// OpenAPI docs endpoint
app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    title: 'CuriOS API',
    version: '0.1.0',
    description: 'API powering CuriOS — the portfolio OS at mattic.dev',
  },
})

export default {
  port: 4000,
  fetch: app.fetch,
}
