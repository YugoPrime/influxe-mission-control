import { TrendingUp, Clock, BookOpen, Radio, ArrowUpRight, ArrowDownRight } from 'lucide-react'

const BASE_URL = process.env.INTERNAL_URL || 'http://localhost:3000'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionInfo {
  status: 'OPEN' | 'CLOSED'
  nextAt: string
}

interface TradeEntry {
  date: string
  direction: 'BUY' | 'SELL' | string
  entry: string
  sl: string
  tp: string
  result: string
  notes: string
}

interface MemoryEntry {
  agent: string
  content: string
  timestamp: string
}

interface RuelData {
  gold: { price: string | null; change?: string }
  sessions: { london: SessionInfo; ny: SessionInfo }
  trades: TradeEntry[]
  recentMemory: MemoryEntry[]
}

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function getRuelData(): Promise<RuelData> {
  try {
    const res = await fetch(`${BASE_URL}/api/ruel`, { cache: 'no-store' })
    if (res.ok) return res.json()
  } catch {
    // fall through
  }
  return {
    gold: { price: null },
    sessions: {
      london: { status: 'CLOSED', nextAt: new Date().toISOString() },
      ny: { status: 'CLOSED', nextAt: new Date().toISOString() },
    },
    trades: [],
    recentMemory: [],
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCountdown(isoString: string): string {
  const diff = new Date(isoString).getTime() - Date.now()
  if (diff <= 0) return 'now'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 23) return `${Math.floor(h / 24)}d ago`
  if (h > 0) return `${h}h ago`
  if (m > 0) return `${m}m ago`
  return 'just now'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  label,
  color,
}: {
  icon: React.ElementType
  label: string
  color: string
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
        style={{
          background: `${color}18`,
          border: `1px solid ${color}30`,
        }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <span className="text-sm font-semibold" style={{ color: 'var(--mc-text-primary)' }}>
        {label}
      </span>
    </div>
  )
}

function SessionCard({
  name,
  hours,
  info,
}: {
  name: string
  hours: string
  info: SessionInfo
}) {
  const isOpen = info.status === 'OPEN'
  const statusColor = isOpen ? '#34d399' : '#94a3b8'
  const countdown = formatCountdown(info.nextAt)

  return (
    <div
      className="flex-1 p-4 rounded-xl"
      style={{
        background: 'var(--mc-card)',
        border: `1px solid ${isOpen ? 'rgba(245,158,11,0.3)' : 'var(--mc-card-border)'}`,
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}
          >
            {name}
          </p>
          <p
            className="text-xs font-mono mt-0.5"
            style={{ color: 'var(--mc-text-muted)' }}
          >
            {hours} UTC
          </p>
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{
            background: isOpen ? 'rgba(52,211,153,0.12)' : 'rgba(148,163,184,0.1)',
            border: `1px solid ${isOpen ? 'rgba(52,211,153,0.3)' : 'rgba(148,163,184,0.2)'}`,
            color: statusColor,
          }}
        >
          {info.status}
        </span>
      </div>
      <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--mc-card-border)' }}>
        <p className="text-xs" style={{ color: 'var(--mc-text-muted)' }}>
          {isOpen ? 'Closes' : 'Opens'} in
        </p>
        <p
          className="text-xl font-bold font-mono tracking-tight mt-0.5"
          style={{ color: isOpen ? '#f59e0b' : 'var(--mc-text-primary)' }}
        >
          {countdown}
        </p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function RuelPage() {
  const data = await getRuelData()
  const { gold, sessions, trades, recentMemory } = data

  const goldPrice = gold.price ? `$${Number(gold.price).toFixed(2)}` : '—'

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">

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
            <TrendingUp className="w-4.5 h-4.5 text-yellow-400" style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: 'var(--mc-text-primary)' }}
            >
              Ruel Panel
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--mc-text-muted)' }}>
              Trading command center — XAU/USD
            </p>
          </div>
        </div>
        <div
          className="text-xs px-3 py-1.5 rounded-full font-mono hidden md:block"
          style={{
            background: 'var(--mc-card)',
            border: '1px solid var(--mc-card-border)',
            color: 'var(--mc-text-muted)',
          }}
        >
          {new Date().toUTCString().replace(' GMT', ' UTC')}
        </div>
      </div>

      {/* ── Section 1: Trading Sessions ──────────────────────────────────── */}
      <div className="mc-card p-5">
        <SectionHeader icon={Clock} label="Trading Sessions" color="#f59e0b" />
        <div className="flex flex-col sm:flex-row gap-3">
          <SessionCard
            name="London Killzone"
            hours="07:00–10:00"
            info={sessions.london}
          />
          <SessionCard
            name="NY Killzone"
            hours="12:30–15:00"
            info={sessions.ny}
          />
        </div>
      </div>

      {/* ── Section 2: Live Stats Bar ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        {/* XAU/USD */}
        <div
          className="mc-card flex items-center gap-3 p-4"
          style={{}}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}
          >
            <TrendingUp className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <div
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}
            >
              XAU/USD
            </div>
            <div className="text-base font-bold font-mono text-yellow-400 mt-0.5">
              {goldPrice}
            </div>
          </div>
        </div>

        {/* Today P&L */}
        <div
          className="mc-card flex items-center gap-3 p-4"
          style={{}}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}
          >
            <ArrowUpRight className="w-4 h-4" style={{ color: '#34d399' }} />
          </div>
          <div>
            <div
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}
            >
              Today P&amp;L
            </div>
            <div
              className="text-base font-bold font-mono mt-0.5"
              style={{ color: 'var(--mc-text-muted)' }}
            >
              —
            </div>
          </div>
        </div>

        {/* Win rate */}
        <div
          className="mc-card flex items-center gap-3 p-4"
          style={{}}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <Radio className="w-4 h-4" style={{ color: '#3b82f6' }} />
          </div>
          <div>
            <div
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}
            >
              Win Rate
            </div>
            <div
              className="text-base font-bold font-mono mt-0.5"
              style={{ color: 'var(--mc-text-muted)' }}
            >
              —
            </div>
          </div>
        </div>

        {/* Open positions */}
        <div
          className="mc-card flex items-center gap-3 p-4"
          style={{}}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}
          >
            <ArrowDownRight className="w-4 h-4" style={{ color: '#f87171' }} />
          </div>
          <div>
            <div
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}
            >
              Open Positions
            </div>
            <div
              className="text-base font-bold font-mono mt-0.5"
              style={{ color: 'var(--mc-text-primary)' }}
            >
              0
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3 + 4: Journal + Intelligence (2-col) ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Trade Journal */}
        <div className="mc-card p-5">
          <SectionHeader icon={BookOpen} label="Trade Journal" color="#f59e0b" />

          {trades.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-10 rounded-lg"
              style={{ border: '1px dashed var(--mc-card-border)' }}
            >
              <BookOpen
                className="w-8 h-8 mb-3 opacity-30"
                style={{ color: 'var(--mc-text-muted)' }}
              />
              <p
                className="text-sm font-medium"
                style={{ color: 'var(--mc-text-muted)' }}
              >
                No trades logged yet
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: 'var(--mc-text-muted)', opacity: 0.6 }}
              >
                Trade entries will appear once logged in memory files
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--mc-card-border)' }}>
                    {['Date', 'Dir', 'Entry', 'SL', 'TP', 'Result', 'Notes'].map((h) => (
                      <th
                        key={h}
                        className="text-left py-2 pr-3 font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--mc-text-muted)', fontSize: '10px' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trades.slice(-20).map((trade, i) => {
                    const isBuy = trade.direction === 'BUY'
                    const dirColor = isBuy ? '#34d399' : '#f87171'
                    return (
                      <tr
                        key={i}
                        style={{ borderBottom: '1px solid var(--mc-card-border)', opacity: 0.9 }}
                      >
                        <td
                          className="py-2 pr-3 font-mono"
                          style={{ color: 'var(--mc-text-muted)' }}
                        >
                          {trade.date}
                        </td>
                        <td className="py-2 pr-3">
                          <span
                            className="text-xs font-bold px-1.5 py-0.5 rounded"
                            style={{
                              background: `${dirColor}18`,
                              border: `1px solid ${dirColor}35`,
                              color: dirColor,
                            }}
                          >
                            {trade.direction}
                          </span>
                        </td>
                        <td
                          className="py-2 pr-3 font-mono"
                          style={{ color: 'var(--mc-text-primary)' }}
                        >
                          {trade.entry}
                        </td>
                        <td
                          className="py-2 pr-3 font-mono"
                          style={{ color: '#f87171' }}
                        >
                          {trade.sl}
                        </td>
                        <td
                          className="py-2 pr-3 font-mono"
                          style={{ color: '#34d399' }}
                        >
                          {trade.tp}
                        </td>
                        <td
                          className="py-2 pr-3 font-mono"
                          style={{ color: 'var(--mc-text-muted)' }}
                        >
                          {trade.result}
                        </td>
                        <td
                          className="py-2 max-w-[140px] truncate"
                          style={{ color: 'var(--mc-text-muted)' }}
                        >
                          {trade.notes}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Intelligence Feed */}
        <div className="mc-card p-5">
          <SectionHeader icon={Radio} label="Agent Log" color="#f59e0b" />
          <div className="space-y-2.5">
            {recentMemory.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-10 rounded-lg"
                style={{ border: '1px dashed var(--mc-card-border)' }}
              >
                <Radio
                  className="w-8 h-8 mb-3 opacity-30"
                  style={{ color: 'var(--mc-text-muted)' }}
                />
                <p
                  className="text-sm font-medium"
                  style={{ color: 'var(--mc-text-muted)' }}
                >
                  No memory entries
                </p>
              </div>
            ) : (
              recentMemory.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 py-2.5"
                  style={{
                    borderBottom:
                      i < recentMemory.length - 1
                        ? '1px solid var(--mc-card-border)'
                        : 'none',
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                    style={{
                      background: '#f59e0b',
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: 'var(--mc-text-muted)' }}
                    >
                      {entry.content.slice(0, 120)}
                      {entry.content.length > 120 ? '…' : ''}
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: 'var(--mc-text-muted)', opacity: 0.5, fontSize: '10px' }}
                    >
                      {formatRelativeTime(entry.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
