'use client'

import { useEffect, useState } from 'react'
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getAgentColor } from '@/lib/agent-colors'

interface Task {
  id: string
  type: string
  title: string
  owner: string
  status: string
  description: string
  deadline?: string
  stack?: string
  column: string
}

const COLUMNS = [
  { id: 'todo', label: '⏳ To Do', color: 'border-blue-700' },
  { id: 'in-progress', label: '🔄 In Progress', color: 'border-yellow-700' },
  { id: 'blocked', label: '🔴 Blocked', color: 'border-red-700' },
  { id: 'done', label: '✅ Done', color: 'border-green-700' },
  { id: 'backlog', label: '📋 Backlog', color: 'border-slate-700' },
]

function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Parse owner to get agent name
  const ownerParts = task.owner.split(/[+,&]/).map(p => p.trim())
  const primaryOwner = ownerParts[0]?.toLowerCase().replace(/\s+/g, '-') || 'unknown'
  const colors = getAgentColor(primaryOwner)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-slate-800 border border-slate-700 rounded-lg p-3 cursor-pointer hover:border-slate-500 transition-colors space-y-2"
    >
      <div className="flex items-start gap-2">
        <Badge variant="outline" className="text-xs border-slate-600 text-slate-300 flex-shrink-0">
          {task.type}
        </Badge>
        <span className="text-sm text-white font-medium leading-tight">{task.title}</span>
      </div>
      {task.owner && (
        <div className="flex flex-wrap gap-1">
          {ownerParts.slice(0, 3).map((owner, i) => {
            const c = getAgentColor(owner.toLowerCase().replace(/\s+/g, '-'))
            return (
              <span key={i} className={`text-xs px-1.5 py-0.5 rounded ${c.badge}`}>
                {owner}
              </span>
            )
          })}
        </div>
      )}
      {task.deadline && (
        <div className="text-xs text-slate-500">📅 {task.deadline}</div>
      )}
    </div>
  )
}

function KanbanColumn({
  column,
  tasks,
  onTaskClick,
}: {
  column: { id: string; label: string; color: string }
  tasks: Task[]
  onTaskClick: (task: Task) => void
}) {
  return (
    <div className={`flex-shrink-0 w-72 bg-slate-900/50 rounded-xl border ${column.color} flex flex-col`}>
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-200">{column.label}</span>
        <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">{tasks.length}</Badge>
      </div>
      <ScrollArea className="flex-1">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="p-3 space-y-2 min-h-[200px]">
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
            ))}
            {tasks.length === 0 && (
              <div className="text-slate-600 text-xs text-center py-8 border-2 border-dashed border-slate-800 rounded-lg">
                No tasks
              </div>
            )}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  )
}

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  useEffect(() => {
    fetch('/api/backlog')
      .then(r => r.json())
      .then(d => {
        setTasks(d.tasks || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const activeTask = tasks.find(t => t.id === active.id)
    if (!activeTask) return

    // Check if dropped on a column
    const columnId = COLUMNS.find(c => c.id === over.id)?.id
    if (columnId) {
      setTasks(prev => prev.map(t => t.id === active.id ? { ...t, column: columnId } : t))
      return
    }

    // Dropped on another task - move to that task's column
    const overTask = tasks.find(t => t.id === over.id)
    if (overTask && overTask.column !== activeTask.column) {
      setTasks(prev => prev.map(t => t.id === active.id ? { ...t, column: overTask.column } : t))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading backlog...</div>
      </div>
    )
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-6">
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={tasks.filter(t => t.column === col.id)}
              onTaskClick={(task) => {
                setSelectedTask(task)
                setSheetOpen(true)
              }}
            />
          ))}
        </div>
      </DndContext>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="bg-slate-900 border-slate-800 text-white w-full sm:max-w-lg">
          {selectedTask && (
            <>
              <SheetHeader>
                <SheetTitle className="text-white flex items-center gap-2">
                  <Badge variant="outline" className="border-slate-600 text-slate-300">
                    {selectedTask.type}
                  </Badge>
                  <span>{selectedTask.title}</span>
                </SheetTitle>
                <SheetDescription className="text-slate-400">
                  Task details
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Status</div>
                  <Badge className="bg-slate-700 text-slate-200">{selectedTask.status}</Badge>
                </div>
                {selectedTask.owner && (
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Owner</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedTask.owner.split(/[+,&]/).map((o, i) => {
                        const c = getAgentColor(o.trim().toLowerCase().replace(/\s+/g, '-'))
                        return <span key={i} className={`text-xs px-2 py-1 rounded font-medium ${c.badge}`}>{o.trim()}</span>
                      })}
                    </div>
                  </div>
                )}
                {selectedTask.deadline && (
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Deadline</div>
                    <div className="text-slate-300 text-sm">{selectedTask.deadline}</div>
                  </div>
                )}
                {selectedTask.description && (
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Description</div>
                    <div className="text-slate-300 text-sm leading-relaxed">{selectedTask.description}</div>
                  </div>
                )}
                {selectedTask.stack && (
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Stack</div>
                    <div className="text-slate-300 text-sm">{selectedTask.stack}</div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
