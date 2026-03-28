import { NextResponse } from 'next/server'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const AMALIA_MEMORY = '/root/.openclaw/workspace/agents/amalia/memory'
const AMALIA_ROOT = '/root/.openclaw/workspace/agents/amalia'

function findMostRecentFile(dir: string): string | null {
  try {
    const entries = readdirSync(dir)
    const files = entries
      .map((f) => join(dir, f))
      .filter((p) => {
        try { return statSync(p).isFile() } catch { return false }
      })
      .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)
    return files[0] ?? null
  } catch {
    return null
  }
}

function readLastLines(filePath: string, n: number): string[] {
  try {
    const content = readFileSync(filePath, 'utf8')
    const lines = content.split('\n').filter((l) => l.trim().length > 0)
    return lines.slice(-n)
  } catch {
    return []
  }
}

export async function GET() {
  // Find most recent daily log
  const dailyDir = join(AMALIA_MEMORY, 'daily')
  let briefFile: string | null = null
  try {
    briefFile = findMostRecentFile(dailyDir)
  } catch { /* daily dir may not exist */ }

  // Fallback to MEMORY.md
  if (!briefFile) {
    const fallback = join(AMALIA_ROOT, 'MEMORY.md')
    try { statSync(fallback); briefFile = fallback } catch { /* noop */ }
  }

  const briefLines = briefFile ? readLastLines(briefFile, 20) : []
  const briefSource = briefFile ? briefFile.split('/').pop() ?? 'unknown' : null

  // Scan all memory files for trading/streak entries
  const memoryFiles: string[] = []
  try {
    const rootFiles = readdirSync(AMALIA_MEMORY)
      .map((f) => join(AMALIA_MEMORY, f))
      .filter((p) => { try { return statSync(p).isFile() } catch { return false } })
    memoryFiles.push(...rootFiles)
  } catch { /* noop */ }

  // Check last 7 days for trading entries
  const today = new Date()
  const streakDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })

  // Look in all memory content for mentions of trading on specific dates
  let allMemoryContent = ''
  for (const f of memoryFiles) {
    try { allMemoryContent += readFileSync(f, 'utf8') + '\n' } catch { /* noop */ }
  }
  // Also check agents/amalia root files
  try {
    const rootAgentFiles = readdirSync(AMALIA_ROOT)
      .map((f) => join(AMALIA_ROOT, f))
      .filter((p) => { try { return statSync(p).isFile() } catch { return false } })
    for (const f of rootAgentFiles) {
      try { allMemoryContent += readFileSync(f, 'utf8') + '\n' } catch { /* noop */ }
    }
  } catch { /* noop */ }

  const tradingCalendar = streakDays.map((date) => {
    const dateVariants = [date, date.replace(/-/g, '/')]
    const hasMention = dateVariants.some((d) =>
      allMemoryContent.toLowerCase().includes(d) &&
      (allMemoryContent.toLowerCase().includes('trading') ||
        allMemoryContent.toLowerCase().includes('session') ||
        allMemoryContent.toLowerCase().includes('xau') ||
        allMemoryContent.toLowerCase().includes('killzone'))
    )
    return { date, done: hasMention }
  })

  const streak = (() => {
    let s = 0
    for (let i = tradingCalendar.length - 1; i >= 0; i--) {
      if (tradingCalendar[i].done) s++
      else break
    }
    return s
  })()

  // Recent log — last 10 lines of most recent memory file
  const recentMemFile = findMostRecentFile(AMALIA_MEMORY) ??
    join(AMALIA_ROOT, 'MEMORY.md')
  const recentLog = readLastLines(recentMemFile, 10)

  return NextResponse.json({
    brief: {
      lines: briefLines,
      source: briefSource,
    },
    trading: {
      streak,
      calendar: tradingCalendar,
      hasData: tradingCalendar.some((d) => d.done),
    },
    recentLog,
  })
}
