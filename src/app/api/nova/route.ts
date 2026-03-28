import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [calendarRows, activityRows] = await Promise.all([
      prisma.contentCalendar.findMany({ orderBy: { scheduledAt: 'desc' }, take: 20 }),
      prisma.agentActivity.findMany({ where: { agentId: 'nova' }, orderBy: { createdAt: 'desc' }, take: 15 }),
    ])

    const campaigns = calendarRows.map((c) => `[${c.platform}] ${c.caption ?? c.postType ?? 'post'} — ${c.status}`)
    const recentLog = activityRows.map((a) => a.content)

    return NextResponse.json({ campaigns, recentLog })
  } catch (error) {
    console.error('Nova DB error:', error)
    return NextResponse.json({ campaigns: [], recentLog: [], error: String(error) }, { status: 500 })
  }
}
