'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type NodeTypes,
  type Connection,
  Handle,
  Position,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from 'dagre'
import { Brain, Bot, FolderKanban, Lightbulb, Wrench, Network } from 'lucide-react'
import { IntelligenceDetailPanel, type NodeData } from '@/components/intelligence-detail-panel'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiNode {
  id: string
  type: string
  data: NodeData
  position: { x: number; y: number }
}

interface ApiEdge {
  id: string
  source: string
  target: string
  type: string
}

interface GraphData {
  nodes: ApiNode[]
  edges: ApiEdge[]
  stats: { nodeCount: number; edgeCount: number; highScoreIdeas: number }
}

type FilterType = 'all' | 'agent' | 'project' | 'idea' | 'tool'

// ─── Dagre layout ─────────────────────────────────────────────────────────────

function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', ranksep: 120, nodesep: 80, marginx: 40, marginy: 40 })

  for (const node of nodes) {
    g.setNode(node.id, { width: 160, height: 60 })
  }
  for (const edge of edges) {
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target)
    }
  }

  dagre.layout(g)

  return nodes.map((node) => {
    const pos = g.node(node.id)
    if (!pos) return node
    return { ...node, position: { x: pos.x - 80, y: pos.y - 30 } }
  })
}

// ─── Custom node renderers ────────────────────────────────────────────────────

function AgentNode({ data, selected }: { data: NodeData; selected?: boolean }) {
  const color = data.color ?? '#8B5CF6'
  return (
    <div
      style={{
        width: 130,
        height: 44,
        borderRadius: '50px',
        background: `${color}20`,
        border: `2px solid ${selected ? color : `${color}60`}`,
        boxShadow: selected ? `0 0 16px ${color}60` : 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 14px',
        transition: 'all 0.15s ease',
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: `${color}30`,
          border: `1px solid ${color}60`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Bot style={{ width: 12, height: 12, color }} />
      </div>
      <span style={{ color: '#F4F4F5', fontSize: 11, fontWeight: 700, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {data.label}
      </span>
      <Handle type="source" position={Position.Bottom} style={{ background: color, border: 'none', width: 6, height: 6 }} />
      <Handle type="target" position={Position.Top} style={{ background: color, border: 'none', width: 6, height: 6 }} />
    </div>
  )
}

function ProjectNode({ data, selected }: { data: NodeData; selected?: boolean }) {
  const statusColors: Record<string, string> = {
    active: '#10B981',
    completed: '#3B82F6',
    not_started: '#6B7280',
    in_progress: '#F59E0B',
    on_hold: '#EF4444',
  }
  const statusColor = statusColors[data.status ?? ''] ?? '#6366F1'
  return (
    <div
      style={{
        width: 160,
        minHeight: 52,
        borderRadius: 10,
        background: '#1E1E22',
        border: `1.5px solid ${selected ? '#6366F1' : '#3A3A42'}`,
        boxShadow: selected ? '0 0 16px rgba(99,102,241,0.4)' : 'none',
        padding: '8px 12px',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <FolderKanban style={{ width: 11, height: 11, color: '#6366F1', flexShrink: 0 }} />
        <span style={{ color: '#F4F4F5', fontSize: 11, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {data.label}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
        <span style={{ color: '#71717A', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {(data.status ?? '').replace('_', ' ')}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#6366F1', border: 'none', width: 6, height: 6 }} />
      <Handle type="target" position={Position.Top} style={{ background: '#6366F1', border: 'none', width: 6, height: 6 }} />
    </div>
  )
}

function IdeaNode({ data, selected }: { data: NodeData; selected?: boolean }) {
  const score = data.score ?? 0
  const scoreColor = score >= 7 ? '#10B981' : score >= 5 ? '#F59E0B' : '#EF4444'
  return (
    <div
      style={{
        width: 150,
        minHeight: 52,
        borderRadius: 10,
        background: '#1C1A18',
        border: `1.5px solid ${selected ? '#F97316' : '#3A3530'}`,
        boxShadow: selected ? '0 0 16px rgba(249,115,22,0.4)' : 'none',
        padding: '8px 12px',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <Lightbulb style={{ width: 11, height: 11, color: '#F97316', flexShrink: 0 }} />
        <span style={{ color: '#F4F4F5', fontSize: 11, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {data.label}
        </span>
      </div>
      {score > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ flex: 1, height: 3, borderRadius: 2, background: '#2A2520' }}>
            <div style={{ width: `${(score / 10) * 100}%`, height: 3, borderRadius: 2, background: scoreColor }} />
          </div>
          <span style={{ color: scoreColor, fontSize: 9, fontFamily: 'monospace', fontWeight: 700 }}>
            {score.toFixed(1)}
          </span>
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: '#F97316', border: 'none', width: 6, height: 6 }} />
      <Handle type="target" position={Position.Top} style={{ background: '#F97316', border: 'none', width: 6, height: 6 }} />
    </div>
  )
}

function ToolNode({ data, selected }: { data: NodeData; selected?: boolean }) {
  return (
    <div
      style={{
        width: 110,
        height: 38,
        borderRadius: 6,
        background: '#1A1A1E',
        border: `1.5px solid ${selected ? '#6B7280' : '#2A2A2D'}`,
        boxShadow: selected ? '0 0 12px rgba(107,114,128,0.3)' : 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '0 10px',
        transition: 'all 0.15s ease',
      }}
    >
      <Wrench style={{ width: 10, height: 10, color: '#52525B', flexShrink: 0 }} />
      <span style={{ color: '#71717A', fontSize: 10, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {data.label}
      </span>
      <Handle type="source" position={Position.Bottom} style={{ background: '#4B5563', border: 'none', width: 5, height: 5 }} />
      <Handle type="target" position={Position.Top} style={{ background: '#4B5563', border: 'none', width: 5, height: 5 }} />
    </div>
  )
}

const NODE_TYPES: NodeTypes = {
  agentNode: AgentNode as unknown as NodeTypes[string],
  projectNode: ProjectNode as unknown as NodeTypes[string],
  ideaNode: IdeaNode as unknown as NodeTypes[string],
  toolNode: ToolNode as unknown as NodeTypes[string],
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntelligencePage() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [stats, setStats] = useState({ nodeCount: 0, edgeCount: 0, highScoreIdeas: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedNode, setSelectedNode] = useState<{ id: string; data: NodeData } | null>(null)
  const allNodesRef = useRef<Node[]>([])
  const allEdgesRef = useRef<Edge[]>([])

  // Fetch graph data
  useEffect(() => {
    fetch('/api/intelligence')
      .then((r) => r.json())
      .then((data: GraphData) => {
        const laid = applyDagreLayout(
          data.nodes as unknown as Node[],
          data.edges as unknown as Edge[]
        )
        const styledEdges: Edge[] = (data.edges as unknown as Edge[]).map((e) => ({
          ...e,
          style: { stroke: '#2A2A2D', strokeWidth: 1.5 },
          animated: false,
        }))
        allNodesRef.current = laid
        allEdgesRef.current = styledEdges
        setNodes(laid)
        setEdges(styledEdges)
        setStats(data.stats)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [setNodes, setEdges])

  // Filter
  useEffect(() => {
    if (allNodesRef.current.length === 0) return
    if (filter === 'all') {
      setNodes(allNodesRef.current)
      setEdges(allEdgesRef.current)
      return
    }
    const filtered = allNodesRef.current.filter(
      (n) => (n.data as unknown as NodeData).nodeType === filter
    )
    const filteredIds = new Set(filtered.map((n) => n.id))
    const filteredEdges = allEdgesRef.current.filter(
      (e) => filteredIds.has(e.source) && filteredIds.has(e.target)
    )
    setNodes(filtered)
    setEdges(filteredEdges)
  }, [filter, setNodes, setEdges])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode({ id: node.id, data: node.data as unknown as NodeData })
  }, [])

  const FILTERS: { key: FilterType; label: string; icon: React.ElementType }[] = [
    { key: 'all', label: 'All', icon: Network },
    { key: 'agent', label: 'Agents', icon: Bot },
    { key: 'project', label: 'Projects', icon: FolderKanban },
    { key: 'idea', label: 'Ideas', icon: Lightbulb },
    { key: 'tool', label: 'Tools', icon: Wrench },
  ]

  return (
    <div className="flex flex-col h-full" style={{ background: '#111113' }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 md:px-6 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid #1E1E22' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}
          >
            <Brain className="w-4 h-4" style={{ color: '#8B5CF6' }} />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight" style={{ color: '#F4F4F5' }}>
              Intelligence Center
            </h1>
            <p className="text-xs hidden md:block" style={{ color: '#52525B' }}>
              Knowledge graph — agents, projects, ideas, tools
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="hidden md:flex items-center gap-4">
          {[
            { label: 'Nodes', value: stats.nodeCount },
            { label: 'Connections', value: stats.edgeCount },
            { label: 'Ideas 7+', value: stats.highScoreIdeas },
          ].map((s) => (
            <div key={s.label} className="text-right">
              <div className="text-sm font-bold font-mono" style={{ color: '#F4F4F5' }}>
                {s.value}
              </div>
              <div className="text-xs" style={{ color: '#52525B', fontSize: '10px' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter pills */}
      <div
        className="flex items-center gap-2 px-4 md:px-6 py-2.5 flex-shrink-0 overflow-x-auto"
        style={{ borderBottom: '1px solid #1E1E22' }}
      >
        {FILTERS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all flex-shrink-0"
            style={{
              background: filter === key ? 'rgba(139,92,246,0.2)' : '#1A1A1E',
              border: `1px solid ${filter === key ? 'rgba(139,92,246,0.5)' : '#2A2A2D'}`,
              color: filter === key ? '#C4B5FD' : '#71717A',
            }}
          >
            <Icon style={{ width: 11, height: 11 }} />
            {label}
          </button>
        ))}
      </div>

      {/* Graph + detail panel */}
      <div className="flex-1 relative overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Brain className="w-10 h-10 mx-auto mb-3 opacity-30 animate-pulse" style={{ color: '#8B5CF6' }} />
              <p className="text-sm" style={{ color: '#52525B' }}>
                Loading intelligence graph…
              </p>
            </div>
          </div>
        ) : (
          <>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              nodeTypes={NODE_TYPES}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              colorMode="dark"
              style={{ background: '#111113' }}
              defaultEdgeOptions={{
                style: { stroke: '#2A2A2D', strokeWidth: 1.5 },
                animated: false,
              }}
            >
              <Background color="#1E1E22" gap={24} size={1} />
              <Controls
                style={{
                  background: '#18181b',
                  border: '1px solid #2A2A2D',
                  borderRadius: 8,
                }}
              />
              <MiniMap
                style={{
                  background: '#18181b',
                  border: '1px solid #2A2A2D',
                  borderRadius: 8,
                  opacity: 0.9,
                }}
                nodeColor={(n) => {
                  const d = n.data as unknown as NodeData
                  if (d.nodeType === 'agent') return d.color ?? '#8B5CF6'
                  if (d.nodeType === 'project') return '#6366F1'
                  if (d.nodeType === 'idea') return '#F97316'
                  return '#3A3A42'
                }}
                maskColor="rgba(0,0,0,0.6)"
              />
              <Panel position="bottom-left">
                <div
                  className="flex flex-col gap-1.5 p-2.5 rounded-xl text-xs"
                  style={{ background: '#18181b', border: '1px solid #2A2A2D' }}
                >
                  {[
                    { color: '#8B5CF6', label: 'Agents' },
                    { color: '#6366F1', label: 'Projects' },
                    { color: '#F97316', label: 'Ideas' },
                    { color: '#3A3A42', label: 'Tools' },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                      <span style={{ color: '#71717A' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </ReactFlow>

            {/* Detail panel */}
            <IntelligenceDetailPanel
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
            />
          </>
        )}
      </div>
    </div>
  )
}
