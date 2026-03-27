import { readFileSync } from 'fs'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const raw = readFileSync('/root/.openclaw/openclaw.json', 'utf-8')
    const config = JSON.parse(raw)

    const defaultModel = config?.agents?.defaults?.model?.primary || 'anthropic/claude-sonnet-4-6'
    const agentList = config?.agents?.list || []

    const agents = agentList.map((a: Record<string, unknown>) => ({
      id: a.id,
      name: a.name,
      model: (a.model as string) || defaultModel,
      workspace: a.workspace,
      status: 'active',
    }))

    // Add Rahvi (owner) and structure
    const structured = [
      { id: 'rahvi', name: 'Rahvi', model: 'human', workspace: null, status: 'owner', role: 'Founder' },
      { id: 'yugo-prime', name: 'Yugo Prime', model: defaultModel, workspace: '/root/.openclaw/workspace/agents/yugo-prime', status: 'active', role: 'CEO & Orchestrator' },
      ...agents.filter((a: { id: string }) => a.id !== 'yugo-prime').map((a: { id: string; name: string; model: string; workspace: unknown; status: string }) => ({
        ...a,
        role: getRoleById(a.id),
      })),
    ]

    return NextResponse.json({ agents: structured, defaultModel })
  } catch (error) {
    return NextResponse.json({ agents: [], error: String(error) }, { status: 500 })
  }
}

function getRoleById(id: string): string {
  const roles: Record<string, string> = {
    jarvis: 'CTO — Infrastructure',
    nexus: 'COO — Operations',
    nova: 'CMO — Marketing',
    ruel: 'CFO — Finance & Trading',
    mastermind: 'CIO — Research',
    amalia: 'CoS — Personal & Wellbeing',
    builder: 'Dev Agent (under Jarvis)',
  }
  return roles[id] || 'Agent'
}
