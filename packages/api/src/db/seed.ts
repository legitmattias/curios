import { db } from "./index.js";
import {
  projects,
  skills,
  experience,
  education,
  profile,
  translations,
} from "./schema.js";

const seedProjects = [
  {
    slug: "curios",
    title: "CuriOS",
    description:
      "Portfolio OS — a browser-based desktop environment showcasing real, backend-powered applications. Features a window manager, file explorer, terminal, and system monitor.",
    tech: ["SvelteKit", "Hono", "Bun", "PostgreSQL", "WebSockets", "Docker"],
    url: "https://mattiasubbesen.com",
    repo: "https://github.com/legitmattias/curios",
  },
  {
    slug: "dossier",
    title: "Dossier",
    description:
      "Structured knowledge profile system that powers AI chat agents with accurate, sourced responses. Uses LLM and RAG to turn personal data into conversational knowledge.",
    tech: ["TypeScript", "LLM", "RAG", "Bun"],
    repo: "https://github.com/legitmattias/dossier",
  },
];

const seedSkills = [
  { name: "Node.js / Bun", category: "Backend", sortOrder: 0 },
  { name: "Hono / Express", category: "Backend", sortOrder: 1 },
  { name: "FastAPI", category: "Backend", sortOrder: 2 },
  { name: "PostgreSQL", category: "Backend", sortOrder: 3 },
  { name: "REST API Design", category: "Backend", sortOrder: 4 },
  { name: "SvelteKit", category: "Frontend", sortOrder: 0 },
  { name: "React", category: "Frontend", sortOrder: 1 },
  { name: "TypeScript", category: "Frontend", sortOrder: 2 },
  { name: "CSS Architecture", category: "Frontend", sortOrder: 3 },
  { name: "Docker", category: "DevOps", sortOrder: 0 },
  { name: "GitHub Actions", category: "DevOps", sortOrder: 1 },
  { name: "Terraform / Ansible", category: "DevOps", sortOrder: 2 },
  { name: "Linux / VPS", category: "DevOps", sortOrder: 3 },
  { name: "TypeScript", category: "Languages", sortOrder: 0 },
  { name: "Python", category: "Languages", sortOrder: 1 },
  { name: "JavaScript", category: "Languages", sortOrder: 2 },
  { name: "Java", category: "Languages", sortOrder: 3 },
  { name: "SQL", category: "Languages", sortOrder: 4 },
];

const seedExperience = [
  {
    company: "Linde Gas",
    role: "Process Technician",
    description:
      "Operation and monitoring of gas production facilities. Planned maintenance with budget responsibility. Part of safety organization handling risk assessments, fire protection, and systematic work environment management. Safety representative 2019–2023. Extensive customer contact. On leave since 2023.",
    startDate: "2005-01-01",
    endDate: null,
    tech: ["Process Control", "SCADA", "Safety Systems"],
    sortOrder: 0,
  },
  {
    company: "Amnesty International",
    role: "Communications / Member Relations",
    description:
      "Member communications and outreach. Training in international law and human rights.",
    startDate: "2013-01-01",
    endDate: "2014-01-01",
    tech: [],
    sortOrder: 1,
  },
  {
    company: "Lärarjouren",
    role: "Substitute Teacher",
    description:
      "Teaching across primary school, secondary school, adult education, and language introduction for newcomers. Subjects included science, technology, mathematics, languages, and social studies.",
    startDate: "2013-09-01",
    endDate: "2014-07-01",
    tech: [],
    sortOrder: 2,
  },
];

const seedEducation = [
  {
    institution: "Linnaeus University",
    degree: "Bachelor of Science",
    field: "Computer Science / Web Programming",
    startDate: "2023-09-01",
    endDate: "2026-06-01",
    description:
      'Full stack web development with specialization in software quality, cloud infrastructure, databases, algorithms, security, and AI/web intelligence. Thesis: "Individually Adapted AI-Generated Code Documentation and Its Effects on Developer Understanding".',
    sortOrder: 0,
  },
  {
    institution: "Blekinge Institute of Technology",
    degree: "Courses",
    field: "Computer Science",
    startDate: "2021-01-01",
    endDate: "2022-12-01",
    description:
      "Courses in computer science: Python, web technologies, databases.",
    sortOrder: 1,
  },
  {
    institution: "IT-Högskolan / Nackademin",
    degree: "Courses",
    field: "Computer Science",
    startDate: "2021-01-01",
    endDate: "2021-06-01",
    description:
      "Java, OOP, data structures and algorithms, recursion, debugging. Network technology and protocols, system administration.",
    sortOrder: 2,
  },
  {
    institution: "Södertörn University",
    degree: "Bachelor of Arts",
    field: "Humanities & Journalism",
    startDate: "2008-09-01",
    endDate: "2011-06-01",
    description:
      "Gender Studies 90 credits, Journalism 60 credits, Ethnology 30 credits.",
    sortOrder: 3,
  },
];

const seedProfile = {
  name: "Mattias Ubbesen",
  title: "Full Stack Developer",
  bio: "Web developer and computer science student based in Stockholm. Broad technical competence in web production, API design, cloud infrastructure, and AI/LLM integration. Background from process industry with responsibility for safety-critical operations, and experience in teaching and communication.",
  location: "Stockholm, Sweden",
  email: "hello@mattiasubbesen.com",
  github: "https://github.com/legitmattias",
  linkedin: "https://linkedin.com/in/mattias-ubbesen",
  website: "https://mattiasubbesen.com",
};

// Swedish translations for placeholder content
// Uses natural Swedish tech language — English terms kept where standard in Swedish IT
const svTranslations: {
  entityType: string;
  slug: string; // used to find entity ID
  field: string;
  value: string;
  translatedBy: "human" | "llm";
}[] = [
  // Projects
  {
    entityType: "project",
    slug: "curios",
    field: "description",
    value:
      "Portfolio-OS — en webbläsarbaserad skrivbordsmiljö som visar upp riktiga, backend-drivna applikationer. Innehåller fönsterhanterare, filutforskare, terminal och systemövervakning.",
    translatedBy: "human",
  },
  {
    entityType: "project",
    slug: "dossier",
    field: "description",
    value:
      "Strukturerat kunskapsprofil-system som driver AI-chatbotar med korrekta, källbaserade svar. Använder LLM och RAG för att omvandla personlig data till konversationsbaserad kunskap.",
    translatedBy: "human",
  },
  // Profile
  {
    entityType: "profile",
    slug: "_profile",
    field: "title",
    value: "Fullstackutvecklare",
    translatedBy: "human",
  },
  {
    entityType: "profile",
    slug: "_profile",
    field: "bio",
    value:
      "Webbutvecklare och datavetenskapsstudent baserad i Stockholm. Bred teknisk kompetens inom webbproduktion, API-design, molninfrastruktur och AI/LLM-integration. Bakgrund från processindustrin med ansvar för säkerhetskritisk drift, samt erfarenhet av undervisning och kommunikation.",
    translatedBy: "human",
  },
  // Experience
  {
    entityType: "experience",
    slug: "Linde Gas",
    field: "role",
    value: "Processtekniker",
    translatedBy: "human",
  },
  {
    entityType: "experience",
    slug: "Linde Gas",
    field: "description",
    value:
      "Drift och övervakning av gasproduktionsanläggningar. Planerat underhåll med budget- och kostnadsansvar. Del av skyddsorganisation med ansvar för riskbedömningar, brandskydd och systematiskt arbetsmiljöarbete. Skyddsombud 2019–2023. Omfattande kundkontakt. Tjänstledig sedan 2023.",
    translatedBy: "human",
  },
  {
    entityType: "experience",
    slug: "Amnesty International",
    field: "role",
    value: "Kommunikatör/Medlemsvård",
    translatedBy: "human",
  },
  {
    entityType: "experience",
    slug: "Amnesty International",
    field: "description",
    value:
      "Medlemskommunikation. Utbildning i internationell rätt och mänskliga rättigheter.",
    translatedBy: "human",
  },
  {
    entityType: "experience",
    slug: "Lärarjouren",
    field: "role",
    value: "Lärarvikarie",
    translatedBy: "human",
  },
  {
    entityType: "experience",
    slug: "Lärarjouren",
    field: "description",
    value:
      "Arbete som lärarvikarie inom grundskola, gymnasiet, vuxenutbildning och språkintroduktion för nyanlända. Inom naturvetenskap, teknik, matematik, språk, samhällsvetenskap m.fl.",
    translatedBy: "human",
  },
  // Education
  {
    entityType: "education",
    slug: "Linnaeus University",
    field: "institution",
    value: "Linnéuniversitetet",
    translatedBy: "human",
  },
  {
    entityType: "education",
    slug: "Linnaeus University",
    field: "degree",
    value: "Fil.kand.",
    translatedBy: "human",
  },
  {
    entityType: "education",
    slug: "Linnaeus University",
    field: "field",
    value: "Datavetenskap / Webbprogrammerare",
    translatedBy: "human",
  },
  {
    entityType: "education",
    slug: "Linnaeus University",
    field: "description",
    value:
      'Fullstack-webbutveckling med fördjupning i mjukvarukvalitet, molninfrastruktur, databaser, algoritmer, datasäkerhet och AI/webbintelligens. Examensarbete: "Individually Adapted AI-Generated Code Documentation and Its Effects on Developer Understanding".',
    translatedBy: "human",
  },
  {
    entityType: "education",
    slug: "Blekinge Institute of Technology",
    field: "institution",
    value: "Blekinge tekniska högskola",
    translatedBy: "human",
  },
  {
    entityType: "education",
    slug: "Blekinge Institute of Technology",
    field: "description",
    value: "Kurser i datavetenskap: Python, webbteknologier, databaser.",
    translatedBy: "human",
  },
  {
    entityType: "education",
    slug: "IT-Högskolan / Nackademin",
    field: "description",
    value:
      "Java, OOP, datastrukturer och algoritmer, rekursion, debugging. Nätverksteknik och -protokoll, systemadministration.",
    translatedBy: "human",
  },
  {
    entityType: "education",
    slug: "Södertörn University",
    field: "institution",
    value: "Södertörns högskola",
    translatedBy: "human",
  },
  {
    entityType: "education",
    slug: "Södertörn University",
    field: "degree",
    value: "Fil.kand.",
    translatedBy: "human",
  },
  {
    entityType: "education",
    slug: "Södertörn University",
    field: "field",
    value: "Humaniora och journalistik",
    translatedBy: "human",
  },
  {
    entityType: "education",
    slug: "Södertörn University",
    field: "description",
    value: "Genusvetenskap 90 hp, journalistik 60 hp och etnologi 30 hp.",
    translatedBy: "human",
  },
];

async function seed() {
  console.log("Seeding database...");

  // Projects: upsert by slug (unique constraint)
  await db
    .insert(projects)
    .values(seedProjects)
    .onConflictDoNothing({ target: projects.slug });
  console.log(`  Projects: ${seedProjects.length} (upsert)`);

  // All other tables: only seed if empty
  const existingSkills = await db.select().from(skills).limit(1);
  if (existingSkills.length === 0) {
    await db.insert(skills).values(seedSkills);
    console.log(`  Skills: ${seedSkills.length} inserted`);
  } else {
    console.log(`  Skills: skipped (already has data)`);
  }

  const existingExperience = await db.select().from(experience).limit(1);
  if (existingExperience.length === 0) {
    await db.insert(experience).values(seedExperience);
    console.log(`  Experience: ${seedExperience.length} inserted`);
  } else {
    console.log(`  Experience: skipped (already has data)`);
  }

  const existingEducation = await db.select().from(education).limit(1);
  if (existingEducation.length === 0) {
    await db.insert(education).values(seedEducation);
    console.log(`  Education: ${seedEducation.length} inserted`);
  } else {
    console.log(`  Education: skipped (already has data)`);
  }

  const existingProfile = await db.select().from(profile).limit(1);
  if (existingProfile.length === 0) {
    await db.insert(profile).values(seedProfile);
    console.log(`  Profile: 1 inserted`);
  } else {
    console.log(`  Profile: skipped (already has data)`);
  }

  // Seed Swedish translations (idempotent via unique constraint upsert)
  await seedTranslations();

  console.log("Done.");
  process.exit(0);
}

async function seedTranslations() {
  // Build entity ID lookup by querying each table
  const allProjects = await db.select().from(projects);
  const allExperience = await db.select().from(experience);
  const allEducation = await db.select().from(education);
  const allProfile = await db.select().from(profile).limit(1);

  const projectIdBySlug = new Map(allProjects.map((p) => [p.slug, p.id]));
  const experienceIdByCompany = new Map(
    allExperience.map((e) => [e.company, e.id]),
  );
  const educationIdByInstitution = new Map(
    allEducation.map((e) => [e.institution, e.id]),
  );
  const profileId = allProfile[0]?.id;

  let count = 0;

  for (const t of svTranslations) {
    let entityId: string | undefined;

    if (t.entityType === "project") {
      entityId = projectIdBySlug.get(t.slug);
    } else if (t.entityType === "experience") {
      entityId = experienceIdByCompany.get(t.slug);
    } else if (t.entityType === "education") {
      entityId = educationIdByInstitution.get(t.slug);
    } else if (t.entityType === "profile") {
      entityId = profileId;
    }

    if (!entityId) {
      console.log(
        `  Translation: skipped ${t.entityType}/${t.slug}/${t.field} (entity not found)`,
      );
      continue;
    }

    await db
      .insert(translations)
      .values({
        entityType: t.entityType,
        entityId,
        locale: "sv",
        field: t.field,
        value: t.value,
        translatedBy: t.translatedBy,
      })
      .onConflictDoNothing();

    count++;
  }

  console.log(`  Translations: ${count} Swedish translations seeded`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
