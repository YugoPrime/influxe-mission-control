import { KanbanBoard } from './kanban-board'

export default function ProjectsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--mc-text-primary)' }}>Projects</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--mc-text-muted)' }}>Backlog — Visual Kanban view</p>
      </div>
      <KanbanBoard />
    </div>
  )
}
