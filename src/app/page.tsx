import { Badge } from '@/components/ui/badge'
import { Activity, Bot, TrendingUp, Clock, Server, Zap, CheckSquare, ListTodo, AlertCircle } from 'lucide-react'
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

function StatusDot({ status }: { status: string }) {
  const isUp = status === 'up' || status === 'healthy' || status === 'ok'
  const isDown = status === 'down'
  const color = isUp ? '#34d399' : isDown ? '#f87171' : '#fbbf24'
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0"
      style={{ background: color, boxShadow: `0 0 6px ${color}` }}
    />
  )
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

// Agent accent colors for metric cards
const metricAccents = {
  total: { color: '#3b82f6', glow: 'rgba(59,130,246,0.15)' },
  inProgress: { color: '#f59e0b', glow: 'rgba(245,158,11,0.15)' },
  todo: { color: '#8b5cf6', glow: 'rgba(139,92,246,0.15)' },
  blocked: { color: '#f87171', glow: 'rgba(248,113,113,0.15)' },
  crons: { color: '#10b981', glow: 'rgba(16,185,129,0.15)' },
}

export default async function DashboardPage() {
  const [health, gold, crons, activity, backlog, agentData] = await Promise.all([
    getHealth(), getGold(), getCrons(), getActivity(), getBacklog(), getAgents()
  ])

  const cronJobs = crons.jobs || []
  const tasks = backlog.tasks || []
  const agents: Array<{ id: string; name: string; model: string; status: string; role: string }> = agentData?.agents || []
  const activeAgents = agents.length || 7
  const inProgressTasks = tasks.filter((t: { column: string }) => t.column === 'in-progress').length
  const todoTasks = tasks.filter((t: { column: string }) => t.column === 'todo').length
  const blockedTasks = tasks.filter((t: { column: string }) => t.column === 'blocked').length
  const activityEntries: Array<{ agent: string; content: string; file: string; timestamp?: string }> = activity?.entries || []
  const crucixStatus = health?.services?.find((s: { name: string }) => s.name === 'Crucix')?.status || 'unknown'

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Page heading */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--mc-text-primary)' }}>
            Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--mc-text-muted)' }}>
            Influxe Agent Ecosystem — Real-time overview
          </p>
        </div>
        <div
          className="text-xs px-3 py-1.5 rounded-full font-mono hidden md:block"
          style={{
            background: 'var(--mc-card)',
            border: '1px solid var(--mc-card-border)',
            color: 'var(--mc-text-muted)',
          }}
        >
          {new Date().toUTCString().replace(' GMT', ' UTC')}
        </div>
      </div>

      {/* Status Bar — slim pills */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        {/* Crucix */}
        <div
          className="mc-card flex items-center gap-3 p-3"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(99,179,237,0.1)', border: '1px solid rgba(99,179,237,0.2)' }}
          >
            <Server className="w-4 h-4" style={{ color: 'var(--mc-accent-blue)' }} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}>Crucix</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <StatusDot status={crucixStatus} />
              <span className="text-sm font-semibold capitalize" style={{ color: 'var(--mc-text-primary)' }}>
                {crucixStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Agents */}
        <div className="mc-card flex items-center gap-3 p-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
          >
            <Bot className="w-4 h-4" style={{ color: 'var(--mc-brand)' }} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}>Agents</div>
            <div className="text-sm font-semibold mt-0.5" style={{ color: 'var(--mc-text-primary)' }}>
              {activeAgents} active
            </div>
          </div>
        </div>

        {/* XAU/USD */}
        <div className="mc-card flex items-center gap-3 p-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}
          >
            <TrendingUp className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}>XAU/USD</div>
            <div className="text-sm font-semibold mt-0.5 text-yellow-400">
              {gold?.price ? `$${Number(gold.price).toFixed(2)}` : '—'}
            </div>
          </div>
        </div>

        {/* Next Cron */}
        <div className="mc-card flex items-center gap-3 p-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}
          >
            <Clock className="w-4 h-4" style={{ color: 'var(--mc-accent-cyan)' }} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}>Next Cron</div>
            <div className="text-sm font-semibold mt-0.5 truncate" style={{ color: 'var(--mc-text-primary)' }}>
              {getNextCron(cronJobs)}
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <div
          className="mc-card p-5"
          style={{ boxShadow: `var(--mc-card-glow), inset 0 1px 0 ${metricAccents.total.glow}` }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}>
              Total Tasks
            </span>
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: metricAccents.total.glow, border: `1px solid ${metricAccents.total.color}30` }}
            >
              <ListTodo className="w-3.5 h-3.5" style={{ color: metricAccents.total.color }} />
            </div>
          </div>
          <div className="text-3xl font-bold tracking-tight" style={{ color: 'var(--mc-text-primary)' }}>
            {tasks.length}
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--mc-text-muted)' }}>in backlog</p>
        </div>

        <div
          className="mc-card p-5"
          style={{ boxShadow: `var(--mc-card-glow), inset 0 1px 0 ${metricAccents.inProgress.glow}` }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}>
              In Progress
            </span>
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: metricAccents.inProgress.glow, border: `1px solid ${metricAccents.inProgress.color}30` }}
            >
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
            </div>
          </div>
          <div className="text-3xl font-bold tracking-tight text-yellow-400">
            {inProgressTasks}
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--mc-text-muted)' }}>active tasks</p>
        </div>

        <div
          className="mc-card p-5"
          style={{ boxShadow: `var(--mc-card-glow), inset 0 1px 0 ${metricAccents.todo.glow}` }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}>
              To Do
            </span>
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: metricAccents.todo.glow, border: `1px solid ${metricAccents.todo.color}30` }}
            >
              <CheckSquare className="w-3.5 h-3.5" style={{ color: metricAccents.todo.color }} />
            </div>
          </div>
          <div className="text-3xl font-bold tracking-tight" style={{ color: metricAccents.todo.color }}>
            {todoTasks}
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--mc-text-muted)' }}>queued tasks</p>
        </div>

        <div
          className="mc-card p-5"
          style={{ boxShadow: `var(--mc-card-glow), inset 0 1px 0 ${metricAccents.blocked.glow}` }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}>
              Blocked
            </span>
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: metricAccents.blocked.glow, border: `1px solid ${metricAccents.blocked.color}30` }}
            >
              <AlertCircle className="w-3.5 h-3.5" style={{ color: metricAccents.blocked.color }} />
            </div>
          </div>
          <div className="text-3xl font-bold tracking-tight" style={{ color: metricAccents.blocked.color }}>
            {blockedTasks}
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--mc-text-muted)' }}>need attention</p>
        </div>
      </div>

      {/* Agent Roster */}
      {agents.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}>
            Agents
          </p>
          <div className="flex flex-wrap gap-2">
            {agents.map((agent) => {
              const dotColor = AGENT_DOT_COLORS[agent.id] || '#6b7280'
              return (
                <div
                  key={agent.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: 'var(--mc-card)',
                    border: '1px solid var(--mc-card-border)',
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}` }}
                  />
                  <span className="font-medium" style={{ color: 'var(--mc-text-primary)' }}>
                    {agent.name}
                  </span>
                  <span className="hidden sm:inline text-xs truncate max-w-[120px]" style={{ color: 'var(--mc-text-muted)' }}>
                    {agent.role}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Activity + Crons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Activity Feed */}
        <div className="mc-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}
            >
              <Activity className="w-3.5 h-3.5" style={{ color: 'var(--mc-brand)' }} />
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
