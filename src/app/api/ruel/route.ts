import { NextResponse } from 'next/server'
import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

const RUEL_MEMORY_DIR = '/root/.openclaw/workspace/agents/ruel/memory'

// ─── Trading Sessions ─────────────────────────────────────────────────────────

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

  // Next open: if currently open, next open is tomorrow; if closed, next open today (if not passed) or tomorrow
  const now = new Date()
  const nextDate = new Date(now)
  nextDate.setUTCSeconds(0, 0)

  if (isOpen) {
    // Next open is tomorrow
    nextDate.setUTCDate(nextDate.getUTCDate() + 1)
    nextDate.setUTCHours(openH, openM, 0, 0)
  } else {
    if (nowMins < openMins) {
      // Opens later today
      nextDate.setUTCHours(openH, openM, 0, 0)
    } else {
      // Already passed today, opens tomorrow
      nextDate.setUTCDate(nextDate.getUTCDate() + 1)
      nextDate.setUTCHours(openH, openM, 0, 0)
    }
  }

  return { status, nextAt: nextDate.toISOString() }
}

// ─── Trade Parsing ────────────────────────────────────────────────────────────

interface TradeEntry {
  date: string
  direction: 'BUY' | 'SELL' | string
  entry: string
  sl: string
  tp: string
  result: string
  notes: string
}

function parseTradesFromText(text: string, filename: string): TradeEntry[] {
  const trades: TradeEntry[] = []
  const lines = text.split('\n')

  // Match lines with BUY/SELL keywords alongside SL/TP patterns
  const tradeLineRegex = /\b(BUY|SELL)\b/i
  const entryRegex = /entry[:\s]+([0-9.]+)/i
  const slRegex = /\bSL[:\s]+([0-9.]+)/i
  const tpRegex = /\bTP[:\s]+([0-9.]+)/i
  const pnlRegex = /P&?L[:\s]+([+-]?[0-9.]+%?|\w+)/i
  const dateRegex = /(\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4})/

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!tradeLineRegex.test(line)) continue

    // Grab context: current line + next 3 lines
    const context = lines.slice(i, i + 4).join(' ')

    const dirMatch = line.match(/\b(BUY|SELL)\b/i)
    const entryMatch = context.match(entryRegex)
    const slMatch = context.match(slRegex)
    const tpMatch = context.match(tpRegex)
    const pnlMatch = context.match(pnlRegex)
    const dateMatch = context.match(dateRegex)

    trades.push({
      date: dateMatch?.[1] ?? filename.replace(/\.[^.]+$/, '').replace(/_/g, '-'),
      direction: dirMatch?.[1]?.toUpperCase() ?? '?',
      entry: entryMatch?.[1] ?? '—',
      sl: slMatch?.[1] ?? '—',
      tp: tpMatch?.[1] ?? '—',
      result: pnlMatch?.[1] ?? '—',
      notes: line.trim().slice(0, 80),
    })

    // Skip consumed lines
    i += 1
  }

  return trades
}

// ─── Memory Feed ──────────────────────────────────────────────────────────────

interface MemoryEntry {
  agent: string
  content: string
  timestamp: string
}

function readRuelMemory(): MemoryEntry[] {
  const entries: MemoryEntry[] = []
  try {
    statSync(RUEL_MEMORY_DIR)
  } catch {
    return entries
  }

  function scanDir(dir: string) {
    try {
      const items = readdirSync(dir, { withFileTypes: true })
      for (const item of items) {
        const fullPath = join(dir, item.name)
        if (item.isDirectory()) {
          scanDir(fullPath)
        } else if (item.isFile() && (item.name.endsWith('.md') || item.name.endsWith('.txt') || item.name.endsWith('.log'))) {
          try {
            const content = readFileSync(fullPath, 'utf-8')
            const lines = content.split('\n').filter(l => l.trim().length > 10)
            for (const line of lines) {
              entries.push({
                agent: 'ruel',
                content: line.trim(),
                timestamp: new Date().toISOString(),
              })
            }
          } catch {
            // skip
          }
        }
      }
    } catch {
      // skip
    }
  }

  scanDir(RUEL_MEMORY_DIR)
  return entries.slice(-20).reverse()
}

// ─── Handler ──────────────────────────────────────────────────────────────────

const BASE_URL = process.env.INTERNAL_URL || 'http://localhost:3000'

export async function GET() {
  // Gold price
  let goldData: { price: string | null; change?: string } = { price: null }
  try {
    const res = await fetch(`${BASE_URL}/api/gold`, { next: { revalidate: 60 } })
    if (res.ok) {
      const d = await res.json()
      goldData = { price: d.price ?? null }
    }
  } catch {
    // keep null
  }

  // Sessions
  const now = new Date()
  const h = now.getUTCHours()
  const m = now.getUTCMinutes()

  const london = getSessionStatus(h, m, 7, 0, 10, 0)
  const ny = getSessionStatus(h, m, 12, 30, 15, 0)

  // Trades — scan all ruel memory files
  const trades: TradeEntry[] = []
  function scanForTrades(dir: string) {
    try {
      statSync(dir)
      const items = readdirSync(dir, { withFileTypes: true })
      for (const item of items) {
        const fullPath = join(dir, item.name)
        if (item.isDirectory()) {
          scanForTrades(fullPath)
        } else if (item.isFile()) {
          try {
            const text = readFileSync(fullPath, 'utf-8')
            const found = parseTradesFromText(text, item.name)
            trades.push(...found)
          } catch {
            // skip
          }
        }
      }
    } catch {
      // dir not found
    }
  }
  scanForTrades(RUEL_MEMORY_DIR)

  // Recent memory
  const recentMemory = readRuelMemory()

  return NextResponse.json({
    gold: goldData,
    sessions: { london, ny },
    trades: trades.slice(-50),
    recentMemory,
  })
}
