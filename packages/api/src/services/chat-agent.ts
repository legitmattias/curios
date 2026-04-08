import Anthropic from '@anthropic-ai/sdk'
import { getDossierToolsForAnthropic, callDossierTool } from './dossier-client.js'
import { db } from '../db/index.js'
import { projects, experience, education } from '../db/schema.js'
import { asc } from 'drizzle-orm'

const MAX_MESSAGES_PER_SESSION = parseInt(process.env.CHAT_MAX_MESSAGES ?? '20', 10)

// Local CuriOS tools — query the local database directly
const LOCAL_TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: 'curios_list_projects',
    description: 'List all portfolio projects with titles, descriptions, and tech stacks',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'curios_list_experience',
    description: 'List work experience with roles, companies, dates, and descriptions',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'curios_list_education',
    description: 'List education background with degrees, institutions, and fields',
    input_schema: { type: 'object' as const, properties: {} },
  },
]

async function callLocalTool(name: string): Promise<string> {
  switch (name) {
    case 'curios_list_projects': {
      const rows = await db.select().from(projects)
      return JSON.stringify(rows.map(r => ({
        title: r.title, slug: r.slug, description: r.description,
        tech: r.tech, url: r.url, repo: r.repo,
      })))
    }
    case 'curios_list_experience': {
      const rows = await db.select().from(experience).orderBy(asc(experience.sortOrder))
      return JSON.stringify(rows.map(r => ({
        role: r.role, company: r.company, description: r.description,
        startDate: r.startDate, endDate: r.endDate, tech: r.tech,
      })))
    }
    case 'curios_list_education': {
      const rows = await db.select().from(education).orderBy(asc(education.sortOrder))
      return JSON.stringify(rows.map(r => ({
        degree: r.degree, field: r.field, institution: r.institution,
        startDate: r.startDate, endDate: r.endDate, description: r.description,
      })))
    }
    default:
      throw new Error(`Unknown local tool: ${name}`)
  }
}

const SYSTEM_PROMPT = `You are an AI assistant representing Mattias Ubbesen, a full stack developer and software engineering student based in Stockholm. You answer questions about Mattias' skills, experience, projects, and availability using real data from his Dossier profile.

Rules:
- NEVER fabricate, invent, or guess project names, company names, or specific experiences. If a tool call fails or returns no data, say "I wasn't able to retrieve that information right now" — never fill in with made-up content.
- Always use the available tools to look up accurate data before responding. Only state facts that come from tool results.
- If you don't have data for something, be honest and suggest the visitor check the File Explorer or contact Mattias directly.

Guidelines:
- Present Mattias in his best light while staying truthful. He is early in his career and actively building expertise through real projects and formal education.
- When asked about a technology Mattias hasn't used directly, highlight related skills he does have and his demonstrated ability to learn and apply new tools quickly.
- Frame skill levels positively: working knowledge means hands-on experience, proficiency means reliable capability. Frame early-career as someone who is hungry, building fast, and already producing real, deployed systems.
- Be conversational, confident, and professional. Show enthusiasm for the work without overselling.
- Keep responses SHORT and conversational — 2-3 short paragraphs maximum. Don't list every skill — highlight the most relevant ones and summarize the rest. Weave information into natural sentences, not bullet lists. A recruiter wants a quick impression, not a database dump.
- Speak in the same language as the visitor (detect from their message).`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatSession {
  messages: ChatMessage[]
  messageCount: number
}

export function createSession(): ChatSession {
  return { messages: [], messageCount: 0 }
}

export interface StreamCallbacks {
  onStatus: (status: string) => void
  onToolCall: (tool: string, status: 'calling' | 'done') => void
  onDelta: (text: string) => void
  onDone: () => void
  onError: (error: string) => void
}

export async function handleChatMessage(
  session: ChatSession,
  userMessage: string,
  callbacks: StreamCallbacks,
): Promise<void> {
  // Rate limiting
  session.messageCount++
  if (session.messageCount > MAX_MESSAGES_PER_SESSION) {
    callbacks.onError('rate_limit')
    return
  }

  // Add user message to history
  session.messages.push({ role: 'user', content: userMessage })

  callbacks.onStatus('thinking')

  try {
    const anthropic = new Anthropic()
    const dossierTools = await getDossierToolsForAnthropic()
    const tools = [...dossierTools, ...LOCAL_TOOLS]

    // Build messages for Anthropic API
    const apiMessages = session.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    // Initial API call
    let response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: apiMessages,
      tools: tools as Anthropic.Messages.Tool[],
      stream: false,
    })

    // Tool use loop — handle multiple tool calls
    while (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use',
      )

      const toolResults: Anthropic.Messages.ToolResultBlockParam[] = []

      for (const toolUse of toolUseBlocks) {
        callbacks.onToolCall(toolUse.name, 'calling')

        try {
          const result = toolUse.name.startsWith('curios_')
            ? await callLocalTool(toolUse.name)
            : await callDossierTool(toolUse.name, toolUse.input as Record<string, unknown>)
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: result,
          })
        } catch (err) {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
            is_error: true,
          })
        }

        callbacks.onToolCall(toolUse.name, 'done')
      }

      // Continue with tool results — this time stream the response
      const stream = anthropic.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          ...apiMessages,
          { role: 'assistant', content: response.content },
          { role: 'user', content: toolResults },
        ],
        tools: tools as Anthropic.Messages.Tool[],
      })

      let fullResponse = ''

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          callbacks.onDelta(event.delta.text)
          fullResponse += event.delta.text
        }
      }

      const finalMessage = await stream.finalMessage()
      response = finalMessage

      if (response.stop_reason !== 'tool_use') {
        // Done — save assistant response to history
        session.messages.push({ role: 'assistant', content: fullResponse })
        callbacks.onDone()
        return
      }
    }

    // No tool use — stream the initial response
    // This path handles when the LLM responds directly without tools
    const textBlocks = response.content.filter(
      (block): block is Anthropic.Messages.TextBlock => block.type === 'text',
    )
    const fullText = textBlocks.map((b) => b.text).join('')

    if (fullText) {
      callbacks.onDelta(fullText)
      session.messages.push({ role: 'assistant', content: fullText })
    }

    callbacks.onDone()
  } catch (err) {
    console.error('Chat agent error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    callbacks.onError(message)
  }
}
