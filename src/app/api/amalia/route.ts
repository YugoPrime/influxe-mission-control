import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const rows = await prisma.agentActivity.findMany({
      where: { agentId: 'amalia' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const today = new Date()
    const streakDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - (6 - i))
      return d.toISOString().slice(0, 10)
    })

    const allContent = rows.map((r) => r.content.toLowerCase()).join('\n')

    const tradingCalendar = streakDays.map((date) => {
      const hasMention =
        allContent.includes(date) &&
        (allContent.includes('trading') || allContent.includes('session') || allContent.includes('xau') || allContent.includes('killzone'))
      return { date, done: hasMention }
    })

    let streak = 0
    for (let i = tradingCalendar.length - 1; i >= 0; i--) {
      if (tradingCalendar[i].done) streak++
      else break
    }

    const briefLines = rows.slice(0, 20).map((r) => r.content)
    const recentLog = rows.slice(0, 10).map((r) => r.content)

    return NextResponse.json({
      brief: { lines: briefLines, source: 'database' },
      trading: { streak, calendar: tradingCalendar, hasData: tradingCalendar.some((d) => d.done) },
      recentLog,
    })
  } catch (error) {
    console.error('Amalia DB error:', error)
    return NextResponse.json({
      brief: { lines: [], source: null },
      trading: { streak: 0, calendar: [], hasData: false },
      recentLog: [],
      error: String(error),
    }, { status: 500 })
  }
}
