import { NextResponse } from 'next/server'

interface ServiceStatus {
  name: string
  status: 'up' | 'down' | 'unknown'
  latencyMs?: number
  error?: string
}

async function checkService(name: string, url: string): Promise<ServiceStatus> {
  const start = Date.now()
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) })
    const latencyMs = Date.now() - start
    return { name, status: res.ok ? 'up' : 'down', latencyMs }
  } catch (err) {
    return { name, status: 'down', error: String(err) }
  }
}

export async function GET() {
  const [crucix, openclaw] = await Promise.all([
    checkService('Crucix', 'http://localhost:3117/api/health'),
    checkService('OpenClaw', 'http://localhost:18789'),
  ])

  const overall = [crucix, openclaw].every(s => s.status === 'up') ? 'healthy' : 'degraded'

  return NextResponse.json({
    overall,
    services: [crucix, openclaw],
    checkedAt: new Date().toISOString(),
  })
}
