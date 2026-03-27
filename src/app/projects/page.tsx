import { KanbanBoard } from './kanban-board'

export default function ProjectsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Projects</h1>
        <p className="text-slate-400 text-sm mt-1">Backlog — Visual Kanban view</p>
      </div>
      <KanbanBoard />
    </div>
  )
}
