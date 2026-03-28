import { Activity, Cpu, BarChart3, Clock, AlertTriangle } from 'lucide-react'

const BASE_URL = process.env.INTERNAL_URL || 'http://localhost:3000'
const AGENTS_COLOR = '#6366F1'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Session {
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

interface AgentsLiveData {
  active: Session[]
  history: Session[]
  agentCosts: Record<string, number>
  modelUsage: Record<string, { tokens: number; cost: number }>
  gatewayError: string | null
  total: number
}

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function getAgentsData(): Promise<AgentsLiveData> {
  try {
    const res = await fetch(`${BASE_URL}/api/agents-live`, { cache: 'no-store' })
    if (res.ok) return res.json()
  } catch {
    // fall through
  }
  return { active: [], history: [], agentCosts: {}, modelUsage: {}, gatewayError: 'Failed to reach API', total: 0 }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function formatCost(n: number): string {
  if (n === 0) return '$0.00'
  if (n < 0.01) return `$${n.toFixed(4)}`
  return `$${n.toFixed(2)}`
}

function formatDuration(ms?: number): string {
  if (!ms) return '—'
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return `${m}m ${s % 60}s`
}

function statusPill(status?: string) {
  const s = (status ?? 'running').toLowerCase()
  if (s === 'error' || s === 'failed') {
    return { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', color: '#f87171', label: 'ERROR' }
  }
  if (s === 'done' || s === 'completed') {
    return { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', color: '#4ade80', label: 'DONE' }
  }
  return { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', color: '#818cf8', label: 'RUNNING' }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <span className="text-sm font-semibold" style={{ color: 'var(--mc-text-primary)' }}>
        {label}
      </span>
    </div>
  )
}

function EmptyState({ icon: Icon, message, sub }: { icon: React.ElementType; message: string; sub?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-8 rounded-lg"
      style={{ border: '1px dashed var(--mc-card-border)' }}
    >
      <Icon className="w-7 h-7 mb-2 opacity-25" style={{ color: 'var(--mc-text-muted)' }} />
      <p className="text-sm font-medium" style={{ color: 'var(--mc-text-muted)' }}>{message}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--mc-text-muted)', opacity: 0.6 }}>{sub}</p>}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AgentsLivePage() {
  const { active, history, agentCosts, modelUsage, gatewayError, total } = await getAgentsData()

  const topAgents = Object.entries(agentCosts)
    .filter(([, cost]) => cost > 0)
    .sort((a, b) => b[1] - a[1])

  const topModels = Object.entries(modelUsage)
    .filter(([, d]) => d.tokens > 0 || d.cost > 0)
    .sort((a, b) => b[1].cost - a[1].cost)

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">

      {/* Page heading */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${AGENTS_COLOR}1e`, border: `1px solid ${AGENTS_COLOR}40` }}
        >
          <Activity className="w-[18px] h-[18px]" style={{ color: AGENTS_COLOR }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--mc-text-primary)' }}>
            Agents Live
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--mc-text-muted)' }}>
            Real-time agent sessions and resource usage
          </p>
        </div>
        {gatewayError && (
          <div
            className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#f87171',
            }}
          >
            <AlertTriangle className="w-3 h-3" />
            Gateway offline
          </div>
        )}
      </div>

      {/* ── Summary stats bar ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Sessions', value: String(total), color: AGENTS_COLOR },
          { label: 'Active Now', value: String(active.length), color: '#22c55e' },
          { label: 'Completed', value: String(history.length), color: '#94a3b8' },
          {
            label: 'Total Cost',
            value: formatCost(Object.values(agentCosts).reduce((a, b) => a + b, 0)),
            color: '#f59e0b',
          },
        ].map((stat) => (
          <div key={stat.label} className="mc-card flex items-center gap-3 p-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${stat.color}18`, border: `1px solid ${stat.color}30` }}
            >
              <Activity className="w-4 h-4" style={{ color: stat.color }} />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}>
                {stat.label}
              </div>
              <div className="text-base font-bold font-mono mt-0.5" style={{ color: stat.color }}>
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Active Sessions ────────────────────────────────────────────────── */}
      <div className="mc-card p-5">
        <SectionHeader icon={Activity} label="Active Sessions" color={AGENTS_COLOR} />
        {active.length === 0 ? (
          <EmptyState
            icon={Activity}
            message={gatewayError ? 'OpenClaw gateway unreachable' : 'No active sessions'}
            sub={gatewayError ?? 'Sessions will appear here when agents are running'}
          />
        ) : (
          <div className="space-y-2">
            {active.map((s) => {
              const pill = statusPill(s.status)
              const agentName = s.agent ?? s.agentId ?? 'unknown'
              const tokens = (s.inputTokens ?? 0) + (s.outputTokens ?? 0) + (s.tokens ?? 0)
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg"
                  style={{ background: 'var(--mc-card)', border: '1px solid var(--mc-card-border)' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold" style={{ color: 'var(--mc-text-primary)' }}>
                        {agentName}
                      </p>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: pill.bg, border: `1px solid ${pill.border}`, color: pill.color }}
                      >
                        {pill.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-mono" style={{ color: 'var(--mc-text-muted)' }}>
                        {s.model ?? '—'}
                      </span>
                      <span className="text-xs font-mono" style={{ color: 'var(--mc-text-muted)' }}>
                        {formatTokens(tokens)} tokens
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold font-mono" style={{ color: '#f59e0b' }}>
                      {formatCost(s.cost ?? 0)}
                    </p>
                    <p className="text-xs font-mono" style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}>
                      {formatDuration(s.duration)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Agent Cost + Model Usage (2-col) ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Agent Cost Summary */}
        <div className="mc-card p-5">
          <SectionHeader icon={BarChart3} label="Agent Cost Summary" color={AGENTS_COLOR} />
          {topAgents.length === 0 ? (
            <EmptyState icon={BarChart3} message="No cost data available" />
          ) : (
            <div className="space-y-3">
              {topAgents.map(([agent, cost]) => {
                const total = topAgents.reduce((s, [, c]) => s + c, 0)
                const pct = total > 0 ? (cost / total) * 100 : 0
                return (
                  <div key={agent}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium" style={{ color: 'var(--mc-text-primary)' }}>
                        {agent}
                      </span>
                      <span className="text-sm font-bold font-mono" style={{ color: AGENTS_COLOR }}>
                        {formatCost(cost)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--mc-card-border)' }}>
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%`, background: AGENTS_COLOR }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Model Usage */}
        <div className="mc-card p-5">
          <SectionHeader icon={Cpu} label="Model Usage" color={AGENTS_COLOR} />
          {topModels.length === 0 ? (
            <EmptyState icon={Cpu} message="No model usage data" />
          ) : (
            <div className="space-y-2">
              {topModels.map(([model, data]) => (
                <div
                  key={model}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: 'var(--mc-card)', border: '1px solid var(--mc-card-border)' }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--mc-text-primary)' }}>
                      {model}
                    </p>
                    <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--mc-text-muted)' }}>
                      {formatTokens(data.tokens)} tokens
                    </p>
                  </div>
                  <span className="text-sm font-bold font-mono" style={{ color: '#f59e0b' }}>
                    {formatCost(data.cost)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Session History ────────────────────────────────────────────────── */}
      <div className="mc-card p-5">
        <SectionHeader icon={Clock} label="Session History" color={AGENTS_COLOR} />
        {history.length === 0 ? (
          <EmptyState icon={Clock} message="No completed sessions" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--mc-card-border)' }}>
                  {['Agent', 'Model', 'Tokens', 'Cost', 'Duration', 'Status'].map((h) => (
                    <th
                      key={h}
                      className="text-left py-2 pr-4 font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((s) => {
                  const pill = statusPill(s.status)
                  const tokens = (s.inputTokens ?? 0) + (s.outputTokens ?? 0) + (s.tokens ?? 0)
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--mc-card-border)' }}>
                      <td className="py-2 pr-4 font-medium" style={{ color: 'var(--mc-text-primary)' }}>
                        {s.agent ?? s.agentId ?? '—'}
                      </td>
                      <td className="py-2 pr-4 font-mono" style={{ color: 'var(--mc-text-muted)' }}>
                        {s.model ?? '—'}
                      </td>
                      <td className="py-2 pr-4 font-mono" style={{ color: 'var(--mc-text-muted)' }}>
                        {formatTokens(tokens)}
                      </td>
                      <td className="py-2 pr-4 font-mono font-bold" style={{ color: '#f59e0b' }}>
                        {formatCost(s.cost ?? 0)}
                      </td>
                      <td className="py-2 pr-4 font-mono" style={{ color: 'var(--mc-text-muted)' }}>
                        {formatDuration(s.duration)}
                      </td>
                      <td className="py-2">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: pill.bg, border: `1px solid ${pill.border}`, color: pill.color }}
                        >
                          {pill.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
