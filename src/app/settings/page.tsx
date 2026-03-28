import { Settings, Database, RefreshCw, Info, Shield, Palette } from 'lucide-react'
import { prisma } from '@/lib/prisma'

const SETTINGS_COLOR = '#737373'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DbStatus {
  connected: boolean
  error?: string
}

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function getDbStatus(): Promise<DbStatus> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { connected: true }
  } catch (err) {
    return { connected: false, error: String(err).slice(0, 80) }
  }
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

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-between py-3"
      style={{ borderBottom: '1px solid var(--mc-card-border)' }}
    >
      <span className="text-sm" style={{ color: 'var(--mc-text-muted)' }}>
        {label}
      </span>
      <div>{children}</div>
    </div>
  )
}

function Pill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className="text-xs font-bold px-2.5 py-1 rounded-full"
      style={{
        background: ok ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
        border: `1px solid ${ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
        color: ok ? '#4ade80' : '#f87171',
      }}
    >
      {label}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SettingsPage() {
  const db = await getDbStatus()

  const envVars: { key: string; label: string }[] = [
    { key: 'DATABASE_URL', label: 'DATABASE_URL' },
    { key: 'OPENAI_API_KEY', label: 'OPENAI_API_KEY' },
    { key: 'INTERNAL_URL', label: 'INTERNAL_URL' },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">

      {/* Page heading */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${SETTINGS_COLOR}1e`, border: `1px solid ${SETTINGS_COLOR}40` }}
        >
          <Settings className="w-[18px] h-[18px]" style={{ color: SETTINGS_COLOR }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--mc-text-primary)' }}>
            Settings
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--mc-text-muted)' }}>
            Mission Control configuration
          </p>
        </div>
      </div>

      {/* ── Database Status ────────────────────────────────────────────────── */}
      <div className="mc-card p-5">
        <SectionHeader icon={Database} label="Database Status" color={SETTINGS_COLOR} />
        <Row label="Connection">
          <Pill ok={db.connected} label={db.connected ? 'CONNECTED' : 'ERROR'} />
        </Row>
        {!db.connected && db.error && (
          <div
            className="mt-3 p-3 rounded-lg text-xs font-mono"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171',
            }}
          >
            {db.error}
          </div>
        )}
        <Row label="Provider">
          <span className="text-sm font-mono" style={{ color: 'var(--mc-text-primary)' }}>PostgreSQL</span>
        </Row>
        <Row label="ORM">
          <span className="text-sm font-mono" style={{ color: 'var(--mc-text-primary)' }}>Prisma 7</span>
        </Row>
      </div>

      {/* ── Sync Status ────────────────────────────────────────────────────── */}
      <div className="mc-card p-5">
        <SectionHeader icon={RefreshCw} label="Sync Status" color={SETTINGS_COLOR} />
        <Row label="Last Sync">
          <span className="text-sm font-mono" style={{ color: 'var(--mc-text-muted)' }}>
            {new Date().toUTCString().replace(' GMT', ' UTC')}
          </span>
        </Row>
        <Row label="Manual Sync">
          <button
            className="text-xs font-semibold px-3 py-1.5 rounded-lg cursor-not-allowed opacity-50"
            style={{
              background: 'var(--mc-card)',
              border: '1px solid var(--mc-card-border)',
              color: 'var(--mc-text-muted)',
            }}
            disabled
          >
            Sync Now
          </button>
        </Row>
      </div>

      {/* ── System Info ────────────────────────────────────────────────────── */}
      <div className="mc-card p-5">
        <SectionHeader icon={Info} label="System Info" color={SETTINGS_COLOR} />
        <Row label="Node.js">
          <span className="text-sm font-mono" style={{ color: 'var(--mc-text-primary)' }}>v22.22.1</span>
        </Row>
        <Row label="Next.js">
          <span className="text-sm font-mono" style={{ color: 'var(--mc-text-primary)' }}>16.2.1</span>
        </Row>
        <Row label="Prisma">
          <span className="text-sm font-mono" style={{ color: 'var(--mc-text-primary)' }}>7.x</span>
        </Row>
        <Row label="Platform">
          <span className="text-sm font-mono" style={{ color: 'var(--mc-text-primary)' }}>Linux (VPS)</span>
        </Row>
      </div>

      {/* ── Environment ────────────────────────────────────────────────────── */}
      <div className="mc-card p-5">
        <SectionHeader icon={Shield} label="Environment" color={SETTINGS_COLOR} />
        <p className="text-xs mb-3" style={{ color: 'var(--mc-text-muted)' }}>
          Values are not shown — only presence is indicated.
        </p>
        {envVars.map(({ key, label }) => (
          <Row key={key} label={label}>
            <Pill ok={!!process.env[key]} label={process.env[key] ? 'SET' : 'MISSING'} />
          </Row>
        ))}
      </div>

      {/* ── Theme ──────────────────────────────────────────────────────────── */}
      <div className="mc-card p-5">
        <SectionHeader icon={Palette} label="Theme" color={SETTINGS_COLOR} />
        <Row label="Current Theme">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{
              background: 'rgba(139,92,246,0.12)',
              border: '1px solid rgba(139,92,246,0.3)',
              color: '#a78bfa',
            }}
          >
            DARK
          </span>
        </Row>
        <Row label="CSS Variables">
          <span className="text-xs font-mono" style={{ color: 'var(--mc-text-muted)' }}>mc-card, mc-text-primary…</span>
        </Row>
        <Row label="Font">
          <span className="text-sm font-mono" style={{ color: 'var(--mc-text-primary)' }}>Inter + Geist Mono</span>
        </Row>
      </div>
    </div>
  )
}
