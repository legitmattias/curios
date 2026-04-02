import { OpenAPIHono } from '@hono/zod-openapi'
import { healthRoute } from './routes/health.js'
import { projectsRoute } from './routes/projects.js'
import { skillsRoute } from './routes/skills.js'
import { experienceRoute } from './routes/experience.js'
import { profileRoute } from './routes/profile.js'

const app = new OpenAPIHono()

// Routes
app.route('/health', healthRoute)
app.route('/projects', projectsRoute)
app.route('/skills', skillsRoute)
app.route('/experience', experienceRoute)
app.route('/profile', profileRoute)

// OpenAPI docs endpoint
app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    title: 'CuriOS API',
    version: '0.1.0',
    description: 'API powering CuriOS — the portfolio OS at mattic.dev',
  },
})

const port = parseInt(process.env.PORT ?? '4000', 10)

export default {
  port,
  fetch: app.fetch,
}
