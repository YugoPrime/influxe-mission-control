import { Heart, CalendarDays, Radio, FileText, Flame } from 'lucide-react'

const BASE_URL = process.env.INTERNAL_URL || 'http://localhost:3000'

// ─── Types ─────────────────────────────────────────────────────────────────

interface AmaliaData {
  brief: { lines: string[]; source: string | null }
  trading: {
    streak: number
    calendar: { date: string; done: boolean }[]
    hasData: boolean
  }
  recentLog: string[]
}

// ─── Data fetch ─────────────────────────────────────────────────────────────

async function getAmaliaData(): Promise<AmaliaData> {
  try {
    const res = await fetch(`${BASE_URL}/api/amalia`, { cache: 'no-store' })
    if (res.ok) return res.json()
  } catch { /* fall through */ }
  return {
    brief: { lines: [], source: null },
    trading: { streak: 0, calendar: [], hasData: false },
    recentLog: [],
  }
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  label,
  color,
  badge,
}: {
  icon: React.ElementType
  label: string
  color: string
  badge?: string
}) {
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
      {badge && (
        <span
          className="ml-auto text-xs px-2 py-0.5 rounded-full font-mono"
          style={{
            background: 'var(--mc-card)',
            border: '1px solid var(--mc-card-border)',
            color: 'var(--mc-text-muted)',
            fontSize: '10px',
          }}
        >
          {badge}
        </span>
      )}
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

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function AmaliaPage() {
  const data = await getAmaliaData()
  const { brief, trading, recentLog } = data

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">

      {/* Page heading */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'rgba(20,184,166,0.12)',
            border: '1px solid rgba(20,184,166,0.25)',
          }}
        >
          <Heart className="w-[18px] h-[18px]" style={{ color: '#14b8a6' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--mc-text-primary)' }}>
            Amalia
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--mc-text-muted)' }}>
            Chief of Staff — daily brief &amp; routine tracker
          </p>
        </div>
      </div>

      {/* ── Top row: Brief + Discipline ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Today's Brief */}
        <div className="mc-card p-5">
          <SectionHeader
            icon={FileText}
            label="Today's Brief"
            color="#14b8a6"
            badge={brief.source ?? undefined}
          />
          {brief.lines.length === 0 ? (
            <EmptyState
              icon={FileText}
              message="No brief available"
              sub="Create a daily log in agents/amalia/memory/daily/"
            />
          ) : (
            <div
              className="rounded-lg p-4 space-y-1 overflow-y-auto max-h-64"
              style={{
                background: 'var(--mc-card)',
                border: '1px solid var(--mc-card-border)',
                fontFamily: 'var(--font-geist-mono)',
              }}
            >
              {brief.lines.map((line, i) => (
                <p
                  key={i}
                  className="text-xs leading-relaxed"
                  style={{
                    color: line.startsWith('#')
                      ? 'var(--mc-text-primary)'
                      : line.startsWith('-') || line.startsWith('*')
                      ? 'var(--mc-text-primary)'
                      : 'var(--mc-text-muted)',
                    fontWeight: line.startsWith('#') ? 600 : 400,
                  }}
                >
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Trading Discipline Tracker */}
        <div className="mc-card p-5">
          <SectionHeader icon={CalendarDays} label="Trading Discipline" color="#f59e0b" />

          {!trading.hasData ? (
            <EmptyState
              icon={Flame}
              message="No routine data yet"
              sub="Trading session entries will appear once logged"
            />
          ) : (
            <>
              {/* Streak count */}
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
                  style={{
                    background: trading.streak > 0 ? 'rgba(245,158,11,0.1)' : 'var(--mc-card)',
                    border: `1px solid ${trading.streak > 0 ? 'rgba(245,158,11,0.3)' : 'var(--mc-card-border)'}`,
                  }}
                >
                  <Flame
                    className="w-4 h-4"
                    style={{ color: trading.streak > 0 ? '#f59e0b' : 'var(--mc-text-muted)' }}
                  />
                  <span
                    className="text-2xl font-bold font-mono"
                    style={{ color: trading.streak > 0 ? '#f59e0b' : 'var(--mc-text-muted)' }}
                  >
                    {trading.streak}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--mc-text-muted)' }}>
                    day streak
                  </span>
                </div>
              </div>

              {/* 7-day calendar */}
              <div className="grid grid-cols-7 gap-1.5">
                {trading.calendar.map((day, i) => {
                  const label = dayLabels[new Date(day.date + 'T12:00:00').getDay() === 0 ? 6 : new Date(day.date + 'T12:00:00').getDay() - 1]
                  return (
                    <div key={day.date} className="flex flex-col items-center gap-1">
                      <span
                        className="text-xs"
                        style={{ color: 'var(--mc-text-muted)', fontSize: '9px' }}
                      >
                        {label}
                      </span>
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{
                          background: day.done ? 'rgba(52,211,153,0.15)' : 'var(--mc-card)',
                          border: `1px solid ${day.done ? 'rgba(52,211,153,0.4)' : 'var(--mc-card-border)'}`,
                          color: day.done ? '#34d399' : 'var(--mc-text-muted)',
                        }}
                      >
                        {day.done ? '✓' : new Date(day.date + 'T12:00:00').getDate()}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Recent Agent Log ──────────────────────────────────────────────── */}
      <div className="mc-card p-5">
        <SectionHeader icon={Radio} label="Recent Agent Log" color="#14b8a6" />
        {recentLog.length === 0 ? (
          <EmptyState
            icon={Radio}
            message="No log entries"
            sub="Memory file entries will stream here"
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
                    background: '#14b8a6',
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
