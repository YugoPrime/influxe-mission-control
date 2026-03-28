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
  if (!enabled) return <Badge variant="outline" className="text-xs" style={{ color: 'var(--mc-text-muted)' }}>Disabled</Badge>
  if (!status) return <Badge variant="outline" className="text-xs" style={{ color: 'var(--mc-text-muted)' }}>Pending</Badge>
  if (status === 'ok') return <Badge className="text-xs" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}>✓ OK</Badge>
  return <Badge className="text-xs" style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>✗ {status}</Badge>
}

function JobRow({ job }: { job: CronJob }) {
  const [expanded, setExpanded] = useState(false)
  const colors = getAgentColor(job.agentId)

  return (
    <>
      <tr
        className="cursor-pointer transition-colors"
        style={{ borderBottom: '1px solid var(--mc-card-border)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent)')}
        onMouseLeave={e => (e.currentTarget.style.background = '')}
        onClick={() => setExpanded(!expanded)}
      >
        <td className="py-3 px-4 text-sm">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown className="w-3 h-3" style={{ color: 'var(--mc-text-muted)' }} /> : <ChevronRight className="w-3 h-3" style={{ color: 'var(--mc-text-muted)' }} />}
            <span className="font-medium" style={{ color: 'var(--mc-text-primary)' }}>{job.name}</span>
          </div>
        </td>
        <td className="py-3 px-4">
          <code className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--mc-card-border)', color: 'var(--mc-text-primary)' }}>{job.schedule}</code>
          <span className="text-xs ml-1" style={{ color: 'var(--mc-text-muted)' }}>{job.tz}</span>
        </td>
        <td className="py-3 px-4">
          <Badge className={`${colors.badge} text-xs capitalize`}>{job.agentId}</Badge>
        </td>
        <td className="py-3 px-4">
          {job.model ? (
            <span className="text-xs font-mono" style={{ color: 'var(--mc-text-muted)' }}>{job.model.split('/').pop()}</span>
          ) : <span className="text-xs" style={{ color: 'var(--mc-text-muted)' }}>—</span>}
        </td>
        <td className="py-3 px-4 text-xs" style={{ color: 'var(--mc-text-muted)' }}>{formatDate(job.lastRunAt)}</td>
        <td className="py-3 px-4">
          <StatusBadge status={job.lastStatus || undefined} enabled={job.enabled} />
        </td>
      </tr>
      {expanded && (
        <tr style={{ borderBottom: '1px solid var(--mc-card-border)', background: 'var(--mc-card)' }}>
          <td colSpan={6} className="px-4 py-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              {job.description && (
                <div className="col-span-2 lg:col-span-4">
                  <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--mc-text-muted)' }}>Description</span>
                  <p className="mt-1" style={{ color: 'var(--mc-text-primary)' }}>{job.description}</p>
                </div>
              )}
              <div>
                <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--mc-text-muted)' }}>Next Run</span>
                <p className="mt-1" style={{ color: 'var(--mc-text-primary)' }}>{formatDate(job.nextRunAt)}</p>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--mc-text-muted)' }}>Last Duration</span>
                <p className="mt-1" style={{ color: 'var(--mc-text-primary)' }}>
                  {job.lastDurationMs ? `${(job.lastDurationMs / 1000).toFixed(1)}s` : '—'}
                </p>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--mc-text-muted)' }}>Errors (streak)</span>
                <p className="mt-1" style={{ color: (job.consecutiveErrors || 0) > 0 ? '#f87171' : 'var(--mc-text-primary)' }}>
                  {job.consecutiveErrors || 0}
                </p>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--mc-text-muted)' }}>Job ID</span>
                <p className="mt-1 font-mono text-xs truncate" style={{ color: 'var(--mc-text-muted)' }}>{job.id}</p>
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
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--mc-text-primary)' }}>Automations</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--mc-text-muted)' }}>Scheduled cron jobs across all agents</p>
        </div>
        <span
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: 'var(--mc-brand)' }}
        >
          <Zap className="w-3 h-3" />
          {activeCount} active
        </span>
      </div>

      <Card className="mc-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium" style={{ color: 'var(--mc-text-muted)' }}>Cron Jobs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center" style={{ color: 'var(--mc-text-muted)' }}>Loading...</div>
          ) : jobs.length === 0 ? (
            <div className="p-8 text-center" style={{ color: 'var(--mc-text-muted)' }}>No cron jobs found</div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--mc-card-border)', background: 'var(--mc-card)' }}>
                      {['Name', 'Schedule', 'Agent', 'Model', 'Last Run', 'Status'].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--mc-text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map(job => <JobRow key={job.id} job={job} />)}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
