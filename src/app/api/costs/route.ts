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
}

const KNOWN_AGENTS = ['yugo-prime', 'jarvis', 'nexus', 'nova', 'ruel', 'mastermind', 'amalia']
const KNOWN_MODELS = ['claude-sonnet-4-6', 'claude-opus-4-6', 'claude-haiku-4-5', 'gpt-4o', 'gpt-5.4']

export async function GET() {
  let sessions: GatewaySession[] = []
  let gatewayError: string | null = null

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

  // Today filter
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const todaySessions = sessions.filter((s) => {
    const t = s.startedAt ? new Date(s.startedAt) : null
    return t && t >= todayStart
  })

  const todaySpend = todaySessions.reduce((sum, s) => sum + (s.cost ?? 0), 0)

  // Cost by agent
  const agentCosts: Record<string, number> = {}
  for (const agent of KNOWN_AGENTS) agentCosts[agent] = 0
  for (const s of sessions) {
    const agent = s.agent ?? s.agentId ?? 'unknown'
    agentCosts[agent] = (agentCosts[agent] ?? 0) + (s.cost ?? 0)
  }

  // Cost by model
  const modelCosts: Record<string, { cost: number; tokens: number }> = {}
  for (const m of KNOWN_MODELS) modelCosts[m] = { cost: 0, tokens: 0 }
  for (const s of sessions) {
    const model = s.model ?? 'unknown'
    if (!modelCosts[model]) modelCosts[model] = { cost: 0, tokens: 0 }
    modelCosts[model].cost += s.cost ?? 0
    modelCosts[model].tokens +=
      (s.inputTokens ?? 0) + (s.outputTokens ?? 0) + (s.tokens ?? 0)
  }

  // Cost trend (group by date)
  const byDate: Record<string, { total: number; topAgent: string; topModel: string; agentTotals: Record<string, number>; modelTotals: Record<string, number> }> = {}
  for (const s of sessions) {
    const date = s.startedAt ? s.startedAt.slice(0, 10) : 'unknown'
    if (!byDate[date]) byDate[date] = { total: 0, topAgent: '', topModel: '', agentTotals: {}, modelTotals: {} }
    const entry = byDate[date]
    const cost = s.cost ?? 0
    entry.total += cost
    const agent = s.agent ?? s.agentId ?? 'unknown'
    const model = s.model ?? 'unknown'
    entry.agentTotals[agent] = (entry.agentTotals[agent] ?? 0) + cost
    entry.modelTotals[model] = (entry.modelTotals[model] ?? 0) + cost
  }
  const trend = Object.entries(byDate)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7)
    .map(([date, d]) => {
      const topAgent = Object.entries(d.agentTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
      const topModel = Object.entries(d.modelTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
      return { date, total: d.total, topAgent, topModel }
    })

  return NextResponse.json({
    todaySpend,
    agentCosts,
    modelCosts,
    trend,
    gatewayError,
    sessionCount: sessions.length,
  })
}
