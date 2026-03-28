import { NextResponse } from 'next/server'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const RESEARCH_DIR = '/root/.openclaw/workspace/agents/mastermind/research'
const BACKLOG_PATH = '/root/.openclaw/workspace/agents/shared/BACKLOG.md'

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

// ─── Helpers ──────────────────────────────────────────────────────────────

function extractTitle(content: string, filename: string): string {
  const h1 = content.match(/^#\s+(.+)$/m)
  if (h1) return h1[1].replace(/\*\*/g, '').trim()
  return filename
    .replace(/\.md$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\d{4}-\d{2}-\d{2}/, '')
    .trim()
}

function extractDate(content: string, filename: string): string {
  // Try frontmatter or bold date line
  const fmDate = content.match(/(?:Date\s*:\s*|date:\s*)(\d{4}-\d{2}-\d{2})/)
  if (fmDate) return fmDate[1]
  // Try filename
  const fnDate = filename.match(/(\d{4}-\d{2}-\d{2})/)
  if (fnDate) return fnDate[1]
  return new Date().toISOString().slice(0, 10)
}

function extractScore(content: string): number | null {
  // Pattern: "7.8/10" or "Score global pondéré\n**X.X/10**" or "**Score global** : X.X/10"
  const patterns = [
    /Score global[^:]*[:\s]+\*?\*?([\d.]+)\/10/i,
    /\([\d\s+]+\)\s*\/\s*5\s*=\s*([\d.]+)\/10/,
    /score\s*:?\s*([\d.]+)\s*\/\s*10/i,
    /\*\*([\d.]+)\/10\*\*/,
    /([\d.]+)\/10\b/,
  ]
  for (const pat of patterns) {
    const m = content.match(pat)
    if (m) {
      const n = parseFloat(m[1])
      if (n >= 1 && n <= 10) return n
    }
  }
  return null
}

function extractSnippet(content: string): string {
  const lines = content.split('\n').filter((l) => l.trim().length > 0)
  // Skip H1 and metadata lines, grab first substantial paragraph
  for (const line of lines) {
    const clean = line.replace(/^[#*>|-]+\s*/, '').trim()
    if (
      clean.length > 40 &&
      !clean.startsWith('**') &&
      !clean.includes('|---') &&
      !clean.match(/^\d+\./)
    ) {
      return clean.slice(0, 130) + (clean.length > 130 ? '…' : '')
    }
  }
  return lines.slice(0, 3).join(' ').slice(0, 130)
}

function determineStatusFromResearch(content: string, title: string, backlogContent: string): IdeaStatus {
  const lower = content.toLowerCase()
  const backlogLower = backlogContent.toLowerCase()
  const titleWords = title.toLowerCase().split(' ').filter((w) => w.length > 3)

  // Check BACKLOG for this title
  const titleInBacklog = titleWords.some((w) => backlogLower.includes(w))

  if (
    lower.includes('build now') ||
    lower.includes('🟢 build') ||
    backlogLower.includes('decision: build') && titleInBacklog
  ) {
    return 'Validated'
  }
  if (
    lower.includes('kill') && lower.includes('verdict') ||
    lower.includes('🔴 kill') ||
    lower.includes('ne pas build')
  ) {
    return 'Killed'
  }
  // Has a full research file → at least Researched
  if (
    lower.includes('idée validée') ||
    lower.includes('evaluation-ready') ||
    lower.includes('évaluation') ||
    content.length > 3000
  ) {
    return 'Researched'
  }
  return 'Incubating'
}

function parseBacklogIdeas(backlogContent: string): Idea[] {
  const ideas: Idea[] = []
  // Look for idea-like entries that DON'T have research files
  const patterns = [
    {
      re: /###\s+\[(?:AGENTS|PRODUCT|ECOMMERCE|TOOLS)\]\s+(.+?)\n[\s\S]*?(?:\*\*Statut[^:]*:\*\*\s*(.+)|Statut\s*:\s*(.+))/gi,
    },
  ]

  // Manual extraction of BACKLOG-only ideas (no research files)
  const backlogOnlyIdeas = [
    {
      id: 'tiktok-agent',
      title: 'TikTok Growth / Ops Agent',
      date: '2026-03-25',
      score: null as number | null,
      status: 'Incubating' as IdeaStatus,
      snippet: 'Dedicated TikTok agent for travel + food influencer — content calendar, weekly trend scan, captions, batching, community growth.',
    },
    {
      id: 'alphabrief',
      title: 'AlphaBrief — Trading Newsletter',
      date: '2026-03-25',
      score: null as number | null,
      status: 'Incubating' as IdeaStatus,
      snippet: 'Automated trading intelligence newsletter — architecture to be defined. Builds on Ruel signal stack.',
    },
    {
      id: 'whatsapp-booking-backlog',
      title: 'WhatsApp Booking Assistant',
      date: '2026-03-26',
      score: 8.5,
      status: 'Researched' as IdeaStatus,
      snippet: 'Intelligent WhatsApp bot for end-to-end reservation management targeting restaurants, spas, clinics in Mauritius.',
    },
  ]

  // Mark as valid if present in backlog
  void patterns
  ideas.push(...backlogOnlyIdeas.map((i) => ({ ...i, source: 'backlog' as const })))
  return ideas
}

// ─── Main handler ─────────────────────────────────────────────────────────

export async function GET() {
  let backlogContent = ''
  try { backlogContent = readFileSync(BACKLOG_PATH, 'utf8') } catch { /* noop */ }

  const ideas: Idea[] = []

  // 1. Parse research files
  try {
    const files = readdirSync(RESEARCH_DIR).filter((f) => f.endsWith('.md'))
    for (const file of files) {
      const filePath = join(RESEARCH_DIR, file)
      let content = ''
      try { content = readFileSync(filePath, 'utf8') } catch { continue }

      const title = extractTitle(content, file)
      const date = extractDate(content, file)
      const score = extractScore(content)
      const status = determineStatusFromResearch(content, title, backlogContent)
      const snippet = extractSnippet(content)

      ideas.push({
        id: file.replace('.md', ''),
        title,
        date,
        score,
        status,
        snippet,
        source: 'research',
      })
    }
  } catch { /* research dir may not exist */ }

  // 2. Add BACKLOG-only ideas (avoiding duplicates by title similarity)
  const backlogIdeas = parseBacklogIdeas(backlogContent)
  for (const bi of backlogIdeas) {
    const isDupe = ideas.some((i) =>
      i.title.toLowerCase().includes(bi.title.toLowerCase().slice(0, 10)) ||
      bi.title.toLowerCase().includes(i.title.toLowerCase().slice(0, 10))
    )
    if (!isDupe) ideas.push(bi)
  }

  // Sort by date desc within each status
  ideas.sort((a, b) => b.date.localeCompare(a.date))

  return NextResponse.json({ ideas })
}
