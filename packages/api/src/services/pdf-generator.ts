import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { CvData } from '@curios/shared/types'

const PAGE_WIDTH = 595.28 // A4 width in points
const PAGE_HEIGHT = 841.89 // A4 height in points
const MARGIN = 50
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

const COLORS = {
  black: rgb(0.1, 0.1, 0.1),
  dark: rgb(0.2, 0.2, 0.2),
  gray: rgb(0.45, 0.45, 0.45),
  light: rgb(0.65, 0.65, 0.65),
  accent: rgb(0.49, 0.36, 0.75), // purple accent
  line: rgb(0.85, 0.85, 0.85),
}

interface DrawContext {
  doc: InstanceType<typeof PDFDocument>
  page: ReturnType<InstanceType<typeof PDFDocument>['addPage']>
  fonts: {
    regular: Awaited<ReturnType<InstanceType<typeof PDFDocument>['embedFont']>>
    bold: Awaited<ReturnType<InstanceType<typeof PDFDocument>['embedFont']>>
  }
  y: number
}

function newPage(ctx: DrawContext): void {
  ctx.page = ctx.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  ctx.y = PAGE_HEIGHT - MARGIN
}

function ensureSpace(ctx: DrawContext, needed: number): void {
  if (ctx.y - needed < MARGIN) {
    newPage(ctx)
  }
}

function drawSectionTitle(ctx: DrawContext, title: string): void {
  ensureSpace(ctx, 30)
  ctx.y -= 8
  ctx.page.drawText(title.toUpperCase(), {
    x: MARGIN,
    y: ctx.y,
    size: 10,
    font: ctx.fonts.bold,
    color: COLORS.accent,
  })
  ctx.y -= 4
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: MARGIN + CONTENT_WIDTH, y: ctx.y },
    thickness: 0.5,
    color: COLORS.line,
  })
  ctx.y -= 14
}

function drawWrappedText(
  ctx: DrawContext,
  text: string,
  size: number,
  font: DrawContext['fonts']['regular'],
  color: (typeof COLORS)[keyof typeof COLORS],
  maxWidth: number = CONTENT_WIDTH
): void {
  const words = text.split(' ')
  let line = ''

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word
    const width = font.widthOfTextAtSize(testLine, size)

    if (width > maxWidth && line) {
      ensureSpace(ctx, size + 4)
      ctx.page.drawText(line, { x: MARGIN, y: ctx.y, size, font, color })
      ctx.y -= size + 4
      line = word
    } else {
      line = testLine
    }
  }

  if (line) {
    ensureSpace(ctx, size + 4)
    ctx.page.drawText(line, { x: MARGIN, y: ctx.y, size, font, color })
    ctx.y -= size + 4
  }
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

  const ctx: DrawContext = {
    doc,
    page: doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    fonts: { regular, bold },
    y: PAGE_HEIGHT - MARGIN,
  }

  // ── Header ──
  ctx.page.drawText(data.profile.name.toUpperCase(), {
    x: MARGIN,
    y: ctx.y,
    size: 22,
    font: bold,
    color: COLORS.black,
  })
  ctx.y -= 22

  ctx.page.drawText(data.profile.title, {
    x: MARGIN,
    y: ctx.y,
    size: 12,
    font: regular,
    color: COLORS.accent,
  })
  ctx.y -= 18

  const contactParts = [
    data.profile.location,
    data.profile.email,
    data.profile.github,
  ]
  ctx.page.drawText(contactParts.join('  ·  '), {
    x: MARGIN,
    y: ctx.y,
    size: 8,
    font: regular,
    color: COLORS.gray,
  })
  ctx.y -= 20

  // ── About ──
  drawSectionTitle(ctx, 'About')
  drawWrappedText(ctx, data.profile.bio, 9, regular, COLORS.dark)
  ctx.y -= 6

  // ── Experience ──
  if (data.experience.length > 0) {
    drawSectionTitle(ctx, 'Experience')

    for (const exp of data.experience) {
      ensureSpace(ctx, 50)
      ctx.page.drawText(exp.role, {
        x: MARGIN,
        y: ctx.y,
        size: 10,
        font: bold,
        color: COLORS.black,
      })
      ctx.y -= 14

      const period = `${exp.company}  ·  ${formatDate(exp.startDate)} — ${formatDate(exp.endDate)}`
      ctx.page.drawText(period, {
        x: MARGIN,
        y: ctx.y,
        size: 8,
        font: regular,
        color: COLORS.gray,
      })
      ctx.y -= 14

      drawWrappedText(ctx, exp.description, 8.5, regular, COLORS.dark)

      const techLine = exp.tech.join(', ')
      ctx.page.drawText(techLine, {
        x: MARGIN,
        y: ctx.y,
        size: 7.5,
        font: regular,
        color: COLORS.light,
      })
      ctx.y -= 16
    }
  }

  // ── Education ──
  if (data.education.length > 0) {
    drawSectionTitle(ctx, 'Education')

    for (const edu of data.education) {
      ensureSpace(ctx, 40)
      ctx.page.drawText(`${edu.degree} in ${edu.field}`, {
        x: MARGIN,
        y: ctx.y,
        size: 10,
        font: bold,
        color: COLORS.black,
      })
      ctx.y -= 14

      const period = `${edu.institution}  ·  ${formatDate(edu.startDate)} — ${formatDate(edu.endDate)}`
      ctx.page.drawText(period, {
        x: MARGIN,
        y: ctx.y,
        size: 8,
        font: regular,
        color: COLORS.gray,
      })
      ctx.y -= 14

      if (edu.description) {
        drawWrappedText(ctx, edu.description, 8.5, regular, COLORS.dark)
      }
      ctx.y -= 4
    }
  }

  // ── Skills ──
  if (data.skills.length > 0) {
    drawSectionTitle(ctx, 'Skills')

    const groups: Record<string, string[]> = {}
    for (const skill of data.skills) {
      if (!groups[skill.category]) groups[skill.category] = []
      groups[skill.category].push(skill.name)
    }

    for (const [category, names] of Object.entries(groups)) {
      ensureSpace(ctx, 20)
      const line = `${category}:  ${names.join(',  ')}`
      ctx.page.drawText(line, {
        x: MARGIN,
        y: ctx.y,
        size: 8.5,
        font: regular,
        color: COLORS.dark,
        maxWidth: CONTENT_WIDTH,
      })
      ctx.y -= 14
    }
    ctx.y -= 4
  }

  // ── Projects ──
  if (data.projects.length > 0) {
    drawSectionTitle(ctx, 'Projects')

    for (const project of data.projects) {
      ensureSpace(ctx, 35)
      ctx.page.drawText(project.title, {
        x: MARGIN,
        y: ctx.y,
        size: 10,
        font: bold,
        color: COLORS.black,
      })
      ctx.y -= 14

      drawWrappedText(ctx, project.description, 8.5, regular, COLORS.dark)

      const techLine = project.tech.join(', ')
      ctx.page.drawText(techLine, {
        x: MARGIN,
        y: ctx.y,
        size: 7.5,
        font: regular,
        color: COLORS.light,
      })
      ctx.y -= 16
    }
  }

  return doc.save()
}
