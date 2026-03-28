import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'

const RESEARCH_DIR = '/root/.openclaw/workspace/agents/mastermind/research'
const MEMORY_DIR = '/root/.openclaw/workspace/agents/mastermind/memory'

export interface ResearchItem {
  title: string
  filename: string
  date: string
  score: number | null
  snippet: string
  status: string
}

function readFileSafe(path: string): string {
  try {
    return readFileSync(path, 'utf-8')
  } catch {
    return ''
  }
}

function extractScore(content: string): number | null {
  const match =
    content.match(/score[:\s]+(\d+(?:\.\d+)?)\/10/i) ||
    content.match(/(\d+(?:\.\d+)?)\/10/i) ||
    content.match(/score[:\s]+(\d+(?:\.\d+)?)/i)
  if (match) {
    const n = parseFloat(match[1])
    return n <= 10 ? n : null
  }
  return null
}

function extractStatus(content: string): string {
  if (/BUILD NOW|build now/i.test(content)) return 'BUILD NOW'
  if (/INCUBATE|incubate/i.test(content)) return 'INCUBATE'
  if (/PASS|pass/i.test(content)) return 'PASS'
  if (/Final/i.test(content)) return 'FINAL'
  return 'RESEARCH'
}

function parseResearch(): ResearchItem[] {
  try {
    const files = readdirSync(RESEARCH_DIR)
      .filter((f) => f.endsWith('.md'))
      .map((f) => {
        const path = join(RESEARCH_DIR, f)
        const stat = statSync(path)
        return { name: f, path, mtime: stat.mtimeMs, date: stat.mtime.toISOString().slice(0, 10) }
      })
      .sort((a, b) => b.mtime - a.mtime)

    return files.map(({ name, path, date }) => {
      const content = readFileSafe(path)
      const lines = content.split('\n').filter((l) => l.trim())

      // Title: first # heading or filename
      const headingLine = lines.find((l) => l.startsWith('# '))
      const title = headingLine
        ? headingLine.replace(/^#+\s*/, '').trim()
        : name.replace('.md', '').replace(/-/g, ' ')

      // Snippet: first 2 non-empty, non-heading lines
      const snippetLines = lines
        .filter((l) => !l.startsWith('#') && !l.startsWith('---') && l.trim().length > 20)
        .slice(0, 2)
      const snippet = snippetLines.join(' · ')

      const score = extractScore(content)
      const status = extractStatus(content)

      return { title, filename: name, date, score, snippet, status }
    })
  } catch {
    return []
  }
}

function collectMemoryLines(): string[] {
  const lines: string[] = []

  const mainMemory = readFileSafe(join(MEMORY_DIR, 'MEMORY.md'))
  lines.push(...mainMemory.split('\n').filter((l) => l.trim()))

  try {
    const dailyDir = join(MEMORY_DIR, 'daily')
    const files = readdirSync(dailyDir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => ({ name: f, mtime: statSync(join(dailyDir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, 10)

    for (const { name } of files) {
      const content = readFileSafe(join(dailyDir, name))
      lines.push(...content.split('\n').filter((l) => l.trim()))
    }
  } catch { /* no daily dir */ }

  return lines
}

export async function GET() {
  const research = parseResearch()
  const scoredIdeas = research.filter((r) => r.score !== null && r.score >= 7)
  const recentLog = collectMemoryLines()
    .filter((l) => !l.startsWith('#'))
    .slice(-20)

  return NextResponse.json({ research, scoredIdeas, recentLog })
}
