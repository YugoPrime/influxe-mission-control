import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Bot, TrendingUp, Clock, Server } from 'lucide-react'
import { getAgentColor } from '@/lib/agent-colors'

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
    return res.ok ? res.json() : { entries: [] }
  } catch {
    return { entries: [] }
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
  const color = status === 'up' || status === 'healthy' || status === 'ok'
    ? 'bg-green-400' 
    : status === 'down' ? 'bg-red-400' 
    : 'bg-yellow-400'
  return <span className={`inline-block w-2 h-2 rounded-full ${color} mr-1.5 animate-pulse`} />
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

export default async function DashboardPage() {
  const [health, gold, crons, activity, backlog] = await Promise.all([
    getHealth(), getGold(), getCrons(), getActivity(), getBacklog()
  ])

  const cronJobs = crons.jobs || []
  const tasks = backlog.tasks || []
  const activeAgents = 7
  const inProgressTasks = tasks.filter((t: { column: string }) => t.column === 'in-progress').length
  const todoTasks = tasks.filter((t: { column: string }) => t.column === 'todo').length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Influxe Agent Ecosystem — Real-time overview</p>
      </div>

      {/* Status Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center gap-2">
          <Server className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-xs text-slate-500">Crucix</div>
            <div className="flex items-center text-sm font-medium truncate">
              <StatusDot status={health?.services?.find((s: { name: string }) => s.name === 'Crucix')?.status || 'unknown'} />
              <span className="capitalize">{health?.services?.find((s: { name: string }) => s.name === 'Crucix')?.status || 'unknown'}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center gap-2">
          <Bot className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-xs text-slate-500">Agents</div>
            <div className="text-sm font-medium">{activeAgents} active</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-xs text-slate-500">XAU/USD</div>
            <div className="text-sm font-medium text-yellow-300">
              {gold?.price ? `$${Number(gold.price).toFixed(2)}` : '—'}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-xs text-slate-500">Next cron</div>
            <div className="text-sm font-medium text-slate-300 truncate">
              {getNextCron(cronJobs)}
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{tasks.length}</div>
            <p className="text-xs text-slate-500 mt-1">in backlog</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-400">{inProgressTasks}</div>
            <p className="text-xs text-slate-500 mt-1">active tasks</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">To Do</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">{todoTasks}</div>
            <p className="text-xs text-slate-500 mt-1">queued tasks</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">Cron Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">{cronJobs.filter((j: { enabled: boolean }) => j.enabled).length}</div>
            <p className="text-xs text-slate-500 mt-1">active automations</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(activity?.entries || []).length === 0 ? (
              <p className="text-slate-500 text-sm">No recent activity</p>
            ) : (
              (activity?.entries || []).slice(0, 10).map((entry: { agent: string; content: string; file: string }, i: number) => {
                const colors = getAgentColor(entry.agent)
                return (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <Badge className={`${colors.badge} text-xs flex-shrink-0 mt-0.5 capitalize`}>
                      {entry.agent}
                    </Badge>
                    <span className="text-slate-400 truncate">{entry.content}</span>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Recent Cron Runs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {cronJobs.length === 0 ? (
              <p className="text-slate-500 text-sm">No cron data</p>
            ) : (
              cronJobs
                .filter((j: { lastRunAt?: string | null }) => j.lastRunAt)
                .sort((a: { lastRunAt?: string | null }, b: { lastRunAt?: string | null }) => 
                  new Date(b.lastRunAt!).getTime() - new Date(a.lastRunAt!).getTime()
                )
                .slice(0, 6)
                .map((job: { name: string; agentId: string; lastStatus?: string | null; lastRunAt?: string | null }, i: number) => {
                  const colors = getAgentColor(job.agentId)
                  return (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Badge className={`${colors.badge} text-xs flex-shrink-0 capitalize`}>
                        {job.agentId}
                      </Badge>
                      <span className="text-slate-300 flex-1 truncate">{job.name}</span>
                      <Badge variant="outline" className={`text-xs ${job.lastStatus === 'ok' ? 'border-green-700 text-green-400' : 'border-red-700 text-red-400'}`}>
                        {job.lastStatus || 'unknown'}
                      </Badge>
                    </div>
                  )
                })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
