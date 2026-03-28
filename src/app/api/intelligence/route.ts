import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ─── Static definitions ────────────────────────────────────────────────────

const AGENTS = [
  { id: 'agent-yugo-prime', name: 'yugo-prime', color: '#8B5CF6', label: 'Yugo Prime' },
  { id: 'agent-jarvis', name: 'jarvis', color: '#3B82F6', label: 'Jarvis' },
  { id: 'agent-nexus', name: 'nexus', color: '#10B981', label: 'Nexus' },
  { id: 'agent-nova', name: 'nova', color: '#EC4899', label: 'Nova' },
  { id: 'agent-ruel', name: 'ruel', color: '#F59E0B', label: 'Ruel' },
  { id: 'agent-mastermind', name: 'mastermind', color: '#F97316', label: 'Mastermind' },
  { id: 'agent-amalia', name: 'amalia', color: '#14B8A6', label: 'Amalia' },
]

const TOOLS = [
  { id: 'tool-openclaw', name: 'OpenClaw' },
  { id: 'tool-mission-control', name: 'Mission Control' },
  { id: 'tool-coolify', name: 'Coolify' },
  { id: 'tool-docker', name: 'Docker' },
  { id: 'tool-langfuse', name: 'Langfuse' },
  { id: 'tool-github', name: 'GitHub' },
  { id: 'tool-twelve-data', name: 'Twelve Data' },
  { id: 'tool-crucix', name: 'Crucix' },
  { id: 'tool-scrapling', name: 'Scrapling' },
  { id: 'tool-openviking', name: 'OpenViking' },
  { id: 'tool-gogcli', name: 'gogcli' },
  { id: 'tool-whatsapp', name: 'WhatsApp' },
  { id: 'tool-mnemo', name: 'Mnemo Cortex' },
]

const AGENT_TOOL_MAP: Record<string, string[]> = {
  'agent-yugo-prime': ['tool-openclaw', 'tool-mission-control'],
  'agent-jarvis': ['tool-coolify', 'tool-docker', 'tool-langfuse', 'tool-github'],
  'agent-ruel': ['tool-twelve-data', 'tool-crucix'],
  'agent-mastermind': ['tool-scrapling', 'tool-crucix', 'tool-openviking'],
  'agent-nova': [],
  'agent-nexus': ['tool-gogcli', 'tool-whatsapp'],
  'agent-amalia': ['tool-mnemo'],
}

// ─── Route ────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const [projects, ideas] = await Promise.all([
      prisma.project.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.researchIdea.findMany({ orderBy: { score: 'desc' } }),
    ])

    // ── Build nodes ────────────────────────────────────────────────────

    const agentNodes = AGENTS.map((a) => ({
      id: a.id,
      type: 'agentNode' as const,
      data: {
        nodeType: 'agent',
        label: a.label,
        name: a.name,
        color: a.color,
        description: `AI Agent — ${a.label}`,
      },
      position: { x: 0, y: 0 },
    }))

    const projectNodes = projects.map((p) => ({
      id: `project-${p.id}`,
      type: 'projectNode' as const,
      data: {
        nodeType: 'project',
        label: p.title,
        status: p.status,
        owner: p.owner,
        description: p.description ?? '',
        category: p.category ?? '',
        priority: p.priority,
      },
      position: { x: 0, y: 0 },
    }))

    const ideaNodes = ideas.map((idea) => ({
      id: `idea-${idea.id}`,
      type: 'ideaNode' as const,
      data: {
        nodeType: 'idea',
        label: idea.title,
        score: idea.score,
        status: idea.status,
        description: idea.snippet ?? '',
        decision: idea.decision ?? '',
      },
      position: { x: 0, y: 0 },
    }))

    const toolNodes = TOOLS.map((t) => ({
      id: t.id,
      type: 'toolNode' as const,
      data: {
        nodeType: 'tool',
        label: t.name,
        description: `Tool: ${t.name}`,
      },
      position: { x: 0, y: 0 },
    }))

    // ── Build edges ────────────────────────────────────────────────────

    const edges: Array<{
      id: string
      source: string
      target: string
      type: string
    }> = []

    // Agent → Project (owner match)
    for (const p of projects) {
      if (!p.owner) continue
      const ownerLower = p.owner.toLowerCase()
      const matchedAgent = AGENTS.find(
        (a) =>
          ownerLower.includes(a.name) ||
          a.name.includes(ownerLower.split(' ')[0])
      )
      if (matchedAgent) {
        edges.push({
          id: `e-${matchedAgent.id}-project-${p.id}`,
          source: matchedAgent.id,
          target: `project-${p.id}`,
          type: 'smoothstep',
        })
      }
    }

    // Mastermind → Idea (all ideas are mastermind's)
    for (const idea of ideas) {
      edges.push({
        id: `e-agent-mastermind-idea-${idea.id}`,
        source: 'agent-mastermind',
        target: `idea-${idea.id}`,
        type: 'smoothstep',
      })
    }

    // Agent → Tool
    for (const [agentId, toolIds] of Object.entries(AGENT_TOOL_MAP)) {
      for (const toolId of toolIds) {
        edges.push({
          id: `e-${agentId}-${toolId}`,
          source: agentId,
          target: toolId,
          type: 'smoothstep',
        })
      }
    }

    const highScoreIdeas = ideas.filter((i) => (i.score ?? 0) >= 7).length

    return NextResponse.json({
      nodes: [...agentNodes, ...projectNodes, ...ideaNodes, ...toolNodes],
      edges,
      stats: {
        nodeCount: agentNodes.length + projectNodes.length + ideaNodes.length + toolNodes.length,
        edgeCount: edges.length,
        highScoreIdeas,
      },
    })
  } catch (error) {
    console.error('Intelligence API error:', error)
    return NextResponse.json(
      { nodes: [], edges: [], stats: { nodeCount: 0, edgeCount: 0, highScoreIdeas: 0 }, error: String(error) },
      { status: 500 }
    )
  }
}
