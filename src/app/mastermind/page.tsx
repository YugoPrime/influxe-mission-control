import { Brain, Search, Star, Radio } from 'lucide-react'

const BASE_URL = process.env.INTERNAL_URL || 'http://localhost:3000'
const MM_COLOR = '#f97316'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResearchItem {
  title: string
  filename: string
  date: string
  score: number | null
  snippet: string
  status: string
}

interface MastermindData {
  research: ResearchItem[]
  scoredIdeas: ResearchItem[]
  recentLog: string[]
}

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function getMastermindData(): Promise<MastermindData> {
  try {
    const res = await fetch(`${BASE_URL}/api/mastermind`, { cache: 'no-store' })
    if (res.ok) return res.json()
  } catch { /* fall through */ }
  return { research: [], scoredIdeas: [], recentLog: [] }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <span className="text-sm font-semibold" style={{ color: 'var(--mc-text-primary)' }}>
        {label}
      </span>
    </div>
  )
}

function EmptyState({ icon: Icon, message, sub }: { icon: React.ElementType; message: string; sub?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-8 rounded-lg"
      style={{ border: '1px dashed var(--mc-card-border)' }}
    >
      <Icon className="w-7 h-7 mb-2 opacity-25" style={{ color: 'var(--mc-text-muted)' }} />
      <p className="text-sm font-medium" style={{ color: 'var(--mc-text-muted)' }}>{message}</p>
      {sub && (
        <p className="text-xs mt-0.5" style={{ color: 'var(--mc-text-muted)', opacity: 0.6 }}>{sub}</p>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const colorMap: Record<string, { bg: string; border: string; color: string }> = {
    'BUILD NOW': { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', color: '#34d399' },
    'INCUBATE': { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', color: '#fbbf24' },
    'PASS': { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', color: '#f87171' },
    'FINAL': { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', color: '#a5b4fc' },
    'RESEARCH': { bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.3)', color: '#94a3b8' },
  }
  const c = colorMap[status] ?? colorMap['RESEARCH']
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}
    >
      {status}
    </span>
  )
}

function ResearchCard({ item, glow }: { item: ResearchItem; glow?: boolean }) {
  return (
    <div
      className="p-4 rounded-lg"
      style={{
        background: 'var(--mc-card)',
        border: `1px solid ${glow ? 'rgba(249,115,22,0.3)' : 'var(--mc-card-border)'}`,
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--mc-text-primary)' }}>
          {item.title}
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          {item.score !== null && (
            <span
              className="text-xs font-bold font-mono px-2 py-0.5 rounded"
              style={{
                background: item.score >= 7 ? 'rgba(249,115,22,0.15)' : 'rgba(100,116,139,0.12)',
                color: item.score >= 7 ? MM_COLOR : '#94a3b8',
                border: `1px solid ${item.score >= 7 ? 'rgba(249,115,22,0.3)' : 'rgba(100,116,139,0.2)'}`,
              }}
            >
              {item.score}/10
            </span>
          )}
          <StatusPill status={item.status} />
        </div>
      </div>
      {item.snippet && (
        <p className="text-xs leading-relaxed mb-2" style={{ color: 'var(--mc-text-muted)' }}>
          {item.snippet.slice(0, 160)}{item.snippet.length > 160 ? '…' : ''}
        </p>
      )}
      <p
        className="text-xs font-mono"
        style={{ color: 'var(--mc-text-muted)', opacity: 0.5, fontSize: '10px' }}
      >
        {item.date}
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MastermindPage() {
  const { research, scoredIdeas, recentLog } = await getMastermindData()

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">

      {/* Page heading */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `${MM_COLOR}1e`,
            border: `1px solid ${MM_COLOR}40`,
          }}
        >
          <Brain className="w-[18px] h-[18px]" style={{ color: MM_COLOR }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--mc-text-primary)' }}>
            Mastermind Panel
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--mc-text-muted)' }}>
            Chief Intelligence Officer — research and opportunities
          </p>
        </div>
      </div>

      {/* ── Research Queue ─────────────────────────────────────────────────── */}
      <div className="mc-card p-5">
        <SectionHeader icon={Search} label="Research Queue" color={MM_COLOR} />
        {research.length === 0 ? (
          <EmptyState
            icon={Search}
            message="No research files found"
            sub="Drop .md files into agents/mastermind/research/ to populate"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {research.map((item) => (
              <ResearchCard key={item.filename} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* ── Scored Ideas ───────────────────────────────────────────────────── */}
      <div className="mc-card p-5">
        <SectionHeader icon={Star} label="Scored Ideas (7+)" color={MM_COLOR} />
        {scoredIdeas.length === 0 ? (
          <EmptyState
            icon={Star}
            message="No high-score ideas yet"
            sub="Research files scoring 7/10 or higher will appear here"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {scoredIdeas.map((item) => (
              <ResearchCard key={item.filename} item={item} glow />
            ))}
          </div>
        )}
      </div>

      {/* ── Intelligence Feed ──────────────────────────────────────────────── */}
      <div className="mc-card p-5">
        <SectionHeader icon={Radio} label="Intelligence Feed" color={MM_COLOR} />
        {recentLog.length === 0 ? (
          <EmptyState
            icon={Radio}
            message="No intelligence entries"
            sub="Mastermind memory files will stream here"
          />
        ) : (
          <div className="space-y-0">
            {recentLog.map((line, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 py-2"
                style={{
                  borderBottom: i < recentLog.length - 1 ? '1px solid var(--mc-card-border)' : 'none',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{
                    background: MM_COLOR,
                  }}
                />
                <p
                  className="text-xs leading-relaxed flex-1"
                  style={{ color: 'var(--mc-text-muted)' }}
                >
                  {line}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
