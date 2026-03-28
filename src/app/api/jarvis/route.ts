import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [buildActivity, deployActivity, recentActivity, cronRuns] = await Promise.all([
      prisma.agentActivity.findMany({
        where: {
          OR: [
            { agentId: 'jarvis' },
            { action: { contains: 'build' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.agentActivity.findMany({
        where: {
          OR: [
            { action: { contains: 'deploy' } },
            { action: { contains: 'release' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.agentActivity.findMany({
        where: { agentId: 'jarvis' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.cronRun.findMany({
        where: {
          OR: [
            { agentId: 'jarvis' },
            { jobName: { contains: 'deploy' } },
            { jobName: { contains: 'build' } },
          ],
        },
        orderBy: { ranAt: 'desc' },
        take: 10,
      }),
    ])

    const builds = buildActivity
      .filter((a) => a.action.toLowerCase().includes('build') || a.agentId === 'jarvis')
      .slice(0, 10)
      .map((a) => ({
        id: a.id,
        action: a.action,
        content: a.content.slice(0, 100),
        status: a.action.toLowerCase().includes('fail') ? 'failed'
          : a.action.toLowerCase().includes('success') ? 'success'
          : 'running',
        createdAt: a.createdAt.toISOString(),
      }))

    type DeployEntry = { id: string; action: string; content: string; status: string; createdAt: Date | string }
    const deployHistory: DeployEntry[] = [
      ...deployActivity.map((a) => ({
        id: a.id,
        action: a.action,
        content: a.content,
        status: a.action.toLowerCase().includes('fail') ? 'failed' : 'done',
        createdAt: a.createdAt,
      })),
      ...cronRuns.map((r) => ({
        id: r.id,
        action: r.jobName,
        content: r.output ?? '',
        createdAt: r.ranAt,
        status: r.status,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map((e) => ({
        id: e.id,
        action: e.action,
        content: String(e.content).slice(0, 100),
        status: e.status.toLowerCase().includes('fail') ? 'failed'
          : e.status.toLowerCase().includes('success') ? 'success'
          : e.status,
        createdAt: new Date(e.createdAt).toISOString(),
      }))

    const activity = recentActivity.map((a) => ({
      id: a.id,
      action: a.action,
      content: a.content.slice(0, 120),
      createdAt: a.createdAt.toISOString(),
    }))

    return NextResponse.json({ builds, deployHistory, activity })
  } catch (error) {
    console.error('Jarvis API error:', error)
    return NextResponse.json({ builds: [], deployHistory: [], activity: [], error: String(error) }, { status: 500 })
  }
}
