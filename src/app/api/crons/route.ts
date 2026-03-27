import { readFileSync } from 'fs'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const raw = readFileSync('/root/.openclaw/cron/jobs.json', 'utf-8')
    const data = JSON.parse(raw)
    const jobs = (data.jobs || []).map((job: Record<string, unknown>) => {
      const schedule = job.schedule as Record<string, unknown>
      const state = job.state as Record<string, unknown>
      const payload = job.payload as Record<string, unknown>
      return {
        id: job.id,
        name: job.name,
        description: job.description,
        agentId: job.agentId,
        enabled: job.enabled,
        schedule: schedule?.expr || '',
        tz: schedule?.tz || 'UTC',
        model: payload?.model || null,
        lastRunAt: state?.lastRunAtMs ? new Date(state.lastRunAtMs as number).toISOString() : null,
        nextRunAt: state?.nextRunAtMs ? new Date(state.nextRunAtMs as number).toISOString() : null,
        lastStatus: state?.lastStatus || state?.lastRunStatus || null,
        lastDurationMs: state?.lastDurationMs || null,
        consecutiveErrors: state?.consecutiveErrors || 0,
      }
    })
    return NextResponse.json({ jobs })
  } catch (error) {
    // Fallback: try OpenClaw API
    try {
      const res = await fetch('http://localhost:18789/api/cron/jobs', { 
        signal: AbortSignal.timeout(3000) 
      })
      if (res.ok) {
        const data = await res.json()
        return NextResponse.json(data)
      }
    } catch {
      // ignore
    }
    return NextResponse.json({ jobs: [], error: String(error) }, { status: 500 })
  }
}
