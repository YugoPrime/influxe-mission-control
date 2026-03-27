export const AGENT_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  yugo: {
    bg: 'bg-purple-900/30',
    text: 'text-purple-300',
    border: 'border-purple-700',
    badge: 'bg-purple-700 text-purple-100',
  },
  'yugo-prime': {
    bg: 'bg-purple-900/30',
    text: 'text-purple-300',
    border: 'border-purple-700',
    badge: 'bg-purple-700 text-purple-100',
  },
  jarvis: {
    bg: 'bg-blue-900/30',
    text: 'text-blue-300',
    border: 'border-blue-700',
    badge: 'bg-blue-700 text-blue-100',
  },
  ruel: {
    bg: 'bg-yellow-900/30',
    text: 'text-yellow-300',
    border: 'border-yellow-700',
    badge: 'bg-yellow-700 text-yellow-100',
  },
  nova: {
    bg: 'bg-pink-900/30',
    text: 'text-pink-300',
    border: 'border-pink-700',
    badge: 'bg-pink-700 text-pink-100',
  },
  nexus: {
    bg: 'bg-green-900/30',
    text: 'text-green-300',
    border: 'border-green-700',
    badge: 'bg-green-700 text-green-100',
  },
  amalia: {
    bg: 'bg-teal-900/30',
    text: 'text-teal-300',
    border: 'border-teal-700',
    badge: 'bg-teal-700 text-teal-100',
  },
  mastermind: {
    bg: 'bg-orange-900/30',
    text: 'text-orange-300',
    border: 'border-orange-700',
    badge: 'bg-orange-700 text-orange-100',
  },
  builder: {
    bg: 'bg-cyan-900/30',
    text: 'text-cyan-300',
    border: 'border-cyan-700',
    badge: 'bg-cyan-700 text-cyan-100',
  },
}

export function getAgentColor(agentId: string) {
  const key = agentId.toLowerCase().replace(/\s+/g, '-')
  return AGENT_COLORS[key] || {
    bg: 'bg-slate-800',
    text: 'text-slate-300',
    border: 'border-slate-600',
    badge: 'bg-slate-600 text-slate-100',
  }
}
