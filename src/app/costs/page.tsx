import { DollarSign, TrendingUp, Cpu, Users, AlertTriangle } from 'lucide-react'

const BASE_URL = process.env.INTERNAL_URL || 'http://localhost:3000'
const COSTS_COLOR = '#22C55E'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrendEntry {
  date: string
  total: number
  topAgent: string
  topModel: string
}

interface CostsData {
  todaySpend: number
  agentCosts: Record<string, number>
  modelCosts: Record<string, { cost: number; tokens: number }>
  trend: TrendEntry[]
  gatewayError: string | null
  sessionCount: number
}

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function getCostsData(): Promise<CostsData> {
  try {
    const res = await fetch(`${BASE_URL}/api/costs`, { cache: 'no-store' })
    if (res.ok) return res.json()
  } catch {
    // fall through
  }
  return {
    todaySpend: 0,
    agentCosts: {},
    modelCosts: {},
    trend: [],
    gatewayError: 'Failed to reach API',
    sessionCount: 0,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCost(n: number): string {
  if (n === 0) return '$0.00'
  if (n < 0.01) return `$${n.toFixed(4)}`
  return `$${n.toFixed(2)}`
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
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

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-8 rounded-lg"
      style={{ border: '1px dashed var(--mc-card-border)' }}
    >
      <Icon className="w-7 h-7 mb-2 opacity-25" style={{ color: 'var(--mc-text-muted)' }} />
      <p className="text-sm font-medium" style={{ color: 'var(--mc-text-muted)' }}>{message}</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CostsPage() {
  const { todaySpend, agentCosts, modelCosts, trend, gatewayError, sessionCount } = await getCostsData()

  const totalSpend = Object.values(agentCosts).reduce((a, b) => a + b, 0)

  const topAgents = Object.entries(agentCosts)
    .sort((a, b) => b[1] - a[1])

  const topModels = Object.entries(modelCosts)
    .filter(([, d]) => d.cost > 0 || d.tokens > 0)
    .sort((a, b) => b[1].cost - a[1].cost)

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">

      {/* Page heading */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${COSTS_COLOR}1e`, border: `1px solid ${COSTS_COLOR}40` }}
        >
          <DollarSign className="w-[18px] h-[18px]" style={{ color: COSTS_COLOR }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--mc-text-primary)' }}>
            Cost Tracker
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--mc-text-muted)' }}>
            API spend tracking and budget overview
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

      {/* ── Summary stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Today's Spend", value: formatCost(todaySpend), color: COSTS_COLOR },
          { label: 'Total Spend', value: formatCost(totalSpend), color: '#3b82f6' },
          { label: 'Sessions', value: String(sessionCount), color: '#6366f1' },
          { label: 'Avg per Session', value: sessionCount > 0 ? formatCost(totalSpend / sessionCount) : '$0.00', color: '#f59e0b' },
        ].map((stat) => (
          <div key={stat.label} className="mc-card flex items-center gap-3 p-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${stat.color}18`, border: `1px solid ${stat.color}30` }}
            >
              <DollarSign className="w-4 h-4" style={{ color: stat.color }} />
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

      {/* ── Cost by Agent + Cost by Model (2-col) ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Cost by Agent */}
        <div className="mc-card p-5">
          <SectionHeader icon={Users} label="Cost by Agent" color={COSTS_COLOR} />
          {topAgents.length === 0 ? (
            <EmptyState icon={Users} message="No agent cost data" />
          ) : (
            <div className="space-y-3">
              {topAgents.map(([agent, cost]) => {
                const pct = totalSpend > 0 ? (cost / totalSpend) * 100 : 0
                return (
                  <div key={agent}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium" style={{ color: 'var(--mc-text-primary)' }}>
                        {agent}
                      </span>
                      <span className="text-sm font-bold font-mono" style={{ color: COSTS_COLOR }}>
                        {formatCost(cost)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--mc-card-border)' }}>
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${Math.max(pct, cost > 0 ? 2 : 0)}%`, background: COSTS_COLOR }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Cost by Model */}
        <div className="mc-card p-5">
          <SectionHeader icon={Cpu} label="Cost by Model" color={COSTS_COLOR} />
          {topModels.length === 0 ? (
            <EmptyState icon={Cpu} message="No model cost data" />
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
                  <span className="text-sm font-bold font-mono" style={{ color: COSTS_COLOR }}>
                    {formatCost(data.cost)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Cost Trend ─────────────────────────────────────────────────────── */}
      <div className="mc-card p-5">
        <SectionHeader icon={TrendingUp} label="Cost Trend" color={COSTS_COLOR} />
        {trend.length === 0 ? (
          <EmptyState icon={TrendingUp} message="No trend data available" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--mc-card-border)' }}>
                  {['Date', 'Total', 'Top Agent', 'Top Model'].map((h) => (
                    <th
                      key={h}
                      className="text-left py-2 pr-6 font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trend.map((row) => (
                  <tr key={row.date} style={{ borderBottom: '1px solid var(--mc-card-border)' }}>
                    <td className="py-2 pr-6 font-mono" style={{ color: 'var(--mc-text-muted)' }}>
                      {row.date}
                    </td>
                    <td className="py-2 pr-6 font-mono font-bold" style={{ color: COSTS_COLOR }}>
                      {formatCost(row.total)}
                    </td>
                    <td className="py-2 pr-6" style={{ color: 'var(--mc-text-primary)' }}>
                      {row.topAgent}
                    </td>
                    <td className="py-2 font-mono" style={{ color: 'var(--mc-text-muted)' }}>
                      {row.topModel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
