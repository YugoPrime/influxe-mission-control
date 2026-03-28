import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const connectionString = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5433/mission_control'
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

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

async function seedProjects() {
  const content = readSafe(BACKLOG_PATH)
  if (!content) { console.log('⚠ BACKLOG.md not found, skipping projects'); return 0 }

  const lines = content.split('\n')
  const tasks: Array<{
    title: string; type: string; owner: string; status: string
    description: string; deadline?: string; stack?: string; column: string
  }> = []
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
      const stackM = line.match(/^\s*[-*]?\s*\*?\*?Stack:\*?\*?\s*(.+)$/i)
      if (stackM) { current.stack = stackM[1].trim(); continue }
    }
  }
  if (current?.title) tasks.push(current)

  let count = 0
  for (const task of tasks) {
    await prisma.project.upsert({
      where: { id: `backlog-${task.title.toLowerCase().replace(/\s+/g, '-').slice(0, 40)}` },
      update: { title: task.title, description: task.description, owner: task.owner, deadline: task.deadline, status: task.column, category: task.type },
      create: {
        id: `backlog-${task.title.toLowerCase().replace(/\s+/g, '-').slice(0, 40)}`,
        title: task.title, description: task.description, owner: task.owner, deadline: task.deadline,
        status: task.column, category: task.type, priority: 'normal',
      },
    })
    count++
  }
  console.log(`✓ Projects: ${count} seeded`)
  return count
}

async function seedHandoffs() {
  const content = readSafe(INBOX_PATH)
  if (!content) { console.log('⚠ INBOX.md not found, skipping handoffs'); return 0 }

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

    const from = fromM?.[1]?.trim() ?? 'unknown'
    const to = toM?.[1]?.trim() ?? 'unknown'
    const acked = ackedM?.[1]?.trim() ?? ''
    const sentStr = sentM?.[1]?.trim() ?? new Date().toISOString()
    let sentAt: Date
    try { sentAt = new Date(sentStr) } catch { sentAt = new Date() }
    if (isNaN(sentAt.getTime())) sentAt = new Date()

    await prisma.handoff.upsert({
      where: { handoffId },
      update: { fromAgent: from, toAgent: to, summary: summaryM?.[1]?.trim() ?? '', status: (acked && acked !== '—') ? 'ACKED' : 'PENDING' },
      create: {
        handoffId, fromAgent: from, toAgent: to,
        type: typeM?.[1]?.trim() ?? 'task',
        summary: summaryM?.[1]?.trim() ?? '',
        status: (acked && acked !== '—') ? 'ACKED' : 'PENDING',
        sentAt,
        ackedAt: (acked && acked !== '—') ? new Date() : null,
      },
    })
    count++
  }
  console.log(`✓ Handoffs: ${count} seeded`)
  return count
}

function extractScore(content: string): number | null {
  const patterns = [
    /Score global[^:]*[:\s]+\*?\*?([\d.]+)\/10/i,
    /score\s*:?\s*([\d.]+)\s*\/\s*10/i,
    /\*\*([\d.]+)\/10\*\*/,
    /([\d.]+)\/10\b/,
  ]
  for (const pat of patterns) {
    const m = content.match(pat)
    if (m) { const n = parseFloat(m[1]); if (n >= 1 && n <= 10) return n }
  }
  return null
}

function extractStatus(content: string): string {
  if (/BUILD NOW/i.test(content)) return 'build_now'
  if (/INCUBATE/i.test(content)) return 'incubating'
  if (/validated|idée validée/i.test(content)) return 'validated'
  if (/KILL|ne pas build/i.test(content)) return 'killed'
  if (/RESEARCH/i.test(content) || content.length > 3000) return 'researched'
  return 'incubating'
}

async function seedResearchIdeas() {
  let count = 0
  try {
    const files = readdirSync(RESEARCH_DIR).filter(f => f.endsWith('.md'))
    for (const file of files) {
      const content = readSafe(join(RESEARCH_DIR, file))
      if (!content) continue
      const h1 = content.match(/^#\s+(.+)$/m)
      const title = h1 ? h1[1].replace(/\*\*/g, '').trim() : file.replace('.md', '').replace(/[-_]/g, ' ')
      const score = extractScore(content)
      const status = extractStatus(content)
      const lines = content.split('\n').filter(l => l.trim().length > 0)
      const snippetLines = lines.filter(l => !l.startsWith('#') && !l.startsWith('---') && l.trim().length > 20).slice(0, 2)
      const snippet = snippetLines.join(' · ').slice(0, 500)
      const id = file.replace('.md', '')

      await prisma.researchIdea.upsert({
        where: { id },
        update: { title, score, status, snippet, sourceFile: file },
        create: { id, title, score, status, snippet, sourceFile: file },
      })
      count++
    }
  } catch { console.log('⚠ Research dir not found, skipping') }
  console.log(`✓ ResearchIdeas: ${count} seeded`)
  return count
}

async function seedAgentActivity() {
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
  } catch { console.log('⚠ Agents dir not found, skipping') }
  console.log(`✓ AgentActivity: ${count} seeded`)
  return count
}

async function main() {
  console.log('🌱 Seeding Mission Control database...')
  await seedProjects()
  await seedHandoffs()
  await seedResearchIdeas()
  await seedAgentActivity()
  console.log('✅ Seed complete')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
