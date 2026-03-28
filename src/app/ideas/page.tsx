import { Lightbulb, FlaskConical, Search, CheckCircle2, XCircle } from 'lucide-react'

const BASE_URL = process.env.INTERNAL_URL || 'http://localhost:3000'

// ─── Types ─────────────────────────────────────────────────────────────────

type IdeaStatus = 'Incubating' | 'Researched' | 'Validated' | 'Killed'

interface Idea {
  id: string
  title: string
  date: string
  score: number | null
  status: IdeaStatus
  snippet: string
  source: 'research' | 'backlog'
}

// ─── Data fetch ─────────────────────────────────────────────────────────────

async function getIdeas(): Promise<Idea[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/ideas`, { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      return data.ideas ?? []
    }
  } catch { /* fall through */ }
  return []
}

// ─── Column config ──────────────────────────────────────────────────────────

const COLUMNS: {
  status: IdeaStatus
  label: string
  icon: React.ElementType
  color: string
  description: string
}[] = [
  {
    status: 'Incubating',
    label: 'Incubating',
    icon: FlaskConical,
    color: '#8b5cf6',
    description: 'Raw ideas, not yet researched',
  },
  {
    status: 'Researched',
    label: 'Researched',
    icon: Search,
    color: '#3b82f6',
    description: 'Full market analysis done',
  },
  {
    status: 'Validated',
    label: 'Validated',
    icon: CheckCircle2,
    color: '#34d399',
    description: 'Decision: Build',
  },
  {
    status: 'Killed',
    label: 'Killed',
    icon: XCircle,
    color: '#f87171',
    description: 'Decided not to pursue',
  },
]

// ─── Sub-components ─────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return null
  const color = score >= 8 ? '#34d399' : score >= 6.5 ? '#fbbf24' : '#f87171'
  return (
    <span
      className="text-xs font-bold font-mono px-1.5 py-0.5 rounded"
      style={{
        background: `${color}18`,
        border: `1px solid ${color}35`,
        color,
        fontSize: '10px',
      }}
    >
      {score}/10
    </span>
  )
}

function IdeaCard({ idea }: { idea: Idea }) {
  return (
    <div
      className="p-3.5 rounded-xl"
      style={{
        background: 'var(--mc-card)',
        border: '1px solid var(--mc-card-border)',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p
          className="text-sm font-semibold leading-tight flex-1"
          style={{ color: 'var(--mc-text-primary)' }}
        >
          {idea.title}
        </p>
        <ScoreBadge score={idea.score} />
      </div>
      <p
        className="text-xs leading-relaxed mb-2"
        style={{ color: 'var(--mc-text-muted)' }}
      >
        {idea.snippet}
      </p>
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-mono"
          style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}
        >
          {idea.date}
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded"
          style={{
            background: idea.source === 'research' ? 'rgba(59,130,246,0.1)' : 'rgba(148,163,184,0.1)',
            border: `1px solid ${idea.source === 'research' ? 'rgba(59,130,246,0.25)' : 'rgba(148,163,184,0.2)'}`,
            color: idea.source === 'research' ? '#3b82f6' : 'var(--mc-text-muted)',
            fontSize: '10px',
          }}
        >
          {idea.source}
        </span>
      </div>
    </div>
  )
}

function PipelineColumn({
  config,
  ideas,
}: {
  config: (typeof COLUMNS)[number]
  ideas: Idea[]
}) {
  const { icon: Icon, color, label, description } = config
  return (
    <div className="flex flex-col min-w-0">
      {/* Column header */}
      <div
        className="flex items-center gap-2 px-1 pb-3 mb-3"
        style={{ borderBottom: `1px solid var(--mc-card-border)` }}
      >
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}
        >
          <Icon className="w-3 h-3" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold" style={{ color: 'var(--mc-text-primary)' }}>
              {label}
            </span>
            <span
              className="text-xs font-mono px-1.5 py-0.5 rounded-full"
              style={{
                background: `${color}18`,
                color,
                fontSize: '10px',
              }}
            >
              {ideas.length}
            </span>
          </div>
          <p className="text-xs truncate" style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}>
            {description}
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-3 flex-1">
        {ideas.length === 0 ? (
          <div
            className="flex items-center justify-center py-6 rounded-lg"
            style={{ border: '1px dashed var(--mc-card-border)' }}
          >
            <p className="text-xs" style={{ color: 'var(--mc-text-muted)', opacity: 0.5 }}>
              Empty
            </p>
          </div>
        ) : (
          ideas.map((idea) => <IdeaCard key={idea.id} idea={idea} />)
        )}
      </div>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function IdeasPage() {
  const ideas = await getIdeas()

  const totalValidated = ideas.filter((i) => i.status === 'Validated').length
  const avgScore = (() => {
    const scored = ideas.filter((i) => i.score !== null)
    if (scored.length === 0) return null
    return (scored.reduce((s, i) => s + (i.score ?? 0), 0) / scored.length).toFixed(1)
  })()

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Page heading */}
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.25)',
            }}
          >
            <Lightbulb className="w-[18px] h-[18px]" style={{ color: '#f59e0b' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--mc-text-primary)' }}>
              Ideas Pipeline
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--mc-text-muted)' }}>
              Mastermind research — from concept to decision
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <div
            className="text-xs px-3 py-1.5 rounded-full font-mono"
            style={{
              background: 'var(--mc-card)',
              border: '1px solid var(--mc-card-border)',
              color: 'var(--mc-text-muted)',
            }}
          >
            {ideas.length} idea{ideas.length !== 1 ? 's' : ''}
          </div>
          {avgScore && (
            <div
              className="text-xs px-3 py-1.5 rounded-full font-mono"
              style={{
                background: 'rgba(52,211,153,0.08)',
                border: '1px solid rgba(52,211,153,0.2)',
                color: '#34d399',
              }}
            >
              avg {avgScore}/10
            </div>
          )}
          {totalValidated > 0 && (
            <div
              className="text-xs px-3 py-1.5 rounded-full font-mono"
              style={{
                background: 'rgba(52,211,153,0.08)',
                border: '1px solid rgba(52,211,153,0.2)',
                color: '#34d399',
              }}
            >
              {totalValidated} validated
            </div>
          )}
        </div>
      </div>

      {/* Pipeline board — 4 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {COLUMNS.map((col) => (
          <PipelineColumn
            key={col.status}
            config={col}
            ideas={ideas.filter((i) => i.status === col.status)}
          />
        ))}
      </div>
    </div>
  )
}
