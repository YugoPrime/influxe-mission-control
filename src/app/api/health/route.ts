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
  const [crucix, openclaw, langfuse, coolify] = await Promise.all([
    checkService('Crucix', 'http://localhost:3117/api/health'),
    checkService('OpenClaw', 'http://localhost:18789'),
    checkService('Langfuse', 'http://localhost:3100/api/public/health'),
    checkService('Coolify', 'http://localhost:8000/api/health'),
  ])

  const services = [openclaw, crucix, langfuse, coolify]
  const overall = services.every(s => s.status === 'up') ? 'healthy' : 'degraded'

  return NextResponse.json({
    overall,
    services,
    checkedAt: new Date().toISOString(),
  })
}
