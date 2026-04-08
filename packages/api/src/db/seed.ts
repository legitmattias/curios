import { db } from './index.js'
import { projects, skills, experience, education, profile, translations } from './schema.js'

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
  { name: 'Node.js / Bun', category: 'Backend', sortOrder: 0 },
  { name: 'Hono / Express', category: 'Backend', sortOrder: 1 },
  { name: 'PostgreSQL', category: 'Backend', sortOrder: 2 },
  { name: 'REST API Design', category: 'Backend', sortOrder: 3 },
  { name: 'SvelteKit', category: 'Frontend', sortOrder: 0 },
  { name: 'TypeScript', category: 'Frontend', sortOrder: 1 },
  { name: 'CSS Architecture', category: 'Frontend', sortOrder: 2 },
  { name: 'Docker', category: 'DevOps', sortOrder: 0 },
  { name: 'GitHub Actions', category: 'DevOps', sortOrder: 1 },
  { name: 'Linux / VPS', category: 'DevOps', sortOrder: 2 },
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

const seedEducation = [
  {
    institution: 'Linnaeus University',
    degree: 'Bachelor of Science',
    field: 'Software Engineering',
    startDate: '2024-09-01',
    endDate: null,
    description:
      'Studying software engineering with focus on web technologies, system design, and software architecture.',
    sortOrder: 0,
  },
  {
    institution: 'Stockholm Technical Institute',
    degree: 'Diploma',
    field: 'Web Development',
    startDate: '2018-08-01',
    endDate: '2019-06-15',
    description:
      'Intensive program covering full stack web development, JavaScript, and modern frameworks.',
    sortOrder: 1,
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

// Swedish translations for placeholder content
// Uses natural Swedish tech language — English terms kept where standard in Swedish IT
const svTranslations: {
  entityType: string
  slug: string // used to find entity ID
  field: string
  value: string
  translatedBy: 'human' | 'llm'
}[] = [
  // Projects
  {
    entityType: 'project',
    slug: 'curios',
    field: 'description',
    value: 'Portfolio-OS — en webbläsarbaserad skrivbordsmiljö som visar upp riktiga, backend-drivna applikationer. Innehåller fönsterhanterare, filutforskare, terminal och systemövervakning.',
    translatedBy: 'human',
  },
  {
    entityType: 'project',
    slug: 'dossier',
    field: 'description',
    value: 'Strukturerat kunskapsprofil-system som driver AI-chatbotar med korrekta, källbaserade svar. Använder LLM och RAG för att omvandla personlig data till konversationsbaserad kunskap.',
    translatedBy: 'human',
  },
  {
    entityType: 'project',
    slug: 'readmark',
    field: 'description',
    value: 'Ett CLI-baserat bokmärkesverktyg för utvecklare. Tagga, sök och organisera länkar från terminalen. Synkar mellan maskiner via en lättviktig SQLite-databas.',
    translatedBy: 'human',
  },
  {
    entityType: 'project',
    slug: 'codescope',
    field: 'description',
    value: 'Statiskt analysverktyg som visualiserar kodkomplexitet och beroendegrafer. Tolkar källfiler med Tree-sitter och renderar interaktiva rapporter i webbläsaren.',
    translatedBy: 'human',
  },
  // Profile
  {
    entityType: 'profile',
    slug: '_profile',
    field: 'title',
    value: 'Fullstackutvecklare',
    translatedBy: 'human',
  },
  {
    entityType: 'profile',
    slug: '_profile',
    field: 'bio',
    value: 'Fullstackutvecklare baserad i Stockholm med en passion för att bygga välgjorda verktyg och system. Fokuserar på TypeScript, moderna webbramverk och utvecklarupplevelse. Tycker om att omvandla komplexa problem till rena, underhållbara lösningar.',
    translatedBy: 'human',
  },
  // Experience
  {
    entityType: 'experience',
    slug: 'Nordic Systems AB',
    field: 'role',
    value: 'Senior fullstackutvecklare',
    translatedBy: 'human',
  },
  {
    entityType: 'experience',
    slug: 'Nordic Systems AB',
    field: 'description',
    value: 'Leder utveckling av interna verktyg och kundvända plattformar. Designar API:er, mentorerar juniora utvecklare och driver adoption av modern TypeScript-tooling.',
    translatedBy: 'human',
  },
  {
    entityType: 'experience',
    slug: 'WebCraft Solutions',
    field: 'role',
    value: 'Fullstackutvecklare',
    translatedBy: 'human',
  },
  {
    entityType: 'experience',
    slug: 'WebCraft Solutions',
    field: 'description',
    value: 'Byggde och underhöll e-handelsplattformar och innehållshanteringssystem. Introducerade automatiserad testning och CI/CD-pipelines i teamet.',
    translatedBy: 'human',
  },
  {
    entityType: 'experience',
    slug: 'Digital First Agency',
    field: 'role',
    value: 'Juniorutvecklare',
    translatedBy: 'human',
  },
  {
    entityType: 'experience',
    slug: 'Digital First Agency',
    field: 'description',
    value: 'Utvecklade responsiva webbplatser och interaktiva prototyper för byråkunder. Lärde sig moderna JavaScript-ramverk och versionshanteringsflöden.',
    translatedBy: 'human',
  },
  // Education
  {
    entityType: 'education',
    slug: 'Linnaeus University',
    field: 'degree',
    value: 'Kandidatexamen',
    translatedBy: 'human',
  },
  {
    entityType: 'education',
    slug: 'Linnaeus University',
    field: 'field',
    value: 'Mjukvaruteknik',
    translatedBy: 'human',
  },
  {
    entityType: 'education',
    slug: 'Linnaeus University',
    field: 'description',
    value: 'Studerar mjukvaruteknik med fokus på webbteknologier, systemdesign och mjukvaruarkitektur.',
    translatedBy: 'human',
  },
  {
    entityType: 'education',
    slug: 'Stockholm Technical Institute',
    field: 'degree',
    value: 'Diplom',
    translatedBy: 'human',
  },
  {
    entityType: 'education',
    slug: 'Stockholm Technical Institute',
    field: 'field',
    value: 'Webbutveckling',
    translatedBy: 'human',
  },
  {
    entityType: 'education',
    slug: 'Stockholm Technical Institute',
    field: 'description',
    value: 'Intensivt program som täcker fullstackwebbutveckling, JavaScript och moderna ramverk.',
    translatedBy: 'human',
  },
]

async function seed() {
  console.log('Seeding database...')

  // Projects: upsert by slug (unique constraint)
  await db
    .insert(projects)
    .values(seedProjects)
    .onConflictDoNothing({ target: projects.slug })
  console.log(`  Projects: ${seedProjects.length} (upsert)`)

  // All other tables: only seed if empty
  const existingSkills = await db.select().from(skills).limit(1)
  if (existingSkills.length === 0) {
    await db.insert(skills).values(seedSkills)
    console.log(`  Skills: ${seedSkills.length} inserted`)
  } else {
    console.log(`  Skills: skipped (already has data)`)
  }

  const existingExperience = await db.select().from(experience).limit(1)
  if (existingExperience.length === 0) {
    await db.insert(experience).values(seedExperience)
    console.log(`  Experience: ${seedExperience.length} inserted`)
  } else {
    console.log(`  Experience: skipped (already has data)`)
  }

  const existingEducation = await db.select().from(education).limit(1)
  if (existingEducation.length === 0) {
    await db.insert(education).values(seedEducation)
    console.log(`  Education: ${seedEducation.length} inserted`)
  } else {
    console.log(`  Education: skipped (already has data)`)
  }

  const existingProfile = await db.select().from(profile).limit(1)
  if (existingProfile.length === 0) {
    await db.insert(profile).values(seedProfile)
    console.log(`  Profile: 1 inserted`)
  } else {
    console.log(`  Profile: skipped (already has data)`)
  }

  // Seed Swedish translations (idempotent via unique constraint upsert)
  await seedTranslations()

  console.log('Done.')
  process.exit(0)
}

async function seedTranslations() {
  // Build entity ID lookup by querying each table
  const allProjects = await db.select().from(projects)
  const allExperience = await db.select().from(experience)
  const allEducation = await db.select().from(education)
  const allProfile = await db.select().from(profile).limit(1)

  const projectIdBySlug = new Map(allProjects.map((p) => [p.slug, p.id]))
  const experienceIdByCompany = new Map(allExperience.map((e) => [e.company, e.id]))
  const educationIdByInstitution = new Map(allEducation.map((e) => [e.institution, e.id]))
  const profileId = allProfile[0]?.id

  let count = 0

  for (const t of svTranslations) {
    let entityId: string | undefined

    if (t.entityType === 'project') {
      entityId = projectIdBySlug.get(t.slug)
    } else if (t.entityType === 'experience') {
      entityId = experienceIdByCompany.get(t.slug)
    } else if (t.entityType === 'education') {
      entityId = educationIdByInstitution.get(t.slug)
    } else if (t.entityType === 'profile') {
      entityId = profileId
    }

    if (!entityId) {
      console.log(`  Translation: skipped ${t.entityType}/${t.slug}/${t.field} (entity not found)`)
      continue
    }

    await db
      .insert(translations)
      .values({
        entityType: t.entityType,
        entityId,
        locale: 'sv',
        field: t.field,
        value: t.value,
        translatedBy: t.translatedBy,
      })
      .onConflictDoNothing()

    count++
  }

  console.log(`  Translations: ${count} Swedish translations seeded`)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
