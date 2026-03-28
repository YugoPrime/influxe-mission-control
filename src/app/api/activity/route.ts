import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface ActivityEntry {
  agent: string
  content: string
  file: string
  timestamp?: string
}

export async function GET() {
  try {
    const rows = await prisma.agentActivity.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    const entries: ActivityEntry[] = rows.map((r) => ({
      agent: r.agentId,
      content: r.content,
      file: (r.metadata as Record<string, string> | null)?.file ?? '',
      timestamp: r.createdAt.toISOString(),
    }))

    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Activity DB error:', error)
    return NextResponse.json({ entries: [], error: String(error) }, { status: 500 })
  }
}
