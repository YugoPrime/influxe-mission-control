'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getAgentColor } from '@/lib/agent-colors'
import { ChevronDown, ChevronRight, Zap } from 'lucide-react'

interface CronJob {
  id: string
  name: string
  description?: string
  agentId: string
  enabled: boolean
  schedule: string
  tz: string
  model?: string
  lastRunAt?: string
  nextRunAt?: string
  lastStatus?: string
  lastDurationMs?: number
  consecutiveErrors?: number
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { 
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
  })
}

function StatusBadge({ status, enabled }: { status?: string; enabled: boolean }) {
  if (!enabled) return <Badge className="bg-slate-700 text-slate-300 text-xs">Disabled</Badge>
  if (!status) return <Badge className="bg-slate-700 text-slate-300 text-xs">Pending</Badge>
  if (status === 'ok') return <Badge className="bg-green-800 text-green-200 text-xs">✓ OK</Badge>
  return <Badge className="bg-red-800 text-red-200 text-xs">✗ {status}</Badge>
}

function JobRow({ job }: { job: CronJob }) {
  const [expanded, setExpanded] = useState(false)
  const colors = getAgentColor(job.agentId)

  return (
    <>
      <tr 
        className="border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="py-3 px-4 text-sm">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
            <span className="text-white font-medium">{job.name}</span>
          </div>
        </td>
        <td className="py-3 px-4">
          <code className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300">{job.schedule}</code>
          <span className="text-xs text-slate-500 ml-1">{job.tz}</span>
        </td>
        <td className="py-3 px-4">
          <Badge className={`${colors.badge} text-xs capitalize`}>{job.agentId}</Badge>
        </td>
        <td className="py-3 px-4">
          {job.model ? (
            <span className="text-xs text-slate-400 font-mono">{job.model.split('/').pop()}</span>
          ) : <span className="text-slate-600 text-xs">—</span>}
        </td>
        <td className="py-3 px-4 text-xs text-slate-400">{formatDate(job.lastRunAt)}</td>
        <td className="py-3 px-4">
          <StatusBadge status={job.lastStatus || undefined} enabled={job.enabled} />
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-slate-800 bg-slate-900/50">
          <td colSpan={6} className="px-4 py-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              {job.description && (
                <div className="col-span-2 lg:col-span-4">
                  <span className="text-slate-500 text-xs uppercase tracking-wider">Description</span>
                  <p className="text-slate-300 mt-1">{job.description}</p>
                </div>
              )}
              <div>
                <span className="text-slate-500 text-xs uppercase tracking-wider">Next Run</span>
                <p className="text-slate-300 mt-1">{formatDate(job.nextRunAt)}</p>
              </div>
              <div>
                <span className="text-slate-500 text-xs uppercase tracking-wider">Last Duration</span>
                <p className="text-slate-300 mt-1">
                  {job.lastDurationMs ? `${(job.lastDurationMs / 1000).toFixed(1)}s` : '—'}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-xs uppercase tracking-wider">Errors (streak)</span>
                <p className={`mt-1 ${(job.consecutiveErrors || 0) > 0 ? 'text-red-400' : 'text-slate-300'}`}>
                  {job.consecutiveErrors || 0}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-xs uppercase tracking-wider">Job ID</span>
                <p className="text-slate-500 mt-1 font-mono text-xs truncate">{job.id}</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function AutomationsPage() {
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/crons')
      .then(r => r.json())
      .then(d => {
        setJobs(d.jobs || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const activeCount = jobs.filter(j => j.enabled).length

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--mc-text-primary)' }}>Automations</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--mc-text-muted)' }}>Scheduled cron jobs across all agents</p>
        </div>
        <Badge className="bg-purple-900 text-purple-200 text-sm px-3 py-1">
          <Zap className="w-3 h-3 mr-1 inline" />
          {activeCount} active
        </Badge>
      </div>

      <Card className="mc-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium" style={{ color: 'var(--mc-text-muted)' }}>Cron Jobs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : jobs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No cron jobs found</div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80">
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Schedule</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Agent</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Model</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Last Run</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(job => <JobRow key={job.id} job={job} />)}
                </tbody>
              </table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
