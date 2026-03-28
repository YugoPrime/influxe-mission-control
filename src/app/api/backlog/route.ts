import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export interface BacklogTask {
  id: string
  type: string
  title: string
  owner: string
  status: string
  description: string
  deadline?: string
  stack?: string
  column: string
}

export async function GET() {
  try {
    const projects = await prisma.project.findMany({ orderBy: { createdAt: 'asc' } })
    const tasks: BacklogTask[] = projects.map((p) => ({
      id: p.id,
      type: p.category ?? 'TASK',
      title: p.title,
      owner: p.owner ?? '',
      status: p.status,
      description: p.description ?? '',
      deadline: p.deadline ?? undefined,
      column: p.status,
    }))
    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Backlog DB error:', error)
    return NextResponse.json({ tasks: [], error: String(error) }, { status: 500 })
  }
}
