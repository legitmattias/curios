import { db } from './index.js'
import { projects } from './schema.js'

const seedProjects = [
  {
    slug: 'curios',
    title: 'CuriOS',
    description: 'Portfolio OS — a browser-based desktop environment showcasing real, backend-powered applications.',
    tech: ['SvelteKit', 'Hono', 'Bun', 'PostgreSQL', 'WebSockets', 'Docker'],
    url: 'https://mattic.dev',
    repo: 'https://github.com/legitmattias/curios',
  },
  {
    slug: 'dossier',
    title: 'Dossier',
    description: 'Structured knowledge profile system powering the AI chat agent via LLM and RAG.',
    tech: ['TypeScript', 'LLM', 'RAG'],
    repo: 'https://github.com/legitmattias/dossier',
  },
]

async function seed() {
  console.log('Seeding projects...')

  await db
    .insert(projects)
    .values(seedProjects)
    .onConflictDoNothing({ target: projects.slug })

  console.log(`Seeded ${seedProjects.length} projects.`)
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
