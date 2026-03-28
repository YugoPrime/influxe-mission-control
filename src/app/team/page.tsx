'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getAgentColor } from '@/lib/agent-colors'
import { Crown, Bot } from 'lucide-react'

interface Agent {
  id: string
  name: string
  model: string
  workspace?: string
  status: string
  role?: string
}

const CSUITE = ['jarvis', 'nexus', 'nova', 'ruel', 'mastermind', 'amalia']
const SUB_AGENTS: Record<string, { id: string; name: string; role: string }[]> = {
  jarvis: [{ id: 'builder', name: 'Builder', role: 'Dev Agent' }],
}

function ModelBadge({ model }: { model: string }) {
  const short = model === 'human' ? 'Human' : model.split('/').pop() || model
  const isHuman = model === 'human'
  return (
    <Badge variant="outline" className={`text-xs ${isHuman ? 'border-yellow-600 text-yellow-400' : 'border-slate-600 text-slate-400'}`}>
      {short}
    </Badge>
  )
}

function AgentCard({ 
  agent, 
  size = 'md',
  isOwner = false,
  isCeo = false,
}: { 
  agent: Agent | { id: string; name: string; model: string; role: string; status: string }
  size?: 'sm' | 'md' | 'lg'
  isOwner?: boolean
  isCeo?: boolean
}) {
  const colors = getAgentColor(agent.id)
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  }

  return (
    <Card className={`bg-slate-900 border ${colors.border} ${sizeClasses[size]} w-full max-w-[200px]`}>
      <CardContent className="p-0 flex flex-col items-center gap-2 text-center">
        <div className={`w-10 h-10 rounded-full ${colors.bg} border ${colors.border} flex items-center justify-center`}>
          {isOwner ? (
            <Crown className={`w-5 h-5 ${colors.text}`} />
          ) : (
            <Bot className={`w-5 h-5 ${colors.text}`} />
          )}
        </div>
        <div>
          <div className={`font-semibold text-sm ${colors.text}`}>{agent.name}</div>
          {agent.role && (
            <div className="text-xs text-slate-500 mt-0.5 leading-tight">{agent.role}</div>
          )}
        </div>
        <ModelBadge model={agent.model} />
      </CardContent>
    </Card>
  )
}

function ConnectorLine() {
  return <div className="w-px h-8 mx-auto" style={{ background: 'var(--mc-card-border)' }} />
}

function HorizontalConnector({ count }: { count: number }) {
  if (count <= 1) return null
  return (
    <div className="flex items-start justify-center relative">
      <div className="absolute top-0 left-[calc(100%/4)] right-[calc(100%/4)] h-px bg-slate-700" />
    </div>
  )
}

export default function TeamPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/agents')
      .then(r => r.json())
      .then(d => {
        setAgents(d.agents || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="" style={{ color: 'var(--mc-text-muted)' }}>Loading team...</div>
      </div>
    )
  }

  const rahvi = { id: 'rahvi', name: 'Rahvi', model: 'human', role: 'Founder & Owner', status: 'owner' }
  const yugoPrime = agents.find(a => a.id === 'yugo-prime') || { id: 'yugo-prime', name: 'Yugo Prime', model: 'claude-sonnet-4-6', role: 'CEO & Orchestrator', status: 'active' }
  const csuite = CSUITE.map(id => agents.find(a => a.id === id)).filter(Boolean) as Agent[]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--mc-text-primary)' }}>Team</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--mc-text-muted)' }}>Agent org chart — Influxe ecosystem</p>
      </div>

      {/* Org Chart */}
      <div className="flex flex-col items-center gap-0 overflow-x-auto py-4">
        
        {/* Rahvi - Owner */}
        <div className="flex justify-center">
          <AgentCard agent={rahvi} size="lg" isOwner />
        </div>

        <ConnectorLine />

        {/* Yugo Prime - CEO */}
        <div className="flex justify-center">
          <AgentCard agent={yugoPrime} size="lg" isCeo />
        </div>

        <ConnectorLine />

        {/* Horizontal bar for C-suite */}
        <div className="relative flex justify-center w-full max-w-5xl">
          {/* Horizontal connecting line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px" style={{ background: 'var(--mc-card-border)', width: `${Math.min(csuite.length * 220, 1000)}px` }} />
          {/* Vertical drops */}
          <div className="flex gap-4 lg:gap-6 flex-wrap justify-center pt-0">
            {csuite.map(agent => (
              <div key={agent.id} className="flex flex-col items-center">
                <div className="w-px h-8" style={{ background: 'var(--mc-card-border)' }} />
                <AgentCard agent={agent} size="md" />
                
                {/* Sub-agents */}
                {SUB_AGENTS[agent.id] && (
                  <div className="flex flex-col items-center mt-0">
                    <div className="w-px h-6" style={{ background: 'var(--mc-card-border)' }} />
                    {SUB_AGENTS[agent.id].map(sub => (
                      <div key={sub.id} className="flex flex-col items-center">
                        <AgentCard 
                          agent={{ ...sub, model: 'anthropic/claude-sonnet-4-6', status: 'active' }} 
                          size="sm" 
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>


    </div>
  )
}
