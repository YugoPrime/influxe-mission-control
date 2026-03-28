import { Server, Hammer, Radio, History, Activity } from 'lucide-react'

const BASE_URL = process.env.INTERNAL_URL || 'http://localhost:3000'
const JARVIS_COLOR = '#3B82F6'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BuildEntry {
  id: string
  action: string
  content: string
  status: string
  createdAt: string
}

interface ActivityEntry {
  id: string
  action: string
  content: string
  createdAt: string
}

interface JarvisData {
  builds: BuildEntry[]
  deployHistory: BuildEntry[]
  activity: ActivityEntry[]
}

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function getJarvisData(): Promise<JarvisData> {
  try {
    const res = await fetch(`${BASE_URL}/api/jarvis`, { cache: 'no-store' })
    if (res.ok) return res.json()
  } catch {
    // fall through
  }
  return { builds: [], deployHistory: [], activity: [] }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 23) return `${Math.floor(h / 24)}d ago`
  if (h > 0) return `${h}h ago`
  if (m > 0) return `${m}m ago`
  return 'just now'
}

function statusPill(status: string) {
  const s = status.toLowerCase()
  if (s === 'failed' || s === 'error') {
    return { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', color: '#f87171', label: 'FAILED' }
  }
  if (s === 'success' || s === 'done' || s === 'completed') {
    return { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', color: '#4ade80', label: 'SUCCESS' }
  }
  return { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', color: '#60a5fa', label: s.toUpperCase().slice(0, 10) }
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

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-8 rounded-lg"
      style={{ border: '1px dashed var(--mc-card-border)' }}
    >
      <Icon className="w-7 h-7 mb-2 opacity-25" style={{ color: 'var(--mc-text-muted)' }} />
      <p className="text-sm font-medium" style={{ color: 'var(--mc-text-muted)' }}>{message}</p>
    </div>
  )
}

// ─── Infrastructure cards ─────────────────────────────────────────────────────

const infra = [
  { name: 'VPS srv1411338', desc: 'Primary compute node', status: 'online' },
  { name: 'Coolify', desc: 'Self-hosted PaaS', status: 'online' },
  { name: 'Langfuse', desc: 'LLM observability', status: 'online' },
  { name: 'Crucix', desc: 'Monitoring & alerts', status: 'online' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function JarvisPage() {
  const { builds, deployHistory, activity } = await getJarvisData()

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">

      {/* Page heading */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${JARVIS_COLOR}1e`, border: `1px solid ${JARVIS_COLOR}40` }}
        >
          <Server className="w-[18px] h-[18px]" style={{ color: JARVIS_COLOR }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--mc-text-primary)' }}>
            Jarvis Panel
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--mc-text-muted)' }}>
            Chief Technology Officer — infrastructure & builds
          </p>
        </div>
      </div>

      {/* ── Active Builds ──────────────────────────────────────────────────── */}
      <div className="mc-card p-5">
        <SectionHeader icon={Hammer} label="Active Builds" color={JARVIS_COLOR} />
        {builds.length === 0 ? (
          <EmptyState icon={Hammer} message="No build activity found" />
        ) : (
          <div className="space-y-2">
            {builds.map((b) => {
              const pill = statusPill(b.status)
              return (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg"
                  style={{ background: 'var(--mc-card)', border: '1px solid var(--mc-card-border)' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--mc-text-primary)' }}>
                      {b.action}
                    </p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--mc-text-muted)' }}>
                      {b.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: pill.bg, border: `1px solid ${pill.border}`, color: pill.color }}
                    >
                      {pill.label}
                    </span>
                    <span className="text-xs font-mono" style={{ color: 'var(--mc-text-muted)' }}>
                      {formatRelativeTime(b.createdAt)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Infrastructure Status ──────────────────────────────────────────── */}
      <div className="mc-card p-5">
        <SectionHeader icon={Server} label="Infrastructure Status" color={JARVIS_COLOR} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {infra.map((node) => (
            <div
              key={node.name}
              className="p-4 rounded-xl"
              style={{ background: 'var(--mc-card)', border: '1px solid var(--mc-card-border)' }}
            >
              <div className="flex items-start justify-between mb-2">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center"
                  style={{ background: `${JARVIS_COLOR}18`, border: `1px solid ${JARVIS_COLOR}30` }}
                >
                  <Server className="w-3.5 h-3.5" style={{ color: JARVIS_COLOR }} />
                </div>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(34,197,94,0.12)',
                    border: '1px solid rgba(34,197,94,0.3)',
                    color: '#4ade80',
                  }}
                >
                  ONLINE
                </span>
              </div>
              <p className="text-sm font-semibold mt-2" style={{ color: 'var(--mc-text-primary)' }}>
                {node.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--mc-text-muted)' }}>
                {node.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Deployment History + Recent Activity (2-col) ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Deployment History */}
        <div className="mc-card p-5">
          <SectionHeader icon={History} label="Deployment History" color={JARVIS_COLOR} />
          {deployHistory.length === 0 ? (
            <EmptyState icon={History} message="No deploy history found" />
          ) : (
            <div className="space-y-2">
              {deployHistory.map((d) => {
                const pill = statusPill(d.status)
                return (
                  <div
                    key={d.id}
                    className="p-3 rounded-lg"
                    style={{ background: 'var(--mc-card)', border: '1px solid var(--mc-card-border)' }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-medium truncate" style={{ color: 'var(--mc-text-primary)' }}>
                        {d.action}
                      </span>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: pill.bg, border: `1px solid ${pill.border}`, color: pill.color }}
                      >
                        {pill.label}
                      </span>
                    </div>
                    <p className="text-xs truncate" style={{ color: 'var(--mc-text-muted)' }}>
                      {d.content || 'No output'}
                    </p>
                    <p className="text-xs mt-1 font-mono" style={{ color: 'var(--mc-text-muted)', opacity: 0.6, fontSize: '10px' }}>
                      {formatRelativeTime(d.createdAt)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="mc-card p-5">
          <SectionHeader icon={Activity} label="Recent Activity" color={JARVIS_COLOR} />
          {activity.length === 0 ? (
            <EmptyState icon={Radio} message="No activity logged for Jarvis" />
          ) : (
            <div className="space-y-2.5">
              {activity.map((a, i) => (
                <div
                  key={a.id}
                  className="flex items-start gap-2.5 py-2.5"
                  style={{ borderBottom: i < activity.length - 1 ? '1px solid var(--mc-card-border)' : 'none' }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                    style={{ background: JARVIS_COLOR }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium" style={{ color: 'var(--mc-text-primary)' }}>
                      {a.action}
                    </p>
                    <p className="text-xs leading-relaxed mt-0.5 truncate" style={{ color: 'var(--mc-text-muted)' }}>
                      {a.content}
                    </p>
                    <p className="text-xs mt-1 font-mono" style={{ color: 'var(--mc-text-muted)', opacity: 0.5, fontSize: '10px' }}>
                      {formatRelativeTime(a.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
