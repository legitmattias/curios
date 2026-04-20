import { db } from "./index.js";
import { experience, education, profile, translations } from "./schema.js";
import { eq, and } from "drizzle-orm";

// Projects and skills are synced from Dossier — not seeded here.

const seedExperience = [
  {
    company: "Linde Gas",
    role: "Process Technician",
    description:
      "Operation and monitoring of gas production facilities, including varied gas analysis work and quality control. Planned maintenance with budget responsibility. Part of safety organization handling risk assessments, fire protection, and systematic work environment management. Safety representative 2019–2023. Extensive customer contact. On leave since 2023.",
    startDate: "2005-01-01",
    endDate: null,
    tech: ["Process Control", "SCADA", "Safety Systems", "Quality Assurance"],
    sortOrder: 0,
  },
  {
    company: "Alcontrol Laboratories",
    role: "Laboratory Assistant",
    description:
      "Analytical laboratory work in Nyköping and Linköping handling water, soil, and food samples with focus on environmental contaminants. Sample reception, preparation, instrument-based analysis, and documentation of results under regulated procedures.",
    startDate: "2002-01-01",
    endDate: "2003-12-01",
    tech: [
      "Laboratory Analysis",
      "Environmental Monitoring",
      "Quality Control",
      "Scientific Documentation",
    ],
    sortOrder: 1,
  },
  {
    company: "Amnesty International",
    role: "Communications / Member Relations",
    description:
      "Member communications and outreach. Training in international law and human rights.",
    startDate: "2013-01-01",
    endDate: "2014-01-01",
    tech: [],
    sortOrder: 2,
  },
  {
    company: "Lärarjouren",
    role: "Substitute Teacher",
    description:
      "Teaching across primary school, secondary school, adult education, and language introduction for newcomers. Subjects included science, technology, mathematics, languages, and social studies.",
    startDate: "2013-09-01",
    endDate: "2014-07-01",
    tech: [],
    sortOrder: 3,
  },
  {
    company: "BRF Rågstacken",
    role: "Board Member",
    description:
      "Board member of housing cooperative. Part of the group responsible for property-related matters.",
    startDate: "2025-05-01",
    endDate: null,
    tech: [],
    sortOrder: 4,
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
  bio: "Web developer and computer science student based in Stockholm. Broad technical competence in web production, API design, cloud infrastructure, and AI/LLM integration. Background from process industry with responsibility for safety-critical operations, and experience in teaching and communication. Driver's license (B).",
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
  // Project translations are handled by the sync — not seeded here.
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
      "Webbutvecklare och datavetenskapsstudent baserad i Stockholm. Bred teknisk kompetens inom webbproduktion, API-design, molninfrastruktur och AI/LLM-integration. Bakgrund från processindustrin med ansvar för säkerhetskritisk drift, samt erfarenhet av undervisning och kommunikation. B-körkort.",
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
      "Drift och övervakning av gasproduktionsanläggningar, inklusive mångsidigt gasanalysarbete och kvalitetskontroll. Planerat underhåll med budget- och kostnadsansvar. Del av skyddsorganisation med ansvar för riskbedömningar, brandskydd och systematiskt arbetsmiljöarbete. Skyddsombud 2019–2023. Omfattande kundkontakt. Tjänstledig sedan 2023.",
    translatedBy: "human",
  },
  {
    entityType: "experience",
    slug: "Alcontrol Laboratories",
    field: "role",
    value: "Laboratoriebiträde",
    translatedBy: "human",
  },
  {
    entityType: "experience",
    slug: "Alcontrol Laboratories",
    field: "description",
    value:
      "Laboratoriearbete inom miljöanalys i Nyköping och Linköping med hantering av vatten-, jord- och livsmedelsprover med fokus på miljöföroreningar. Provmottagning, preparering, analys och dokumentation enligt standardiserade rutiner.",
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
  {
    entityType: "experience",
    slug: "BRF Rågstacken",
    field: "role",
    value: "Styrelseledamot",
    translatedBy: "human",
  },
  {
    entityType: "experience",
    slug: "BRF Rågstacken",
    field: "description",
    value:
      "Styrelseledamot i bostadsrättsförening. Del av gruppen ansvarig för fastighetsfrågor.",
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

async function upsertByKey<T extends Record<string, unknown>>(
  table: Parameters<typeof db.insert>[0],
  items: T[],
  keyField: keyof T & string,
  tableRef: Record<string, unknown>,
  label: string,
) {
  let inserted = 0;
  let updated = 0;

  for (const item of items) {
    const keyCol = (tableRef as Record<string, unknown>)[
      keyField
    ] as Parameters<typeof eq>[0];
    const existing = await db
      .select()
      .from(table)
      .where(eq(keyCol, item[keyField] as string))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(table).values(item as Record<string, unknown>);
      inserted++;
    } else {
      const { [keyField]: _, ...updateFields } = item;
      await db
        .update(table)
        .set(updateFields as Record<string, unknown>)
        .where(eq(keyCol, item[keyField] as string));
      updated++;
    }
  }
  console.log(`  ${label}: ${inserted} inserted, ${updated} updated`);
}

async function seed() {
  console.log("Seeding database...");

  // Projects and skills are synced from Dossier — not seeded.

  // Experience: upsert by company
  await upsertByKey(
    experience,
    seedExperience,
    "company",
    experience,
    "Experience",
  );

  // Education: upsert by institution
  await upsertByKey(
    education,
    seedEducation,
    "institution",
    education,
    "Education",
  );

  // Profile: upsert (single row)
  const existingProfile = await db.select().from(profile).limit(1);
  if (existingProfile.length === 0) {
    await db.insert(profile).values(seedProfile);
    console.log("  Profile: inserted");
  } else {
    await db
      .update(profile)
      .set(seedProfile)
      .where(eq(profile.id, existingProfile[0].id));
    console.log("  Profile: updated");
  }

  // Swedish translations (idempotent via unique constraint)
  await seedTranslations();

  console.log("Done.");
  process.exit(0);
}

async function seedTranslations() {
  // Build entity ID lookup by querying each table
  const allExperience = await db.select().from(experience);
  const allEducation = await db.select().from(education);
  const allProfile = await db.select().from(profile).limit(1);

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
      continue; // Project translations handled by sync
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
