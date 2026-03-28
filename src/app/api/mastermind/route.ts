import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export interface ResearchItem {
  title: string
  filename: string
  date: string
  score: number | null
  snippet: string
  status: string
}

export async function GET() {
  try {
    const [ideaRows, activityRows] = await Promise.all([
      prisma.researchIdea.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.agentActivity.findMany({ where: { agentId: 'mastermind' }, orderBy: { createdAt: 'desc' }, take: 20 }),
    ])

    const research: ResearchItem[] = ideaRows.map((r) => ({
      title: r.title,
      filename: r.sourceFile ?? `${r.id}.md`,
      date: r.createdAt.toISOString().slice(0, 10),
      score: r.score,
      snippet: r.snippet ?? '',
      status: r.status.toUpperCase().replace('_', ' '),
    }))

    const scoredIdeas = research.filter((r) => r.score !== null && r.score >= 7)
    const recentLog = activityRows.map((a) => a.content)

    return NextResponse.json({ research, scoredIdeas, recentLog })
  } catch (error) {
    console.error('Mastermind DB error:', error)
    return NextResponse.json({ research: [], scoredIdeas: [], recentLog: [], error: String(error) }, { status: 500 })
  }
}
