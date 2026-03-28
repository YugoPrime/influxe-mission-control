import { Briefcase, FolderKanban, Users, ArrowLeftRight } from 'lucide-react'

const BASE_URL = process.env.INTERNAL_URL || 'http://localhost:3000'
const NEXUS_COLOR = '#10b981'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BacklogTask {
  id: string
  type: string
  title: string
  owner: string
  status: string
  description: string
  deadline?: string
  column: string
}

interface HandoffEntry {
  id: string
  from: string
  to: string
  summary: string
  status: string
  sent: string
}

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function getNexusData() {
  const [backlogRes, nexusRes] = await Promise.allSettled([
    fetch(`${BASE_URL}/api/backlog`, { cache: 'no-store' }),
    fetch(`${BASE_URL}/api/nexus`, { cache: 'no-store' }),
  ])

  let tasks: BacklogTask[] = []
  let handoffs: HandoffEntry[] = []

  if (backlogRes.status === 'fulfilled' && backlogRes.value.ok) {
    const data = await backlogRes.value.json()
    tasks = data.tasks ?? []
  }

  if (nexusRes.status === 'fulfilled' && nexusRes.value.ok) {
    const data = await nexusRes.value.json()
    handoffs = data.handoffs ?? []
  }

  const activeProjects = tasks.filter((t) => {
    const s = t.status.toLowerCase()
    return s.includes('progress') || s.includes('urgent') || t.column === 'in-progress'
  })

  const clientTasks = tasks.filter((t) => {
    const typeUp = t.type.toUpperCase()
    const desc = t.description.toLowerCase()
    return typeUp.includes('ECOMMERCE') || typeUp.includes('CLIENT') || desc.includes('client') || typeUp === 'ECOM'
  })

  return { activeProjects, clientTasks, handoffs }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusPillColor(status: string): { bg: string; border: string; color: string; label: string } {
  const s = status.toLowerCase()
  if (s.includes('urgent') || s.includes('blocked')) {
    return { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', color: '#f87171', label: 'URGENT' }
  }
  if (s.includes('progress') || s.includes('cours')) {
    return { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', color: '#fbbf24', label: 'IN PROGRESS' }
  }
  if (s.includes('done') || s.includes('✅')) {
    return { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', color: '#34d399', label: 'DONE' }
  }
  return { bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.3)', color: '#94a3b8', label: status.toUpperCase().slice(0, 12) }
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
  const pill = statusPillColor(status)
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
      style={{ background: pill.bg, border: `1px solid ${pill.border}`, color: pill.color }}
    >
      {pill.label}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function NexusPage() {
  const { activeProjects, clientTasks, handoffs } = await getNexusData()

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">

      {/* Page heading */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `${NEXUS_COLOR}1e`,
            border: `1px solid ${NEXUS_COLOR}40`,
          }}
        >
          <Briefcase className="w-[18px] h-[18px]" style={{ color: NEXUS_COLOR }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--mc-text-primary)' }}>
            Nexus Panel
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--mc-text-muted)' }}>
            Chief Operating Officer — projects and client ops
          </p>
        </div>
      </div>

      {/* ── Active Projects ────────────────────────────────────────────────── */}
      <div className="mc-card p-5">
        <SectionHeader icon={FolderKanban} label="Active Projects" color={NEXUS_COLOR} />
        {activeProjects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            message="No active projects"
            sub="In-progress and urgent items from BACKLOG.md will appear here"
          />
        ) : (
          <div className="space-y-2">
            {activeProjects.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg"
                style={{ background: 'var(--mc-card)', border: '1px solid var(--mc-card-border)' }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--mc-text-primary)' }}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {task.owner && (
                      <span className="text-xs" style={{ color: 'var(--mc-text-muted)' }}>
                        {task.owner}
                      </span>
                    )}
                    {task.deadline && (
                      <span className="text-xs font-mono" style={{ color: 'var(--mc-text-muted)' }}>
                        due {task.deadline}
                      </span>
                    )}
                  </div>
                </div>
                <StatusPill status={task.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Client Tasks + Handoffs (2-col) ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Client Tasks */}
        <div className="mc-card p-5">
          <SectionHeader icon={Users} label="Client Tasks" color={NEXUS_COLOR} />
          {clientTasks.length === 0 ? (
            <EmptyState
              icon={Users}
              message="No client tasks found"
              sub="Tasks tagged ECOMMERCE or with 'client' in description will appear here"
            />
          ) : (
            <div className="space-y-2">
              {clientTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded-lg"
                  style={{ background: 'var(--mc-card)', border: '1px solid var(--mc-card-border)' }}
                >
                  <p className="text-sm font-medium" style={{ color: 'var(--mc-text-primary)' }}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    {task.owner && (
                      <span className="text-xs" style={{ color: 'var(--mc-text-muted)' }}>
                        {task.owner}
                      </span>
                    )}
                    {task.deadline && (
                      <span className="text-xs font-mono" style={{ color: 'var(--mc-text-muted)' }}>
                        due {task.deadline}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Handoffs */}
        <div className="mc-card p-5">
          <SectionHeader icon={ArrowLeftRight} label="Recent Handoffs" color={NEXUS_COLOR} />
          {handoffs.length === 0 ? (
            <EmptyState
              icon={ArrowLeftRight}
              message="No handoffs for Nexus"
              sub="INBOX.md entries involving nexus will stream here"
            />
          ) : (
            <div className="space-y-2">
              {handoffs.map((hf, i) => {
                const isAcked = hf.status === 'ACKED'
                return (
                  <div
                    key={i}
                    className="p-3 rounded-lg"
                    style={{ background: 'var(--mc-card)', border: '1px solid var(--mc-card-border)' }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className="text-xs font-mono font-bold"
                        style={{ color: NEXUS_COLOR }}
                      >
                        {hf.id}
                      </span>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: isAcked ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                          border: `1px solid ${isAcked ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                          color: isAcked ? '#34d399' : '#fbbf24',
                        }}
                      >
                        {hf.status}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--mc-text-muted)' }}>
                      <span style={{ color: 'var(--mc-text-primary)' }}>{hf.from}</span>
                      {' → '}
                      <span style={{ color: 'var(--mc-text-primary)' }}>{hf.to}</span>
                    </p>
                    <p
                      className="text-xs mt-1 leading-relaxed"
                      style={{ color: 'var(--mc-text-muted)' }}
                    >
                      {hf.summary.slice(0, 120)}{hf.summary.length > 120 ? '…' : ''}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
