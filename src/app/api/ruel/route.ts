import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ─── Trading Sessions ──────────────────────────────────────────────────────────

interface SessionInfo {
  status: 'OPEN' | 'CLOSED'
  nextAt: string
}

function getSessionStatus(
  nowUtcH: number,
  nowUtcM: number,
  openH: number,
  openM: number,
  closeH: number,
  closeM: number,
): SessionInfo {
  const nowMins = nowUtcH * 60 + nowUtcM
  const openMins = openH * 60 + openM
  const closeMins = closeH * 60 + closeM
  const isOpen = nowMins >= openMins && nowMins < closeMins
  const status: 'OPEN' | 'CLOSED' = isOpen ? 'OPEN' : 'CLOSED'
  const now = new Date()
  const nextDate = new Date(now)
  nextDate.setUTCSeconds(0, 0)
  if (isOpen) {
    nextDate.setUTCDate(nextDate.getUTCDate() + 1)
    nextDate.setUTCHours(openH, openM, 0, 0)
  } else {
    if (nowMins < openMins) {
      nextDate.setUTCHours(openH, openM, 0, 0)
    } else {
      nextDate.setUTCDate(nextDate.getUTCDate() + 1)
      nextDate.setUTCHours(openH, openM, 0, 0)
    }
  }
  return { status, nextAt: nextDate.toISOString() }
}

const BASE_URL = process.env.INTERNAL_URL || 'http://localhost:3000'

export async function GET() {
  // Gold price — keep external fetch
  let goldData: { price: string | null; change?: string } = { price: null }
  try {
    const res = await fetch(`${BASE_URL}/api/gold`, { next: { revalidate: 60 } })
    if (res.ok) {
      const d = await res.json()
      goldData = { price: d.price ?? null }
    }
  } catch { /* keep null */ }

  // Sessions — pure computation
  const now = new Date()
  const h = now.getUTCHours()
  const m = now.getUTCMinutes()
  const london = getSessionStatus(h, m, 7, 0, 10, 0)
  const ny = getSessionStatus(h, m, 12, 30, 15, 0)

  // Trades from DB
  let trades: object[] = []
  try {
    const rows = await prisma.trade.findMany({
      orderBy: { date: 'desc' },
      take: 50,
    })
    trades = rows.map((t) => ({
      date: t.date.toISOString().slice(0, 10),
      direction: t.direction,
      entry: t.entry ?? '—',
      sl: t.sl ?? '—',
      tp: t.tp ?? '—',
      result: t.result ?? '—',
      notes: t.notes ?? '',
    }))
  } catch { /* empty */ }

  // Recent memory from AgentActivity
  let recentMemory: object[] = []
  try {
    const rows = await prisma.agentActivity.findMany({
      where: { agentId: 'ruel' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    recentMemory = rows.map((r) => ({
      agent: 'ruel',
      content: r.content,
      timestamp: r.createdAt.toISOString(),
    }))
  } catch { /* empty */ }

  return NextResponse.json({ gold: goldData, sessions: { london, ny }, trades, recentMemory })
}
