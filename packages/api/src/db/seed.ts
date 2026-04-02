import { db } from './index.js'
import { projects, skills, experience, profile } from './schema.js'

const seedProjects = [
  {
    slug: 'curios',
    title: 'CuriOS',
    description:
      'Portfolio OS — a browser-based desktop environment showcasing real, backend-powered applications. Features a window manager, file explorer, terminal, and system monitor.',
    tech: ['SvelteKit', 'Hono', 'Bun', 'PostgreSQL', 'WebSockets', 'Docker'],
    url: 'https://mattic.dev',
    repo: 'https://github.com/legitmattias/curios',
  },
  {
    slug: 'dossier',
    title: 'Dossier',
    description:
      'Structured knowledge profile system that powers AI chat agents with accurate, sourced responses. Uses LLM and RAG to turn personal data into conversational knowledge.',
    tech: ['TypeScript', 'LLM', 'RAG', 'Bun'],
    repo: 'https://github.com/legitmattias/dossier',
  },
  {
    slug: 'readmark',
    title: 'ReadMark',
    description:
      'A CLI bookmarking tool for developers. Tag, search, and organize links from the terminal. Syncs across machines via a lightweight SQLite database.',
    tech: ['TypeScript', 'SQLite', 'Node.js', 'CLI'],
    repo: 'https://github.com/legitmattias/readmark',
  },
  {
    slug: 'codescope',
    title: 'CodeScope',
    description:
      'Static analysis tool that visualizes code complexity and dependency graphs. Parses source files with Tree-sitter and renders interactive reports in the browser.',
    tech: ['Rust', 'WebAssembly', 'Tree-sitter', 'D3.js'],
    repo: 'https://github.com/legitmattias/codescope',
  },
]

const seedSkills = [
  // Backend
  { name: 'Node.js / Bun', category: 'Backend', sortOrder: 0 },
  { name: 'Hono / Express', category: 'Backend', sortOrder: 1 },
  { name: 'PostgreSQL', category: 'Backend', sortOrder: 2 },
  { name: 'REST API Design', category: 'Backend', sortOrder: 3 },
  // Frontend
  { name: 'SvelteKit', category: 'Frontend', sortOrder: 0 },
  { name: 'TypeScript', category: 'Frontend', sortOrder: 1 },
  { name: 'CSS Architecture', category: 'Frontend', sortOrder: 2 },
  // DevOps
  { name: 'Docker', category: 'DevOps', sortOrder: 0 },
  { name: 'GitHub Actions', category: 'DevOps', sortOrder: 1 },
  { name: 'Linux / VPS', category: 'DevOps', sortOrder: 2 },
  // Languages
  { name: 'TypeScript', category: 'Languages', sortOrder: 0 },
  { name: 'JavaScript', category: 'Languages', sortOrder: 1 },
  { name: 'Rust', category: 'Languages', sortOrder: 2 },
  { name: 'SQL', category: 'Languages', sortOrder: 3 },
]

const seedExperience = [
  {
    company: 'Nordic Systems AB',
    role: 'Senior Full Stack Developer',
    description:
      'Leading development of internal tools and client-facing platforms. Designing APIs, mentoring junior developers, and driving adoption of modern TypeScript tooling.',
    startDate: '2023-03-01',
    endDate: null,
    tech: ['TypeScript', 'SvelteKit', 'PostgreSQL', 'Docker'],
    sortOrder: 0,
  },
  {
    company: 'WebCraft Solutions',
    role: 'Full Stack Developer',
    description:
      'Built and maintained e-commerce platforms and content management systems. Introduced automated testing and CI/CD pipelines to the team.',
    startDate: '2021-01-15',
    endDate: '2023-02-28',
    tech: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
    sortOrder: 1,
  },
  {
    company: 'Digital First Agency',
    role: 'Junior Developer',
    description:
      'Developed responsive websites and interactive prototypes for agency clients. Learned modern JavaScript frameworks and version control workflows.',
    startDate: '2019-08-01',
    endDate: '2020-12-31',
    tech: ['JavaScript', 'HTML/CSS', 'Vue.js'],
    sortOrder: 2,
  },
]

const seedProfile = {
  name: 'Mattias Ubbesen',
  title: 'Full Stack Developer',
  bio: 'Full stack developer based in Stockholm with a passion for building well-crafted tools and systems. Focused on TypeScript, modern web frameworks, and developer experience. Enjoys turning complex problems into clean, maintainable solutions.',
  location: 'Stockholm, Sweden',
  email: 'hello@mattic.dev',
  github: 'https://github.com/legitmattias',
  linkedin: 'https://linkedin.com/in/placeholder',
  website: 'https://mattic.dev',
}

async function seed() {
  console.log('Seeding database...')

  await db
    .insert(projects)
    .values(seedProjects)
    .onConflictDoNothing({ target: projects.slug })
  console.log(`  Projects: ${seedProjects.length}`)

  await db.insert(skills).values(seedSkills).onConflictDoNothing()
  console.log(`  Skills: ${seedSkills.length}`)

  await db.insert(experience).values(seedExperience).onConflictDoNothing()
  console.log(`  Experience: ${seedExperience.length}`)

  await db.insert(profile).values(seedProfile).onConflictDoNothing()
  console.log(`  Profile: 1`)

  console.log('Done.')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
