'use client'

import { X, Bot, FolderKanban, Lightbulb, Wrench } from 'lucide-react'

export interface NodeData {
  nodeType: 'agent' | 'project' | 'idea' | 'tool'
  label: string
  color?: string
  name?: string
  description?: string
  status?: string
  owner?: string
  category?: string
  priority?: string
  score?: number | null
  decision?: string
}

interface Props {
  node: { id: string; data: NodeData } | null
  onClose: () => void
}

const STATUS_COLORS: Record<string, string> = {
  active: '#10B981',
  completed: '#3B82F6',
  not_started: '#6B7280',
  in_progress: '#F59E0B',
  on_hold: '#EF4444',
  incubating: '#8B5CF6',
  approved: '#10B981',
  rejected: '#EF4444',
  testing: '#F59E0B',
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#EF4444',
  high: '#F97316',
  normal: '#3B82F6',
  low: '#6B7280',
}

export function IntelligenceDetailPanel({ node, onClose }: Props) {
  if (!node) return null

  const { data } = node
  const accentColor =
    data.color ??
    (data.nodeType === 'project'
      ? '#6366F1'
      : data.nodeType === 'idea'
        ? '#F97316'
        : '#6B7280')

  const Icon =
    data.nodeType === 'agent'
      ? Bot
      : data.nodeType === 'project'
        ? FolderKanban
        : data.nodeType === 'idea'
          ? Lightbulb
          : Wrench

  return (
    <div
      className="absolute right-0 top-0 h-full w-80 z-10 flex flex-col overflow-hidden"
      style={{
        background: '#18181b',
        borderLeft: '1px solid #2A2A2D',
        animation: 'slideInRight 0.2s ease-out',
      }}
    >
      {/* Header */}
      <div
        className="flex items-start gap-3 p-4"
        style={{ borderBottom: '1px solid #2A2A2D' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}40` }}
        >
          <Icon className="w-4 h-4" style={{ color: accentColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-0.5"
            style={{ color: accentColor, fontSize: '10px' }}
          >
            {data.nodeType}
          </p>
          <h3
            className="text-sm font-bold leading-snug"
            style={{ color: '#F4F4F5' }}
          >
            {data.label}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity"
          style={{ background: '#2A2A2D' }}
        >
          <X className="w-3.5 h-3.5" style={{ color: '#A1A1AA' }} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Description */}
        {data.description && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#52525B', fontSize: '10px' }}>
              Description
            </p>
            <p className="text-xs leading-relaxed" style={{ color: '#A1A1AA' }}>
              {data.description}
            </p>
          </div>
        )}

        {/* Agent specifics */}
        {data.nodeType === 'agent' && data.name && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#52525B', fontSize: '10px' }}>
              Agent ID
            </p>
            <span
              className="text-xs font-mono px-2 py-1 rounded"
              style={{ background: `${accentColor}15`, color: accentColor, border: `1px solid ${accentColor}30` }}
            >
              {data.name}
            </span>
          </div>
        )}

        {/* Project specifics */}
        {data.nodeType === 'project' && (
          <div className="space-y-3">
            {data.status && (
              <Row label="Status">
                <Badge
                  text={data.status.replace('_', ' ')}
                  color={STATUS_COLORS[data.status] ?? '#6B7280'}
                />
              </Row>
            )}
            {data.priority && (
              <Row label="Priority">
                <Badge
                  text={data.priority}
                  color={PRIORITY_COLORS[data.priority] ?? '#6B7280'}
                />
              </Row>
            )}
            {data.owner && (
              <Row label="Owner">
                <span className="text-xs font-mono" style={{ color: '#F4F4F5' }}>
                  {data.owner}
                </span>
              </Row>
            )}
            {data.category && (
              <Row label="Category">
                <span className="text-xs" style={{ color: '#A1A1AA' }}>
                  {data.category}
                </span>
              </Row>
            )}
          </div>
        )}

        {/* Idea specifics */}
        {data.nodeType === 'idea' && (
          <div className="space-y-3">
            {data.score != null && (
              <Row label="Score">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: '#2A2A2D' }}>
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${(data.score / 10) * 100}%`,
                        background: data.score >= 7 ? '#10B981' : data.score >= 5 ? '#F59E0B' : '#EF4444',
                      }}
                    />
                  </div>
                  <span
                    className="text-xs font-bold font-mono w-8 text-right"
                    style={{
                      color: data.score >= 7 ? '#10B981' : data.score >= 5 ? '#F59E0B' : '#EF4444',
                    }}
                  >
                    {data.score.toFixed(1)}
                  </span>
                </div>
              </Row>
            )}
            {data.status && (
              <Row label="Status">
                <Badge
                  text={data.status}
                  color={STATUS_COLORS[data.status] ?? '#8B5CF6'}
                />
              </Row>
            )}
            {data.decision && (
              <Row label="Decision">
                <span className="text-xs" style={{ color: '#A1A1AA' }}>
                  {data.decision}
                </span>
              </Row>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#52525B', fontSize: '10px' }}>
        {label}
      </p>
      {children}
    </div>
  )
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
      style={{
        background: `${color}18`,
        border: `1px solid ${color}40`,
        color,
      }}
    >
      {text}
    </span>
  )
}
