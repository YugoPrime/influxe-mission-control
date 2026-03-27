import { readFileSync } from 'fs'
import { NextResponse } from 'next/server'

export interface BacklogTask {
  id: string
  type: string
  title: string
  owner: string
  status: string
  description: string
  deadline?: string
  stack?: string
  column: string
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

export async function GET() {
  try {
    const content = readFileSync('/root/.openclaw/workspace/agents/shared/BACKLOG.md', 'utf-8')
    const lines = content.split('\n')
    const tasks: BacklogTask[] = []
    let currentTask: Partial<BacklogTask> | null = null
    let idCounter = 0

    for (const line of lines) {
      // Match task headers like ### [TYPE] Title
      const taskMatch = line.match(/^###\s+\[([^\]]+)\]\s+(.+)$/)
      if (taskMatch) {
        if (currentTask && currentTask.title) {
          tasks.push(currentTask as BacklogTask)
        }
        idCounter++
        currentTask = {
          id: `task-${idCounter}`,
          type: taskMatch[1],
          title: taskMatch[2].trim(),
          owner: '',
          status: 'backlog',
          description: '',
          column: 'backlog',
        }
        continue
      }

      if (currentTask) {
        const ownerMatch = line.match(/^\s*[-*]?\s*\*?\*?Owner:\*?\*?\s*(.+)$/i)
        if (ownerMatch) {
          currentTask.owner = ownerMatch[1].trim()
          continue
        }

        const statusMatch = line.match(/^\s*[-*]?\s*\*?\*?Statut:\*?\*?\s*(.+)$/i)
        if (statusMatch) {
          currentTask.status = statusMatch[1].trim()
          currentTask.column = parseStatus(statusMatch[1])
          continue
        }

        const descMatch = line.match(/^\s*[-*]?\s*\*?\*?Description:\*?\*?\s*(.+)$/i)
        if (descMatch) {
          currentTask.description = descMatch[1].trim()
          continue
        }

        const deadlineMatch = line.match(/^\s*[-*]?\s*\*?\*?Deadline:\*?\*?\s*(.+)$/i)
        if (deadlineMatch) {
          currentTask.deadline = deadlineMatch[1].trim()
          continue
        }

        const stackMatch = line.match(/^\s*[-*]?\s*\*?\*?Stack:\*?\*?\s*(.+)$/i)
        if (stackMatch) {
          currentTask.stack = stackMatch[1].trim()
          continue
        }
      }
    }

    // Push last task
    if (currentTask && currentTask.title) {
      tasks.push(currentTask as BacklogTask)
    }

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Backlog parse error:', error)
    return NextResponse.json({ tasks: [], error: String(error) }, { status: 500 })
  }
}
