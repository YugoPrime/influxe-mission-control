import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export interface HandoffEntry {
  id: string
  from: string
  to: string
  summary: string
  status: string
  sent: string
}

export async function GET() {
  try {
    const rows = await prisma.handoff.findMany({
      where: {
        OR: [
          { fromAgent: { contains: 'nexus' } },
          { toAgent: { contains: 'nexus' } },
        ],
      },
      orderBy: { sentAt: 'asc' },
      take: 15,
    })
    const handoffs: HandoffEntry[] = rows.map((h) => ({
      id: h.handoffId,
      from: h.fromAgent,
      to: h.toAgent,
      summary: h.summary,
      status: h.status,
      sent: h.sentAt.toISOString(),
    }))
    return NextResponse.json({ handoffs })
  } catch (error) {
    console.error('Nexus DB error:', error)
    return NextResponse.json({ handoffs: [], error: String(error) }, { status: 500 })
  }
}
