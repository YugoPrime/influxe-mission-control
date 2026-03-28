import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export type IdeaStatus = 'Incubating' | 'Researched' | 'Validated' | 'Killed'

export interface Idea {
  id: string
  title: string
  date: string
  score: number | null
  status: IdeaStatus
  snippet: string
  source: 'research' | 'backlog'
}

function mapStatus(status: string): IdeaStatus {
  if (status === 'build_now' || status === 'validated') return 'Validated'
  if (status === 'killed') return 'Killed'
  if (status === 'researched') return 'Researched'
  return 'Incubating'
}

export async function GET() {
  try {
    const rows = await prisma.researchIdea.findMany({ orderBy: { createdAt: 'desc' } })
    const ideas: Idea[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      date: r.createdAt.toISOString().slice(0, 10),
      score: r.score,
      status: mapStatus(r.status),
      snippet: r.snippet ?? '',
      source: 'research',
    }))
    return NextResponse.json({ ideas })
  } catch (error) {
    console.error('Ideas DB error:', error)
    return NextResponse.json({ ideas: [], error: String(error) }, { status: 500 })
  }
}
