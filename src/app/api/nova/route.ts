import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'

const NOVA_MEMORY = '/root/.openclaw/workspace/agents/nova/memory'

function readFileSafe(path: string): string {
  try {
    return readFileSync(path, 'utf-8')
  } catch {
    return ''
  }
}

function collectLines(dir: string): string[] {
  const lines: string[] = []
  try {
    // Main MEMORY.md
    const main = readFileSafe(join(dir, 'MEMORY.md'))
    lines.push(...main.split('\n').filter((l) => l.trim()))

    // daily/ folder
    const dailyDir = join(dir, 'daily')
    try {
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
  } catch { /* no memory dir */ }

  return lines
}

function extractCampaigns(lines: string[]): string[] {
  return lines
    .filter((l) => {
      const lower = l.toLowerCase()
      return (
        lower.includes('campaign') ||
        lower.includes('content') ||
        lower.includes('post') ||
        lower.includes('idea') ||
        lower.includes('tiktok') ||
        lower.includes('instagram') ||
        lower.includes('brand')
      )
    })
    .map((l) => l.replace(/^[-*#>]+\s*/, '').trim())
    .filter((l) => l.length > 10)
    .slice(0, 20)
}

export async function GET() {
  const lines = collectLines(NOVA_MEMORY)
  const campaigns = extractCampaigns(lines)
  const recentLog = lines
    .filter((l) => !l.startsWith('#'))
    .slice(-15)

  return NextResponse.json({ campaigns, recentLog })
}
