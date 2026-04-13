import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { upgradeWebSocket, websocket } from 'hono/bun'
import { metricsMiddleware } from './middleware/metrics.js'
import { healthRoute } from './routes/health.js'
import { projectsRoute } from './routes/projects.js'
import { skillsRoute } from './routes/skills.js'
import { experienceRoute } from './routes/experience.js'
import { profileRoute } from './routes/profile.js'
import { metricsRoute } from './routes/metrics.js'
import { educationRoute } from './routes/education.js'
import { cvRoute } from './routes/cv.js'
import { createMetricsWsHandlers } from './ws/metrics-handler.js'
import { createChatWsHandlers } from './ws/chat-handler.js'

const app = new OpenAPIHono()

// Middleware
app.use('*', cors())
app.use('*', metricsMiddleware)

// Routes
app.route('/health', healthRoute)
app.route('/projects', projectsRoute)
app.route('/skills', skillsRoute)
app.route('/experience', experienceRoute)
app.route('/profile', profileRoute)
app.route('/metrics', metricsRoute)
app.route('/education', educationRoute)
app.route('/cv', cvRoute)

// WebSocket
app.get('/ws/metrics', upgradeWebSocket(() => createMetricsWsHandlers()))
app.get('/ws/chat', upgradeWebSocket((c) => {
  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
    ?? c.req.header('x-real-ip')
    ?? 'unknown'
  return createChatWsHandlers(ip)
}))

// OpenAPI docs endpoint
app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    title: 'CuriOS API',
    version: '0.1.0',
    description: 'API powering CuriOS — the portfolio OS at mattiasubbesen.com',
  },
})

const port = parseInt(process.env.PORT ?? '4000', 10)

// CRITICAL: websocket must be exported alongside fetch for Bun WS upgrades
export default {
  port,
  fetch: app.fetch,
  websocket,
}
