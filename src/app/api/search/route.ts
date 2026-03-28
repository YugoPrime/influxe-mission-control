import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getEmbedding } from '@/lib/embeddings'

interface SearchResult {
  id: string
  agentId: string
  action: string
  content: string
  createdAt: Date
  similarity: number
}

export async function POST(req: NextRequest) {
  try {
    const { query, agentId, limit = 10 } = await req.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'query is required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })
    }

    const embedding = await getEmbedding(query)
    const vectorStr = `[${embedding.join(',')}]`

    const results = await prisma.$queryRaw<SearchResult[]>`
      SELECT id, "agentId", action, content, "createdAt",
        1 - (embedding <=> ${vectorStr}::vector) as similarity
      FROM "AgentActivity"
      WHERE embedding IS NOT NULL
        AND (${agentId ?? null}::text IS NULL OR "agentId" = ${agentId ?? null})
      ORDER BY embedding <=> ${vectorStr}::vector
      LIMIT ${limit}
    `

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
