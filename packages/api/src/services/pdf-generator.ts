import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { CvData } from '@curios/shared/types'

const PAGE_WIDTH = 595.28 // A4
const PAGE_HEIGHT = 841.89
const MARGIN_TOP = 60
const MARGIN_BOTTOM = 50
const MARGIN_LEFT = 55
const MARGIN_RIGHT = 55
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT

// Sidebar layout
const SIDEBAR_WIDTH = 155
const MAIN_X = MARGIN_LEFT + SIDEBAR_WIDTH + 20
const MAIN_WIDTH = PAGE_WIDTH - MAIN_X - MARGIN_RIGHT

const COLORS = {
  black: rgb(0.12, 0.12, 0.12),
  dark: rgb(0.22, 0.22, 0.22),
  body: rgb(0.3, 0.3, 0.3),
  gray: rgb(0.5, 0.5, 0.5),
  light: rgb(0.62, 0.62, 0.62),
  muted: rgb(0.75, 0.75, 0.75),
  accent: rgb(0.49, 0.36, 0.75),
  accentLight: rgb(0.49, 0.36, 0.75, 0.15),
  line: rgb(0.88, 0.88, 0.88),
  sidebarBg: rgb(0.965, 0.965, 0.975),
}

type Font = Awaited<ReturnType<InstanceType<typeof PDFDocument>['embedFont']>>
type Page = ReturnType<InstanceType<typeof PDFDocument>['addPage']>

interface DrawContext {
  doc: InstanceType<typeof PDFDocument>
  page: Page
  fonts: { regular: Font; bold: Font; boldOblique: Font }
  y: number
}

function newPage(ctx: DrawContext): void {
  ctx.page = ctx.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  ctx.y = PAGE_HEIGHT - MARGIN_TOP
}

function ensureSpace(ctx: DrawContext, needed: number): void {
  if (ctx.y - needed < MARGIN_BOTTOM) {
    newPage(ctx)
  }
}

function drawWrappedText(
  ctx: DrawContext,
  text: string,
  x: number,
  size: number,
  font: Font,
  color: ReturnType<typeof rgb>,
  maxWidth: number,
  lineHeight: number = size + 4,
): void {
  const words = text.split(' ')
  let line = ''

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word
    const width = font.widthOfTextAtSize(testLine, size)

    if (width > maxWidth && line) {
      ensureSpace(ctx, lineHeight)
      ctx.page.drawText(line, { x, y: ctx.y, size, font, color })
      ctx.y -= lineHeight
      line = word
    } else {
      line = testLine
    }
  }

  if (line) {
    ensureSpace(ctx, lineHeight)
    ctx.page.drawText(line, { x, y: ctx.y, size, font, color })
    ctx.y -= lineHeight
  }
}

function drawSectionTitle(ctx: DrawContext, title: string, x: number): void {
  ensureSpace(ctx, 28)
  ctx.y -= 14

  ctx.page.drawText(title.toUpperCase(), {
    x,
    y: ctx.y,
    size: 8.5,
    font: ctx.fonts.bold,
    color: COLORS.accent,
  })
  ctx.y -= 6
  ctx.page.drawLine({
    start: { x, y: ctx.y },
    end: { x: x + (x === MAIN_X ? MAIN_WIDTH : SIDEBAR_WIDTH), y: ctx.y },
    thickness: 0.75,
    color: COLORS.accent,
    opacity: 0.3,
  })
  ctx.y -= 12
}

function formatDate(date: string | null): string {
  if (!date) return 'Present'
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
}

export async function generateCvPdf(data: CvData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const boldOblique = await doc.embedFont(StandardFonts.HelveticaBoldOblique)

  const ctx: DrawContext = {
    doc,
    page: doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    fonts: { regular, bold, boldOblique },
    y: PAGE_HEIGHT - MARGIN_TOP,
  }

  // ═══════════════════════════════════════════════════════
  // HEADER — full width, top of page
  // ═══════════════════════════════════════════════════════

  // Accent bar at very top
  ctx.page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 4,
    width: PAGE_WIDTH,
    height: 4,
    color: COLORS.accent,
  })

  // Name
  ctx.page.drawText(data.profile.name, {
    x: MARGIN_LEFT,
    y: ctx.y,
    size: 24,
    font: bold,
    color: COLORS.black,
  })
  ctx.y -= 20

  // Title
  ctx.page.drawText(data.profile.title, {
    x: MARGIN_LEFT,
    y: ctx.y,
    size: 11,
    font: regular,
    color: COLORS.accent,
  })
  ctx.y -= 16

  // Contact line
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

  ctx.page.drawText(contactItems.join('  ·  '), {
    x: MARGIN_LEFT,
    y: ctx.y,
    size: 7.5,
    font: regular,
    color: COLORS.gray,
  })
  ctx.y -= 12

  // Header divider
  ctx.page.drawLine({
    start: { x: MARGIN_LEFT, y: ctx.y },
    end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: ctx.y },
    thickness: 0.5,
    color: COLORS.line,
  })
  ctx.y -= 16

  // Save the Y position where the two-column layout starts
  const columnsStartY = ctx.y

  // ═══════════════════════════════════════════════════════
  // LEFT SIDEBAR — contact, skills, education
  // ═══════════════════════════════════════════════════════

  // Subtle sidebar background
  ctx.page.drawRectangle({
    x: MARGIN_LEFT - 8,
    y: MARGIN_BOTTOM,
    width: SIDEBAR_WIDTH + 16,
    height: columnsStartY - MARGIN_BOTTOM + 8,
    color: COLORS.sidebarBg,
    borderWidth: 0,
  })

  const sidebarCtx = { ...ctx, y: columnsStartY }

  // ── Skills ──
  if (data.skills.length > 0) {
    drawSectionTitle(sidebarCtx, 'Skills', MARGIN_LEFT)
    ctx.page = sidebarCtx.page // sync page reference

    const groups: Record<string, string[]> = {}
    for (const skill of data.skills) {
      if (!groups[skill.category]) groups[skill.category] = []
      groups[skill.category].push(skill.name)
    }

    for (const [category, names] of Object.entries(groups)) {
      ensureSpace(sidebarCtx, 24)
      sidebarCtx.page.drawText(category, {
        x: MARGIN_LEFT,
        y: sidebarCtx.y,
        size: 7.5,
        font: bold,
        color: COLORS.dark,
      })
      sidebarCtx.y -= 11

      for (const name of names) {
        ensureSpace(sidebarCtx, 11)
        sidebarCtx.page.drawText(name, {
          x: MARGIN_LEFT + 4,
          y: sidebarCtx.y,
          size: 7.5,
          font: regular,
          color: COLORS.body,
        })
        sidebarCtx.y -= 11
      }
      sidebarCtx.y -= 4
    }
  }

  // ── Education ──
  if (data.education.length > 0) {
    drawSectionTitle(sidebarCtx, 'Education', MARGIN_LEFT)

    for (const edu of data.education) {
      ensureSpace(sidebarCtx, 40)
      sidebarCtx.page.drawText(edu.degree, {
        x: MARGIN_LEFT,
        y: sidebarCtx.y,
        size: 8,
        font: bold,
        color: COLORS.dark,
      })
      sidebarCtx.y -= 11

      sidebarCtx.page.drawText(edu.field, {
        x: MARGIN_LEFT,
        y: sidebarCtx.y,
        size: 7.5,
        font: regular,
        color: COLORS.body,
      })
      sidebarCtx.y -= 11

      sidebarCtx.page.drawText(edu.institution, {
        x: MARGIN_LEFT,
        y: sidebarCtx.y,
        size: 7,
        font: regular,
        color: COLORS.gray,
      })
      sidebarCtx.y -= 10

      const period = `${formatDate(edu.startDate)} — ${formatDate(edu.endDate)}`
      sidebarCtx.page.drawText(period, {
        x: MARGIN_LEFT,
        y: sidebarCtx.y,
        size: 7,
        font: regular,
        color: COLORS.light,
      })
      sidebarCtx.y -= 14
    }
  }

  // ═══════════════════════════════════════════════════════
  // MAIN COLUMN — about, experience, projects
  // ═══════════════════════════════════════════════════════

  const mainCtx = { ...ctx, y: columnsStartY }

  // ── About ──
  drawSectionTitle(mainCtx, 'Profile', MAIN_X)
  drawWrappedText(mainCtx, data.profile.bio, MAIN_X, 8.5, regular, COLORS.body, MAIN_WIDTH, 13)
  mainCtx.y -= 4

  // ── Experience ──
  if (data.experience.length > 0) {
    drawSectionTitle(mainCtx, 'Experience', MAIN_X)

    for (const exp of data.experience) {
      ensureSpace(mainCtx, 55)

      // Role + dates on same line
      mainCtx.page.drawText(exp.role, {
        x: MAIN_X,
        y: mainCtx.y,
        size: 9.5,
        font: bold,
        color: COLORS.black,
      })

      const dateStr = `${formatDate(exp.startDate)} — ${formatDate(exp.endDate)}`
      const dateWidth = regular.widthOfTextAtSize(dateStr, 7.5)
      mainCtx.page.drawText(dateStr, {
        x: MAIN_X + MAIN_WIDTH - dateWidth,
        y: mainCtx.y + 1,
        size: 7.5,
        font: regular,
        color: COLORS.light,
      })
      mainCtx.y -= 13

      // Company
      mainCtx.page.drawText(exp.company, {
        x: MAIN_X,
        y: mainCtx.y,
        size: 8,
        font: boldOblique,
        color: COLORS.accent,
      })
      mainCtx.y -= 12

      // Description
      drawWrappedText(mainCtx, exp.description, MAIN_X, 8, regular, COLORS.body, MAIN_WIDTH, 12)

      // Tech tags
      const techLine = exp.tech.join('  ·  ')
      mainCtx.page.drawText(techLine, {
        x: MAIN_X,
        y: mainCtx.y,
        size: 7,
        font: regular,
        color: COLORS.muted,
      })
      mainCtx.y -= 18
    }
  }

  // ── Projects ──
  if (data.projects.length > 0) {
    drawSectionTitle(mainCtx, 'Projects', MAIN_X)

    for (const project of data.projects) {
      ensureSpace(mainCtx, 40)

      mainCtx.page.drawText(project.title, {
        x: MAIN_X,
        y: mainCtx.y,
        size: 9,
        font: bold,
        color: COLORS.black,
      })
      mainCtx.y -= 12

      drawWrappedText(mainCtx, project.description, MAIN_X, 8, regular, COLORS.body, MAIN_WIDTH, 12)

      const techLine = project.tech.join('  ·  ')
      mainCtx.page.drawText(techLine, {
        x: MAIN_X,
        y: mainCtx.y,
        size: 7,
        font: regular,
        color: COLORS.muted,
      })
      mainCtx.y -= 16
    }
  }

  // ═══════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════

  const footerY = MARGIN_BOTTOM - 20
  ctx.page.drawLine({
    start: { x: MARGIN_LEFT, y: footerY + 10 },
    end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: footerY + 10 },
    thickness: 0.3,
    color: COLORS.line,
  })
  ctx.page.drawText(`Generated from mattic.dev  ·  ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`, {
    x: MARGIN_LEFT,
    y: footerY,
    size: 6.5,
    font: regular,
    color: COLORS.muted,
  })

  return doc.save()
}
