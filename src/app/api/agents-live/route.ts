import { NextResponse } from 'next/server'

interface GatewaySession {
  id: string
  agent?: string
  agentId?: string
  model?: string
  status?: string
  tokens?: number
  inputTokens?: number
  outputTokens?: number
  cost?: number
  startedAt?: string
  endedAt?: string
  duration?: number
}

export async function GET() {
  let sessions: GatewaySession[] = []
  let gatewayError: string | null = null

  // Try OpenClaw gateway
  try {
    const res = await fetch('http://127.0.0.1:18789/api/sessions', {
      signal: AbortSignal.timeout(3000),
      headers: { Accept: 'application/json' },
    })
    if (res.ok) {
      const data = await res.json()
      sessions = Array.isArray(data) ? data : data.sessions ?? []
    } else {
      gatewayError = `Gateway returned ${res.status}`
    }
  } catch (err) {
    gatewayError = `Gateway unavailable: ${String(err).slice(0, 80)}`
  }

  // Aggregate by agent
  const agentCosts: Record<string, number> = {}
  const modelUsage: Record<string, { tokens: number; cost: number }> = {}

  for (const s of sessions) {
    const agent = s.agent ?? s.agentId ?? 'unknown'
    const model = s.model ?? 'unknown'
    const cost = s.cost ?? 0
    const tokens = (s.inputTokens ?? 0) + (s.outputTokens ?? 0) + (s.tokens ?? 0)

    agentCosts[agent] = (agentCosts[agent] ?? 0) + cost
    if (!modelUsage[model]) modelUsage[model] = { tokens: 0, cost: 0 }
    modelUsage[model].tokens += tokens
    modelUsage[model].cost += cost
  }

  const active = sessions.filter((s) => !s.status || s.status === 'running' || s.status === 'active')
  const history = sessions
    .filter((s) => s.status === 'done' || s.status === 'completed' || s.status === 'error')
    .slice(0, 10)

  return NextResponse.json({
    active,
    history,
    agentCosts,
    modelUsage,
    gatewayError,
    total: sessions.length,
  })
}
