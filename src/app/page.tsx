import { Badge } from '@/components/ui/badge'
import { Activity, Clock } from 'lucide-react'
import { getAgentColor } from '@/lib/agent-colors'

function formatRelativeTime(timestamp?: string): string {
  if (!timestamp) return ''
  const diff = Date.now() - new Date(timestamp).getTime()
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 23) return `${Math.floor(h / 24)}d ago`
  if (h > 0) return `${h}h ago`
  if (m > 0) return `${m}m ago`
  return 'just now'
}

const AGENT_DOT_COLORS: Record<string, string> = {
  'yugo-prime': '#a855f7',
  'jarvis': '#3b82f6',
  'ruel': '#f59e0b',
  'nova': '#ec4899',
  'nexus': '#22c55e',
  'amalia': '#14b8a6',
  'mastermind': '#f97316',
  'rahvi': '#94a3b8',
  'baril': '#06b6d4',
}

// Server-side fetches must use localhost (container can't reach itself via public domain)
const BASE_URL = process.env.INTERNAL_URL || 'http://localhost:3000'

async function getHealth() {
  try {
    const res = await fetch(`${BASE_URL}/api/health`, { cache: 'no-store' })
    return res.ok ? res.json() : { overall: 'unknown', services: [] }
  } catch {
    return { overall: 'unknown', services: [] }
  }
}

async function getGold() {
  try {
    const res = await fetch(`${BASE_URL}/api/gold`, { next: { revalidate: 60 } })
    return res.ok ? res.json() : { price: null }
  } catch {
    return { price: null }
  }
}

async function getCrons() {
  try {
    const res = await fetch(`${BASE_URL}/api/crons`, { cache: 'no-store' })
    return res.ok ? res.json() : { jobs: [] }
  } catch {
    return { jobs: [] }
  }
}

async function getActivity() {
  try {
    const res = await fetch(`${BASE_URL}/api/activity`, { cache: 'no-store' })
    if (!res.ok) return { entries: [] }
    const data = await res.json()
    return { entries: Array.isArray(data?.entries) ? data.entries : [] }
  } catch {
    return { entries: [] }
  }
}

async function getAgents() {
  try {
    const res = await fetch(`${BASE_URL}/api/agents`, { cache: 'no-store' })
    if (!res.ok) return { agents: [] }
    const data = await res.json()
    return { agents: Array.isArray(data?.agents) ? data.agents : [] }
  } catch {
    return { agents: [] }
  }
}

async function getBacklog() {
  try {
    const res = await fetch(`${BASE_URL}/api/backlog`, { cache: 'no-store' })
    return res.ok ? res.json() : { tasks: [] }
  } catch {
    return { tasks: [] }
  }
}

function getNextCron(jobs: Array<{ nextRunAt?: string | null; name: string; enabled: boolean }>) {
  const now = Date.now()
  const upcoming = jobs
    .filter(j => j.enabled && j.nextRunAt)
    .map(j => ({ ...j, nextMs: new Date(j.nextRunAt!).getTime() }))
    .filter(j => j.nextMs > now)
    .sort((a, b) => a.nextMs - b.nextMs)

  if (!upcoming.length) return 'None scheduled'
  const next = upcoming[0]
  const diffMs = next.nextMs - now
  const diffH = Math.floor(diffMs / 3600000)
  const diffM = Math.floor((diffMs % 3600000) / 60000)
  return `${next.name} in ${diffH}h ${diffM}m`
}

const FALLBACK_AGENTS = [
  { id: 'yugo-prime', name: 'Yugo', role: 'CEO' },
  { id: 'jarvis', name: 'Jarvis', role: 'CTO' },
  { id: 'nexus', name: 'Nexus', role: 'COO' },
  { id: 'nova', name: 'Nova', role: 'CMO' },
  { id: 'ruel', name: 'Ruel', role: 'CFO' },
  { id: 'amalia', name: 'Amalia', role: 'CoS' },
  { id: 'mastermind', name: 'Mastermind', role: 'CIO' },
]

export default async function DashboardPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [health, gold, crons, activity, backlog, agentData] = await Promise.all([
    getHealth(), getGold(), getCrons(), getActivity(), getBacklog(), getAgents()
  ])

  const cronJobs = crons.jobs || []
  const tasks = backlog.tasks || []
  const agents: Array<{ id: string; name: string; model: string; status: string; role: string }> = agentData?.agents || []
  const inProgressTasks = tasks.filter((t: { column: string }) => t.column === 'in-progress').length
  const todoTasks = tasks.filter((t: { column: string }) => t.column === 'todo').length
  const blockedTasks = tasks.filter((t: { column: string }) => t.column === 'blocked').length
  const doneCount = tasks.filter((t: { column: string }) => t.column === 'done').length
  const activityEntries: Array<{ agent: string; content: string; file: string; timestamp?: string }> = activity?.entries || []

  const displayAgents = agents.length > 0 ? agents : FALLBACK_AGENTS
  const totalForBars = tasks.length || 1

  const statuses = [
    { label: 'To Do', key: 'todo', count: todoTasks, color: '#6366f1' },
    { label: 'In Progress', key: 'in-progress', count: inProgressTasks, color: '#f59e0b' },
    { label: 'Blocked', key: 'blocked', count: blockedTasks, color: '#f87171' },
    { label: 'Done', key: 'done', count: doneCount, color: '#10b981' },
  ]

  const inProgressPct = tasks.length > 0
    ? `+${Math.round((inProgressTasks / tasks.length) * 100)}%`
    : '+0%'

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--mc-text-primary)' }}>
            Dashboard
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--mc-text-muted)' }}>
            Real-time agent ecosystem overview
          </p>
        </div>
        {/* Date filter pills */}
        <div className="flex items-center gap-1.5">
          {(['12 months', '30 days', '7 days', '24 hours'] as const).map((label, i) => (
            <span
              key={label}
              className="px-3 py-1.5 rounded-full text-xs font-medium cursor-default"
              style={i === 0 ? {
                background: 'var(--accent, #6366f1)',
                color: '#fff',
              } : {
                background: 'var(--mc-card)',
                border: '1px solid var(--mc-card-border)',
                color: 'var(--mc-text-muted)',
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Row 1 — 3 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

        {/* Total Tasks */}
        <div className="mc-card p-5">
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}>
            Total Tasks
          </p>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-bold tracking-tight" style={{ color: 'var(--mc-text-primary)' }}>
              {tasks.length}
            </span>
            <span
              className="text-xs font-semibold px-2 py-1 rounded-full mb-1"
              style={{
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.25)',
                color: '#34d399',
              }}
            >
              +8%
            </span>
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--mc-text-muted)' }}>in backlog</p>
        </div>

        {/* In Progress */}
        <div className="mc-card p-5">
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}>
            In Progress
          </p>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-bold tracking-tight" style={{ color: '#f59e0b' }}>
              {inProgressTasks}
            </span>
            <span
              className="text-xs font-semibold px-2 py-1 rounded-full mb-1"
              style={{
                background: 'rgba(245,158,11,0.12)',
                border: '1px solid rgba(245,158,11,0.25)',
                color: '#f59e0b',
              }}
            >
              {inProgressPct}
            </span>
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--mc-text-muted)' }}>active tasks</p>
        </div>

        {/* Blocked */}
        <div className="mc-card p-5">
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}>
            Blocked
          </p>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-bold tracking-tight" style={{ color: '#f87171' }}>
              {blockedTasks}
            </span>
            <span
              className="text-xs font-semibold px-2 py-1 rounded-full mb-1"
              style={{
                background: 'rgba(248,113,113,0.12)',
                border: '1px solid rgba(248,113,113,0.25)',
                color: '#f87171',
              }}
            >
              {blockedTasks > 0 ? `${blockedTasks} item${blockedTasks !== 1 ? 's' : ''}` : 'clear'}
            </span>
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--mc-text-muted)' }}>need attention</p>
        </div>
      </div>

      {/* Row 2 — Backlog Overview + Agent Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">

        {/* Backlog Overview — col-span-3 */}
        <div className="lg:col-span-3 mc-card p-5">
          <p className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}>
            Backlog Overview
          </p>
          <div className="space-y-1">
            {statuses.map((s) => (
              <div key={s.key} className="flex items-center gap-3 py-2">
                <span className="text-xs w-20 flex-shrink-0" style={{ color: 'var(--mc-text-muted)' }}>{s.label}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--mc-card-border)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.round((s.count / totalForBars) * 100)}%`,
                      background: s.color,
                    }}
                  />
                </div>
                <span className="text-xs font-mono w-6 text-right flex-shrink-0" style={{ color: 'var(--mc-text-primary)' }}>
                  {s.count}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--mc-card-border)' }}>
            <div className="flex items-center justify-between text-xs" style={{ color: 'var(--mc-text-muted)' }}>
              <span>Active crons: <span className="font-semibold" style={{ color: 'var(--mc-text-primary)' }}>{cronJobs.filter((j: { enabled: boolean }) => j.enabled).length}</span></span>
              <span className="truncate max-w-[200px]">{getNextCron(cronJobs)}</span>
            </div>
          </div>
        </div>

        {/* Agent Performance — col-span-2 */}
        <div className="lg:col-span-2 mc-card p-5">
          <p className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}>
            Agent Performance
          </p>
          <div className="space-y-1">
            {displayAgents.map((agent) => {
              const dotColor = AGENT_DOT_COLORS[agent.id] || '#6b7280'
              return (
                <div key={agent.id} className="flex items-center gap-2.5 py-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}60` }}
                  />
                  <span className="text-sm font-medium flex-1" style={{ color: 'var(--mc-text-primary)' }}>
                    {agent.name}
                  </span>
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}>
                    {agent.role}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Row 3 — Activity Feed + Cron Runs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Activity Feed */}
        <div className="mc-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}
            >
              <Activity className="w-3.5 h-3.5" style={{ color: '#6366f1' }} />
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--mc-text-primary)' }}>
              Activity Feed
            </span>
          </div>
          <div className="space-y-2.5">
            {activityEntries.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--mc-text-muted)' }}>No recent activity</p>
            ) : (
              activityEntries.slice(0, 10).map((entry, i) => {
                const colors = getAgentColor(entry.agent)
                const rel = formatRelativeTime(entry.timestamp)
                return (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <Badge className={`${colors.badge} text-xs flex-shrink-0 mt-0.5 capitalize`}>
                      {entry.agent}
                    </Badge>
                    <span className="flex-1 truncate" style={{ color: 'var(--mc-text-muted)' }}>
                      {entry.content.slice(0, 70)}
                    </span>
                    {rel && (
                      <span className="text-xs flex-shrink-0" style={{ color: 'var(--mc-text-muted)', opacity: 0.6 }}>
                        {rel}
                      </span>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Cron Runs */}
        <div className="mc-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)' }}
            >
              <Clock className="w-3.5 h-3.5" style={{ color: 'var(--mc-accent-blue)' }} />
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--mc-text-primary)' }}>
              Recent Cron Runs
            </span>
          </div>
          <div className="space-y-2.5">
            {cronJobs.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--mc-text-muted)' }}>No cron data</p>
            ) : (
              cronJobs
                .filter((j: { lastRunAt?: string | null }) => j.lastRunAt)
                .sort((a: { lastRunAt?: string | null }, b: { lastRunAt?: string | null }) =>
                  new Date(b.lastRunAt!).getTime() - new Date(a.lastRunAt!).getTime()
                )
                .slice(0, 6)
                .map((job: { name: string; agentId: string; lastStatus?: string | null; lastRunAt?: string | null }, i: number) => {
                  const colors = getAgentColor(job.agentId)
                  const isOk = job.lastStatus === 'ok'
                  return (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Badge className={`${colors.badge} text-xs flex-shrink-0 capitalize`}>
                        {job.agentId}
                      </Badge>
                      <span className="flex-1 truncate" style={{ color: 'var(--mc-text-primary)' }}>
                        {job.name}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: isOk ? 'rgba(16,185,129,0.1)' : 'rgba(248,113,113,0.1)',
                          border: `1px solid ${isOk ? 'rgba(16,185,129,0.25)' : 'rgba(248,113,113,0.25)'}`,
                          color: isOk ? '#34d399' : '#f87171',
                        }}
                      >
                        {job.lastStatus || 'unknown'}
                      </span>
                    </div>
                  )
                })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
