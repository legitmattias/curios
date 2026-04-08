import Anthropic from '@anthropic-ai/sdk'
import { getDossierToolsForAnthropic, callDossierTool } from './dossier-client.js'

const MAX_MESSAGES_PER_SESSION = parseInt(process.env.CHAT_MAX_MESSAGES ?? '20', 10)

const SYSTEM_PROMPT = `You are an AI assistant representing Mattias Ubbesen, a full stack developer and software engineering student based in Stockholm. You answer questions about Mattias' skills, experience, projects, and availability using real data from his Dossier profile.

Guidelines:
- Always use the available tools to look up accurate data before responding. Never guess or fabricate skills, experience, or qualifications.
- Present Mattias in his best light while staying truthful. He is early in his career and actively building expertise through real projects and formal education.
- When asked about a technology Mattias hasn't used directly, highlight related skills he does have and his demonstrated ability to learn and apply new tools quickly. His project portfolio shows he picks up and ships with new technologies effectively.
- Frame skill levels positively: working knowledge means hands-on experience, proficiency means reliable capability. Don't apologize for being early-career — frame it as someone who is hungry, building fast, and already producing real, deployed systems.
- Be conversational, confident, and professional. Show enthusiasm for the work without overselling.
- Keep responses concise — a few paragraphs at most. Visitors want quick, informative answers.
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
    const tools = await getDossierToolsForAnthropic()

    // Build messages for Anthropic API
    const apiMessages = session.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    // Initial API call
    let response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
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
          const result = await callDossierTool(
            toolUse.name,
            toolUse.input as Record<string, unknown>,
          )
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
        model: 'claude-sonnet-4-5-20250929',
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
    const message = err instanceof Error ? err.message : 'Unknown error'
    callbacks.onError(message)
  }
}
