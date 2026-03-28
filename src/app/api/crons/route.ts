import { readFileSync } from 'fs'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  // Try DB for recent run history, merged with jobs.json schedule config
  try {
    const runs = await prisma.cronRun.findMany({ orderBy: { ranAt: 'desc' }, take: 50 })
    const latestByJob = new Map<string, typeof runs[0]>()
    for (const run of runs) {
      if (!latestByJob.has(run.jobId)) latestByJob.set(run.jobId, run)
    }

    let jobsConfig: Record<string, unknown>[] = []
    try {
      const raw = readFileSync('/root/.openclaw/cron/jobs.json', 'utf-8')
      jobsConfig = JSON.parse(raw).jobs || []
    } catch {
      try {
        const res = await fetch('http://localhost:18789/api/cron/jobs', { signal: AbortSignal.timeout(3000) })
        if (res.ok) jobsConfig = (await res.json()).jobs || []
      } catch { /* ignore */ }
    }

    if (jobsConfig.length > 0) {
      const jobs = jobsConfig.map((job) => {
        const schedule = job.schedule as Record<string, unknown>
        const state = job.state as Record<string, unknown>
        const payload = job.payload as Record<string, unknown>
        const jobId = String(job.id)
        const lastRun = latestByJob.get(jobId)
        return {
          id: jobId, name: job.name, description: job.description, agentId: job.agentId, enabled: job.enabled,
          schedule: schedule?.expr || '', tz: schedule?.tz || 'UTC', model: payload?.model || null,
          lastRunAt: lastRun?.ranAt.toISOString() ?? (state?.lastRunAtMs ? new Date(state.lastRunAtMs as number).toISOString() : null),
          nextRunAt: state?.nextRunAtMs ? new Date(state.nextRunAtMs as number).toISOString() : null,
          lastStatus: lastRun?.status ?? state?.lastStatus ?? state?.lastRunStatus ?? null,
          lastDurationMs: lastRun?.duration ?? state?.lastDurationMs ?? null,
          consecutiveErrors: state?.consecutiveErrors || 0,
        }
      })
      return NextResponse.json({ jobs })
    }

    // DB-only
    const jobs = Array.from(latestByJob.values()).map((run) => ({
      id: run.jobId, name: run.jobName, description: null, agentId: run.agentId, enabled: true,
      schedule: '', tz: 'UTC', model: null, lastRunAt: run.ranAt.toISOString(), nextRunAt: null,
      lastStatus: run.status, lastDurationMs: run.duration, consecutiveErrors: 0,
    }))
    return NextResponse.json({ jobs })
  } catch (dbError) {
    // Full fallback to file
    try {
      const raw = readFileSync('/root/.openclaw/cron/jobs.json', 'utf-8')
      const data = JSON.parse(raw)
      const jobs = (data.jobs || []).map((job: Record<string, unknown>) => {
        const schedule = job.schedule as Record<string, unknown>
        const state = job.state as Record<string, unknown>
        const payload = job.payload as Record<string, unknown>
        return {
          id: job.id, name: job.name, description: job.description, agentId: job.agentId, enabled: job.enabled,
          schedule: schedule?.expr || '', tz: schedule?.tz || 'UTC', model: payload?.model || null,
          lastRunAt: state?.lastRunAtMs ? new Date(state.lastRunAtMs as number).toISOString() : null,
          nextRunAt: state?.nextRunAtMs ? new Date(state.nextRunAtMs as number).toISOString() : null,
          lastStatus: state?.lastStatus || state?.lastRunStatus || null,
          lastDurationMs: state?.lastDurationMs || null, consecutiveErrors: state?.consecutiveErrors || 0,
        }
      })
      return NextResponse.json({ jobs })
    } catch {
      try {
        const res = await fetch('http://localhost:18789/api/cron/jobs', { signal: AbortSignal.timeout(3000) })
        if (res.ok) return NextResponse.json(await res.json())
      } catch { /* ignore */ }
      return NextResponse.json({ jobs: [], error: String(dbError) }, { status: 500 })
    }
  }
}
