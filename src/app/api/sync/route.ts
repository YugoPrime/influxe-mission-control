import { NextResponse } from 'next/server'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { prisma } from '@/lib/prisma'

const BACKLOG_PATH = '/root/.openclaw/workspace/agents/shared/BACKLOG.md'
const INBOX_PATH = '/root/.openclaw/workspace/agents/shared/INBOX.md'
const RESEARCH_DIR = '/root/.openclaw/workspace/agents/mastermind/research'
const AGENTS_DIR = '/root/.openclaw/workspace/agents'

function readSafe(path: string): string {
  try { return readFileSync(path, 'utf-8') } catch { return '' }
}

function parseStatus(status: string): string {
  if (!status) return 'backlog'
  const s = status.toLowerCase()
  if (s.includes('done') || s.includes('✅')) return 'done'
  if (s.includes('in progress') || s.includes('🔄') || s.includes('en cours')) return 'in-progress'
  if (s.includes('blocked') || s.includes('🔴') || s.includes('bloqué')) return 'blocked'
  if (s.includes('partial') || s.includes('🟡')) return 'in-progress'
  if (s.includes('not started') || s.includes('⏳')) return 'todo'
  return 'backlog'
}

async function syncProjects() {
  const content = readSafe(BACKLOG_PATH)
  if (!content) return 0
  const lines = content.split('\n')
  const tasks: Array<{ title: string; type: string; owner: string; status: string; description: string; deadline?: string; column: string }> = []
  let current: typeof tasks[0] | null = null

  for (const line of lines) {
    const m = line.match(/^###\s+\[([^\]]+)\]\s+(.+)$/)
    if (m) {
      if (current?.title) tasks.push(current)
      current = { title: m[2].trim(), type: m[1], owner: '', status: 'backlog', description: '', column: 'backlog' }
      continue
    }
    if (current) {
      const ownerM = line.match(/^\s*[-*]?\s*\*?\*?Owner:\*?\*?\s*(.+)$/i)
      if (ownerM) { current.owner = ownerM[1].trim(); continue }
      const statusM = line.match(/^\s*[-*]?\s*\*?\*?Statut:\*?\*?\s*(.+)$/i)
      if (statusM) { current.status = statusM[1].trim(); current.column = parseStatus(statusM[1]); continue }
      const descM = line.match(/^\s*[-*]?\s*\*?\*?Description:\*?\*?\s*(.+)$/i)
      if (descM) { current.description = descM[1].trim(); continue }
      const deadlineM = line.match(/^\s*[-*]?\s*\*?\*?Deadline:\*?\*?\s*(.+)$/i)
      if (deadlineM) { current.deadline = deadlineM[1].trim(); continue }
    }
  }
  if (current?.title) tasks.push(current)

  let count = 0
  for (const task of tasks) {
    const id = `backlog-${task.title.toLowerCase().replace(/\s+/g, '-').slice(0, 40)}`
    await prisma.project.upsert({
      where: { id },
      update: { title: task.title, description: task.description, owner: task.owner, deadline: task.deadline, status: task.column, category: task.type },
      create: { id, title: task.title, description: task.description, owner: task.owner, deadline: task.deadline, status: task.column, category: task.type, priority: 'normal' },
    })
    count++
  }
  return count
}

async function syncHandoffs() {
  const content = readSafe(INBOX_PATH)
  if (!content) return 0
  const blocks = content.split(/\n---\n/)
  let count = 0
  for (const block of blocks) {
    const idM = block.match(/##\s+\[([^\]]+)\]/)
    if (!idM) continue
    const handoffId = idM[1].trim()
    const fromM = block.match(/^-\s*From:\s*(.+)$/m)
    const toM = block.match(/^-\s*To:\s*(.+)$/m)
    const summaryM = block.match(/^-\s*Summary:\s*(.+)$/m)
    const sentM = block.match(/^-\s*Sent:\s*(.+)$/m)
    const ackedM = block.match(/^-\s*Acked:\s*(.+)$/m)
    const typeM = block.match(/^-\s*Type:\s*(.+)$/m)
    const acked = ackedM?.[1]?.trim() ?? ''
    const sentStr = sentM?.[1]?.trim() ?? new Date().toISOString()
    let sentAt: Date
    try { sentAt = new Date(sentStr) } catch { sentAt = new Date() }
    if (isNaN(sentAt.getTime())) sentAt = new Date()
    await prisma.handoff.upsert({
      where: { handoffId },
      update: { fromAgent: fromM?.[1]?.trim() ?? 'unknown', toAgent: toM?.[1]?.trim() ?? 'unknown', summary: summaryM?.[1]?.trim() ?? '', status: (acked && acked !== '—') ? 'ACKED' : 'PENDING' },
      create: { handoffId, fromAgent: fromM?.[1]?.trim() ?? 'unknown', toAgent: toM?.[1]?.trim() ?? 'unknown', type: typeM?.[1]?.trim() ?? 'task', summary: summaryM?.[1]?.trim() ?? '', status: (acked && acked !== '—') ? 'ACKED' : 'PENDING', sentAt, ackedAt: (acked && acked !== '—') ? new Date() : null },
    })
    count++
  }
  return count
}

function extractScore(content: string): number | null {
  const patterns = [/Score global[^:]*[:\s]+\*?\*?([\d.]+)\/10/i, /score\s*:?\s*([\d.]+)\s*\/\s*10/i, /\*\*([\d.]+)\/10\*\*/, /([\d.]+)\/10\b/]
  for (const pat of patterns) {
    const m = content.match(pat)
    if (m) { const n = parseFloat(m[1]); if (n >= 1 && n <= 10) return n }
  }
  return null
}

async function syncResearch() {
  let count = 0
  try {
    const files = readdirSync(RESEARCH_DIR).filter(f => f.endsWith('.md'))
    for (const file of files) {
      const content = readSafe(join(RESEARCH_DIR, file))
      if (!content) continue
      const h1 = content.match(/^#\s+(.+)$/m)
      const title = h1 ? h1[1].replace(/\*\*/g, '').trim() : file.replace('.md', '').replace(/[-_]/g, ' ')
      const score = extractScore(content)
      let status = 'incubating'
      if (/BUILD NOW/i.test(content)) status = 'build_now'
      else if (/INCUBATE/i.test(content)) status = 'incubating'
      else if (/validated/i.test(content)) status = 'validated'
      else if (/KILL/i.test(content)) status = 'killed'
      else if (content.length > 3000) status = 'researched'
      const snippetLines = content.split('\n').filter(l => !l.startsWith('#') && l.trim().length > 20).slice(0, 2)
      await prisma.researchIdea.upsert({
        where: { id: file.replace('.md', '') },
        update: { title, score, status, snippet: snippetLines.join(' · ').slice(0, 500) },
        create: { id: file.replace('.md', ''), title, score, status, snippet: snippetLines.join(' · ').slice(0, 500), sourceFile: file },
      })
      count++
    }
  } catch { /* dir not found */ }
  return count
}

async function syncActivity() {
  let count = 0
  try {
    const agents = readdirSync(AGENTS_DIR).filter(a => !['shared', 'repo'].includes(a))
    for (const agent of agents) {
      const memDir = join(AGENTS_DIR, agent, 'memory')
      try {
        statSync(memDir)
        const files = readdirSync(memDir)
        for (const file of files) {
          const filePath = join(memDir, file)
          try {
            if (statSync(filePath).isDirectory()) continue
            const content = readSafe(filePath)
            const lines = content.split('\n').filter(l => l.trim().length > 10).slice(-5)
            for (const line of lines) {
              await prisma.agentActivity.create({
                data: { agentId: agent, action: 'log', content: line.trim(), metadata: { file } },
              })
              count++
            }
          } catch { /* skip */ }
        }
      } catch { /* no memory dir */ }
    }
  } catch { /* agents dir not found */ }
  return count
}

export async function POST() {
  try {
    const [projects, handoffs, research, activity] = await Promise.all([
      syncProjects(),
      syncHandoffs(),
      syncResearch(),
      syncActivity(),
    ])
    return NextResponse.json({ success: true, synced: { projects, handoffs, research, activity } })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
