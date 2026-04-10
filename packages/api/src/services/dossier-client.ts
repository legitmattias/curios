import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

// Read-only tools that are safe for visitor-facing chat
const ALLOWED_TOOLS = new Set([
  'dossier_list_skills',
  'dossier_list_goals',
  'dossier_list_interests',
  'dossier_export',
])

let client: Client | null = null
let cachedTools: Awaited<ReturnType<Client['listTools']>>['tools'] | null = null

function getMcpUrl(): string {
  const url = process.env.DOSSIER_MCP_URL
  if (!url) throw new Error('DOSSIER_MCP_URL environment variable is required')
  return url
}

function getMcpApiKey(): string {
  const key = process.env.DOSSIER_MCP_API_KEY
  if (!key) throw new Error('DOSSIER_MCP_API_KEY environment variable is required')
  return key
}

async function createClient(): Promise<Client> {
  const transport = new StreamableHTTPClientTransport(
    new URL(getMcpUrl()),
    {
      requestInit: {
        headers: {
          Authorization: `Bearer ${getMcpApiKey()}`,
        },
      },
    },
  )

  const newClient = new Client({ name: 'curios', version: '1.0.0' })
  await newClient.connect(transport)
  console.log('Connected to Dossier MCP server')
  return newClient
}

export async function getDossierClient(): Promise<Client> {
  if (client) {
    try {
      // Verify connection is still alive
      await client.listTools()
      return client
    } catch {
      console.log('Dossier MCP connection lost, reconnecting...')
      client = null
      cachedTools = null
    }
  }

  client = await createClient()
  return client
}

/**
 * Get the read-only tools available from Dossier.
 * Filters out write tools that visitors should not access.
 */
export async function getDossierTools() {
  if (cachedTools) return cachedTools

  const mcpClient = await getDossierClient()
  const result = await mcpClient.listTools()

  cachedTools = result.tools.filter((tool) => ALLOWED_TOOLS.has(tool.name))
  console.log(`Dossier tools loaded: ${cachedTools.map((t) => t.name).join(', ')}`)

  return cachedTools
}

/**
 * Execute a tool call against the Dossier MCP server.
 */
export async function callDossierTool(
  toolName: string,
  args: Record<string, unknown>,
): Promise<string> {
  if (!ALLOWED_TOOLS.has(toolName)) {
    throw new Error(`Tool '${toolName}' is not allowed`)
  }

  const mcpClient = await getDossierClient()
  const result = await mcpClient.callTool({ name: toolName, arguments: args })

  // MCP tool results are ContentPart arrays — extract text
  if (Array.isArray(result.content)) {
    return result.content
      .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
      .map((part) => part.text)
      .join('\n')
  }

  return String(result.content)
}

/**
 * Convert MCP tools to Anthropic tool format.
 */
export async function getDossierToolsForAnthropic() {
  const tools = await getDossierTools()

  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description ?? '',
    input_schema: tool.inputSchema as Record<string, unknown>,
  }))
}
