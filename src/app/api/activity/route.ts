import { NextResponse } from 'next/server'
import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

interface ActivityEntry {
  agent: string
  content: string
  file: string
  timestamp?: string
}

export async function GET() {
  const agentsDir = '/root/.openclaw/workspace/agents'
  const entries: ActivityEntry[] = []

  try {
    const agents = readdirSync(agentsDir).filter(a => !['shared', 'repo'].includes(a))

    for (const agent of agents) {
      const memDir = join(agentsDir, agent, 'memory')
      try {
        statSync(memDir)
        const files = readdirSync(memDir)
        for (const file of files) {
          const filePath = join(memDir, file)
          try {
            const content = readFileSync(filePath, 'utf-8')
            const lines = content.split('\n').filter(l => l.trim()).slice(-5)
            for (const line of lines) {
              entries.push({ agent, content: line.trim(), file })
            }
          } catch {
            // skip unreadable files
          }
        }
      } catch {
        // no memory dir
      }
    }

    // Sort and limit
    const recent = entries.slice(-20).reverse()
    return NextResponse.json({ entries: recent })
  } catch (error) {
    return NextResponse.json({ entries: [], error: String(error) }, { status: 500 })
  }
}
