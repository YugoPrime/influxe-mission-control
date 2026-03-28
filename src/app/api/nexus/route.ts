import { readFileSync } from 'fs'
import { NextResponse } from 'next/server'

export interface HandoffEntry {
  id: string
  from: string
  to: string
  summary: string
  status: string
  sent: string
}

function parseInbox(): HandoffEntry[] {
  try {
    const content = readFileSync('/root/.openclaw/workspace/agents/shared/INBOX.md', 'utf-8')
    const blocks = content.split(/\n---\n/)
    const handoffs: HandoffEntry[] = []

    for (const block of blocks) {
      const idMatch = block.match(/##\s+\[([^\]]+)\]\s*(\w+)?/)
      if (!idMatch) continue

      const fromMatch = block.match(/^-\s*From:\s*(.+)$/m)
      const toMatch = block.match(/^-\s*To:\s*(.+)$/m)
      const summaryMatch = block.match(/^-\s*Summary:\s*(.+)$/m)
      const sentMatch = block.match(/^-\s*Sent:\s*(.+)$/m)
      const ackedMatch = block.match(/^-\s*Acked:\s*(.+)$/m)

      const from = fromMatch?.[1]?.trim() ?? ''
      const to = toMatch?.[1]?.trim() ?? ''

      if (!from.includes('nexus') && !to.includes('nexus')) continue

      const acked = ackedMatch?.[1]?.trim() ?? ''
      const status = acked && acked !== '—' ? 'ACKED' : 'PENDING'

      handoffs.push({
        id: idMatch[1].trim(),
        from,
        to,
        summary: summaryMatch?.[1]?.trim() ?? '',
        status,
        sent: sentMatch?.[1]?.trim() ?? '',
      })
    }

    return handoffs.slice(-15)
  } catch {
    return []
  }
}

export async function GET() {
  const handoffs = parseInbox()
  return NextResponse.json({ handoffs })
}
