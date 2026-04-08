import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { CvData } from '@curios/shared/types'

const PDF_LABELS = {
  en: {
    profile: 'Profile',
    experience: 'Experience',
    education: 'Education',
    skills: 'Skills',
    projects: 'Projects',
    present: 'Present',
    generatedFrom: 'Generated from',
  },
  sv: {
    profile: 'Profil',
    experience: 'Erfarenhet',
    education: 'Utbildning',
    skills: 'Kompetenser',
    projects: 'Projekt',
    present: 'Pågående',
    generatedFrom: 'Genererad från',
  },
} as const

const PAGE_WIDTH = 595.28 // A4
const PAGE_HEIGHT = 841.89
const MARGIN_TOP = 48
const MARGIN_BOTTOM = 36
const MARGIN_LEFT = 48
const MARGIN_RIGHT = 48

// Sidebar layout
const SIDEBAR_WIDTH = 145
const MAIN_X = MARGIN_LEFT + SIDEBAR_WIDTH + 18
const MAIN_WIDTH = PAGE_WIDTH - MAIN_X - MARGIN_RIGHT

const COLORS = {
  black: rgb(0.12, 0.12, 0.12),
  dark: rgb(0.22, 0.22, 0.22),
  body: rgb(0.3, 0.3, 0.3),
  gray: rgb(0.5, 0.5, 0.5),
  light: rgb(0.62, 0.62, 0.62),
  muted: rgb(0.75, 0.75, 0.75),
  accent: rgb(0.49, 0.36, 0.75),
  line: rgb(0.88, 0.88, 0.88),
  sidebarBg: rgb(0.965, 0.965, 0.975),
}

type Font = Awaited<ReturnType<InstanceType<typeof PDFDocument>['embedFont']>>
type Page = ReturnType<InstanceType<typeof PDFDocument>['addPage']>

interface DrawContext {
  page: Page
  fonts: { regular: Font; bold: Font; boldOblique: Font }
  y: number
}

function drawWrappedText(
  ctx: DrawContext,
  text: string,
  x: number,
  size: number,
  font: Font,
  color: ReturnType<typeof rgb>,
  maxWidth: number,
  lineHeight: number = size + 3,
): void {
  const words = text.split(' ')
  let line = ''

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word
    const width = font.widthOfTextAtSize(testLine, size)

    if (width > maxWidth && line) {
      ctx.page.drawText(line, { x, y: ctx.y, size, font, color })
      ctx.y -= lineHeight
      line = word
    } else {
      line = testLine
    }
  }

  if (line) {
    ctx.page.drawText(line, { x, y: ctx.y, size, font, color })
    ctx.y -= lineHeight
  }
}

function drawSectionTitle(ctx: DrawContext, title: string, x: number, width: number): void {
  ctx.y -= 10
  ctx.page.drawText(title.toUpperCase(), {
    x,
    y: ctx.y,
    size: 7.5,
    font: ctx.fonts.bold,
    color: COLORS.accent,
  })
  ctx.y -= 5
  ctx.page.drawLine({
    start: { x, y: ctx.y },
    end: { x: x + width, y: ctx.y },
    thickness: 0.6,
    color: COLORS.accent,
    opacity: 0.3,
  })
  ctx.y -= 9
}

function formatDate(date: string | null, presentLabel: string = 'Present'): string {
  if (!date) return presentLabel
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
}

export async function generateCvPdf(data: CvData, lang: 'en' | 'sv' = 'en'): Promise<Uint8Array> {
  const labels = PDF_LABELS[lang]
  const doc = await PDFDocument.create()
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const boldOblique = await doc.embedFont(StandardFonts.HelveticaBoldOblique)

  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  const fonts = { regular, bold, boldOblique }

  let y = PAGE_HEIGHT - MARGIN_TOP

  // ═══════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════

  // Accent bar
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 3,
    width: PAGE_WIDTH,
    height: 3,
    color: COLORS.accent,
  })

  // Name
  page.drawText(data.profile.name, {
    x: MARGIN_LEFT,
    y,
    size: 20,
    font: bold,
    color: COLORS.black,
  })
  y -= 17

  // Title
  page.drawText(data.profile.title, {
    x: MARGIN_LEFT,
    y,
    size: 10,
    font: regular,
    color: COLORS.accent,
  })
  y -= 13

  // Contact
  const contactItems = [data.profile.location, data.profile.email]
  if (data.profile.github) {
    contactItems.push(data.profile.github.replace('https://github.com/', 'github.com/'))
  }
  if (data.profile.linkedin) {
    contactItems.push(data.profile.linkedin.replace('https://linkedin.com/in/', 'linkedin.com/in/'))
  }
  if (data.profile.website) {
    contactItems.push(data.profile.website.replace('https://', ''))
  }

  page.drawText(contactItems.join('  ·  '), {
    x: MARGIN_LEFT,
    y,
    size: 7,
    font: regular,
    color: COLORS.gray,
  })
  y -= 10

  // Divider
  page.drawLine({
    start: { x: MARGIN_LEFT, y },
    end: { x: PAGE_WIDTH - MARGIN_RIGHT, y },
    thickness: 0.4,
    color: COLORS.line,
  })
  y -= 4

  const columnsStartY = y

  // ═══════════════════════════════════════════════════════
  // SIDEBAR — skills, education
  // ═══════════════════════════════════════════════════════

  // Sidebar background
  page.drawRectangle({
    x: MARGIN_LEFT - 6,
    y: MARGIN_BOTTOM - 6,
    width: SIDEBAR_WIDTH + 12,
    height: columnsStartY - MARGIN_BOTTOM + 12,
    color: COLORS.sidebarBg,
  })

  const sidebar: DrawContext = { page, fonts, y: columnsStartY }

  // ── Skills ──
  if (data.skills.length > 0) {
    drawSectionTitle(sidebar, labels.skills, MARGIN_LEFT, SIDEBAR_WIDTH)

    const groups: Record<string, string[]> = {}
    for (const skill of data.skills) {
      if (!groups[skill.category]) groups[skill.category] = []
      groups[skill.category].push(skill.name)
    }

    for (const [category, names] of Object.entries(groups)) {
      sidebar.page.drawText(category, {
        x: MARGIN_LEFT,
        y: sidebar.y,
        size: 7,
        font: bold,
        color: COLORS.dark,
      })
      sidebar.y -= 9

      for (const name of names) {
        sidebar.page.drawText(name, {
          x: MARGIN_LEFT + 3,
          y: sidebar.y,
          size: 7,
          font: regular,
          color: COLORS.body,
        })
        sidebar.y -= 9
      }
      sidebar.y -= 3
    }
  }

  // ── Education ──
  if (data.education.length > 0) {
    drawSectionTitle(sidebar, labels.education, MARGIN_LEFT, SIDEBAR_WIDTH)

    for (const edu of data.education) {
      sidebar.page.drawText(edu.degree, {
        x: MARGIN_LEFT,
        y: sidebar.y,
        size: 7.5,
        font: bold,
        color: COLORS.dark,
      })
      sidebar.y -= 9

      sidebar.page.drawText(edu.field, {
        x: MARGIN_LEFT,
        y: sidebar.y,
        size: 7,
        font: regular,
        color: COLORS.body,
      })
      sidebar.y -= 9

      sidebar.page.drawText(edu.institution, {
        x: MARGIN_LEFT,
        y: sidebar.y,
        size: 6.5,
        font: regular,
        color: COLORS.gray,
      })
      sidebar.y -= 8

      const period = `${formatDate(edu.startDate, labels.present)} — ${formatDate(edu.endDate, labels.present)}`
      sidebar.page.drawText(period, {
        x: MARGIN_LEFT,
        y: sidebar.y,
        size: 6.5,
        font: regular,
        color: COLORS.light,
      })
      sidebar.y -= 12
    }
  }

  // ═══════════════════════════════════════════════════════
  // MAIN COLUMN — profile, experience, projects
  // ═══════════════════════════════════════════════════════

  const main: DrawContext = { page, fonts, y: columnsStartY }

  // ── Profile ──
  drawSectionTitle(main, labels.profile, MAIN_X, MAIN_WIDTH)
  drawWrappedText(main, data.profile.bio, MAIN_X, 7.5, regular, COLORS.body, MAIN_WIDTH, 11)
  main.y -= 2

  // ── Experience ──
  if (data.experience.length > 0) {
    drawSectionTitle(main, labels.experience, MAIN_X, MAIN_WIDTH)

    for (const exp of data.experience) {
      // Role + dates
      main.page.drawText(exp.role, {
        x: MAIN_X,
        y: main.y,
        size: 8.5,
        font: bold,
        color: COLORS.black,
      })

      const dateStr = `${formatDate(exp.startDate, labels.present)} — ${formatDate(exp.endDate, labels.present)}`
      const dateWidth = regular.widthOfTextAtSize(dateStr, 7)
      main.page.drawText(dateStr, {
        x: MAIN_X + MAIN_WIDTH - dateWidth,
        y: main.y + 1,
        size: 7,
        font: regular,
        color: COLORS.light,
      })
      main.y -= 11

      // Company
      main.page.drawText(exp.company, {
        x: MAIN_X,
        y: main.y,
        size: 7.5,
        font: boldOblique,
        color: COLORS.accent,
      })
      main.y -= 10

      // Description
      drawWrappedText(main, exp.description, MAIN_X, 7, regular, COLORS.body, MAIN_WIDTH, 10)

      // Tech
      const techLine = exp.tech.join('  ·  ')
      main.page.drawText(techLine, {
        x: MAIN_X,
        y: main.y,
        size: 6.5,
        font: regular,
        color: COLORS.muted,
      })
      main.y -= 14
    }
  }

  // ── Projects ──
  if (data.projects.length > 0) {
    drawSectionTitle(main, labels.projects, MAIN_X, MAIN_WIDTH)

    const topProjects = data.projects.slice(0, 3)
    for (const project of topProjects) {
      main.page.drawText(project.title, {
        x: MAIN_X,
        y: main.y,
        size: 8,
        font: bold,
        color: COLORS.black,
      })
      main.y -= 10

      drawWrappedText(main, project.description, MAIN_X, 7, regular, COLORS.body, MAIN_WIDTH, 10)

      const techLine = project.tech.join('  ·  ')
      main.page.drawText(techLine, {
        x: MAIN_X,
        y: main.y,
        size: 6.5,
        font: regular,
        color: COLORS.muted,
      })
      main.y -= 13
    }
  }

  // ═══════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════

  const footerY = MARGIN_BOTTOM - 18
  page.drawLine({
    start: { x: MARGIN_LEFT, y: footerY + 8 },
    end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: footerY + 8 },
    thickness: 0.3,
    color: COLORS.line,
  })
  const dateLocale = lang === 'sv' ? 'sv-SE' : 'en-US'
  page.drawText(`${labels.generatedFrom} mattic.dev  ·  ${new Date().toLocaleDateString(dateLocale, { year: 'numeric', month: 'long' })}`, {
    x: MARGIN_LEFT,
    y: footerY,
    size: 6,
    font: regular,
    color: COLORS.muted,
  })

  return doc.save()
}
