import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { ProjectSchema } from '@curios/shared/schemas'

const projectsRoute = new OpenAPIHono()

const listRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(ProjectSchema),
          }),
        },
      },
      description: 'List all projects',
    },
  },
})

// Placeholder data until database is set up
const placeholderProjects = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    slug: 'mattic-dev',
    title: 'mattic.dev',
    description: 'Portfolio OS — the site you are looking at right now.',
    tech: ['SvelteKit', 'Hono', 'Bun', 'PostgreSQL', 'WebSockets'],
    url: 'https://mattic.dev',
    repo: 'https://github.com/legitmattias/mattic.dev',
    createdAt: '2026-03-30T00:00:00Z',
    updatedAt: '2026-03-30T00:00:00Z',
  },
]

projectsRoute.openapi(listRoute, (c) => {
  return c.json({ data: placeholderProjects })
})

export { projectsRoute }
