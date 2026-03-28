import { Megaphone, CalendarRange, Globe, Lightbulb, Radio } from 'lucide-react'

const BASE_URL = process.env.INTERNAL_URL || 'http://localhost:3000'
const NOVA_COLOR = '#ec4899'

// ─── Types ────────────────────────────────────────────────────────────────────

interface NovaData {
  campaigns: string[]
  recentLog: string[]
}

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function getNovaData(): Promise<NovaData> {
  try {
    const res = await fetch(`${BASE_URL}/api/nova`, { cache: 'no-store' })
    if (res.ok) return res.json()
  } catch { /* fall through */ }
  return { campaigns: [], recentLog: [] }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getWeekDays(): string[] {
  const today = new Date()
  const dow = today.getDay() // 0=Sun
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dow + 6) % 7))
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return days.map((label, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return `${label} ${d.getDate()}`
  })
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function NovaPage() {
  const { campaigns, recentLog } = await getNovaData()
  const weekDays = getWeekDays()

  const brandAccounts = [
    { platform: 'Instagram', account: 'DollUp Boutique', status: 'active' },
    { platform: 'Website', account: 'Influxe', status: 'active' },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">

      {/* Page heading */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `${NOVA_COLOR}1e`,
            border: `1px solid ${NOVA_COLOR}40`,
          }}
        >
          <Megaphone className="w-[18px] h-[18px]" style={{ color: NOVA_COLOR }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--mc-text-primary)' }}>
            Nova Panel
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--mc-text-muted)' }}>
            Chief Marketing Officer — content and campaigns
          </p>
        </div>
      </div>

      {/* ── Content Calendar ───────────────────────────────────────────────── */}
      <div className="mc-card p-5">
        <SectionHeader icon={CalendarRange} label="Content Calendar" color={NOVA_COLOR} />
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="flex flex-col items-center gap-2 p-3 rounded-lg min-h-[80px]"
              style={{ background: 'var(--mc-card)', border: '1px solid var(--mc-card-border)' }}
            >
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'var(--mc-text-muted)', fontSize: '9px' }}
              >
                {day}
              </span>
              <p
                className="text-xs text-center leading-relaxed mt-1"
                style={{ color: 'var(--mc-text-muted)', opacity: 0.5, fontSize: '10px' }}
              >
                —
              </p>
            </div>
          ))}
        </div>
        <p
          className="text-xs mt-3 text-center"
          style={{ color: 'var(--mc-text-muted)', opacity: 0.6 }}
        >
          No content scheduled — connect posting tools to populate
        </p>
      </div>

      {/* ── Brand Accounts + Campaign Ideas (2-col) ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Brand Accounts */}
        <div className="mc-card p-5">
          <SectionHeader icon={Globe} label="Brand Accounts" color={NOVA_COLOR} />
          <div className="space-y-2">
            {brandAccounts.map((acct) => (
              <div
                key={acct.account}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: 'var(--mc-card)', border: '1px solid var(--mc-card-border)' }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--mc-text-primary)' }}>
                    {acct.account}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--mc-text-muted)' }}>
                    {acct.platform}
                  </p>
                </div>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(16,185,129,0.12)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    color: '#34d399',
                  }}
                >
                  ACTIVE
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Campaign Ideas */}
        <div className="mc-card p-5">
          <SectionHeader icon={Lightbulb} label="Campaign Ideas" color={NOVA_COLOR} />
          {campaigns.length === 0 ? (
            <EmptyState
              icon={Lightbulb}
              message="No campaign ideas yet"
              sub="Nova memory files will populate this feed"
            />
          ) : (
            <div className="space-y-2.5">
              {campaigns.map((idea, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 py-2"
                  style={{
                    borderBottom: i < campaigns.length - 1 ? '1px solid var(--mc-card-border)' : 'none',
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                    style={{
                      background: NOVA_COLOR,
                    }}
                  />
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: 'var(--mc-text-muted)' }}
                  >
                    {idea.slice(0, 140)}{idea.length > 140 ? '…' : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Activity ────────────────────────────────────────────────── */}
      <div className="mc-card p-5">
        <SectionHeader icon={Radio} label="Recent Activity" color={NOVA_COLOR} />
        {recentLog.length === 0 ? (
          <EmptyState
            icon={Radio}
            message="No activity entries"
            sub="Nova memory file entries will stream here"
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
                    background: NOVA_COLOR,
                    boxShadow: `0 0 6px ${NOVA_COLOR}80`,
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
