import React, { useMemo, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { DndContext, DragEndEvent, DragStartEvent, useDroppable, useSensor, useSensors, PointerSensor, DragOverlay } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Target, CheckCircle2, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KanbanTask } from '@/contexts/AppContext';

// -- Helpers --
const getWeekDates = () => {
  const today = new Date();
  const day = today.getDay(); // 0 is Sunday
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); 
  const monday = new Date(today.getTime());
  monday.setDate(diff); // Use setDate safely this way to avoid month jump issues
  
  const getLocalISODate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const dates = [];
  const weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday.getTime());
    d.setDate(monday.getDate() + i);
    dates.push({
      dateStr: getLocalISODate(d),
      label: weekDays[i],
      dateNum: d.getDate(),
      isToday: getLocalISODate(d) === getLocalISODate(new Date())
    });
  }
  return dates;
};

// -- Components --
function DroppableColumn({ id, title, label, isToday, tasks, unassignedCount }: any) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className={cn(
      "flex flex-col h-full bg-muted/20 rounded-xl overflow-hidden border transition-colors flex-1",
      id === 'backlog' ? 'min-w-[280px] border-dashed border-2' : 'min-w-[250px]',
      isOver ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' : '',
      isToday ? 'border-primary/50' : (id !== 'backlog' ? 'border-transparent' : '')
    )}>
      <div className={cn(
        "px-3 py-2 font-bold text-sm tracking-wide flex items-center justify-between border-b",
        isToday ? 'bg-primary/10 text-primary border-primary/20' : 'bg-card text-card-foreground border-border'
      )}>
        {id === 'backlog' ? (
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-primary" />
            <span className="uppercase text-xs opacity-80">Backlog (Sem Data)</span>
          </div>
        ) : (
          <div className="flex flex-col">
            <span className="uppercase text-xs opacity-70">{label}</span>
            <span className="text-lg leading-none mt-1">{title}</span>
          </div>
        )}
        <Badge variant={id === 'backlog' ? 'outline' : 'secondary'} className="text-[10px]">
          {id === 'backlog' ? unassignedCount : tasks.length}
        </Badge>
      </div>
      <div ref={setNodeRef} className="flex-1 p-2 space-y-2 min-h-[300px]">
        <SortableContext items={tasks.map((t: any) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task: any) => (
             <SortableTaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
        {tasks.length === 0 && id !== 'backlog' && (
          <div className="text-xs text-muted-foreground/50 text-center py-5 italic">
            Arraste tarefas para cá
          </div>
        )}
      </div>
    </div>
  );
}

function SortableTaskCard({ task }: { task: KanbanTask }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group outline-none">
      <Card className={cn(
        "hover:shadow-md transition-all border-none bg-card relative overflow-hidden",
        task.column === 'done' ? 'opacity-50 line-through' : ''
      )}>
        <CardContent className="p-2 flex items-start gap-2">
          <button {...attributes} {...listeners} className="mt-0.5 cursor-grab hover:text-primary transition-colors text-muted-foreground/40">
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <div className="flex-1 min-w-0 pointer-events-none">
            <h4 className="font-medium text-xs leading-tight">{task.title}</h4>
            <div className="flex items-center justify-between mt-1.5">
              {task.goalId && (
                <Target className="w-2.5 h-2.5 text-primary opacity-70" />
              )}
              {task.column === 'done' && (
                <CheckCircle2 className="w-3 h-3 text-emerald-500 ml-auto" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const WeeklyPlanner = () => {
  const { state: { kanban }, currentProject, updateKanbanTask } = useApp();
  
  const weekDays = useMemo(() => getWeekDates(), []);
  const safeKanban = kanban || [];
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = safeKanban.find(t => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    
    const taskId = active.id as string;
    const targetDate = over.id as string; // 'backlog' OR 'YYYY-MM-DD'
    
    const task = safeKanban.find(t => t.id === taskId);
    if (!task) return;
    
    if (targetDate === 'backlog') {
      if (task.plannerDate !== undefined) {
        updateKanbanTask(taskId, { plannerDate: undefined });
      }
    } else {
      if (task.plannerDate !== targetDate) {
        updateKanbanTask(taskId, { plannerDate: targetDate });
      }
    }
  };

  const projectTasks = safeKanban.filter(t => t.projectId === currentProject && t.column !== 'done');
  
  // Backlog tasks are pending tasks with NO plannerDate OR a plannerDate outside of this specific week!
  // To be perfectly accurate (MVP), just use tasks with no plannerDate for the backlog
  const backlogTasks = projectTasks.filter(t => !t.plannerDate);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col md:flex-row gap-6 h-full pb-6 pt-2">
        {/* Backlog Sidebar */}
        <div className="md:w-1/4 xl:w-1/5 shrink-0 flex flex-col h-[calc(100vh-250px)]">
          <DroppableColumn 
            id="backlog" 
            title="Backlog" 
            tasks={backlogTasks} 
            unassignedCount={backlogTasks.length} 
          />
        </div>

        {/* Week Days Scroller */}
        <div className="flex-1 flex gap-4 overflow-x-auto snap-x h-[calc(100vh-250px)] pb-4">
          {weekDays.map(dateInfo => {
            // Filter tasks assigned to this project and this specific plannerDate
            const dayTasks = projectTasks.filter(t => t.plannerDate === dateInfo.dateStr);
            
            return (
              <div key={dateInfo.dateStr} className="snap-start snap-always w-full min-w-[260px] max-w-[300px]">
                <DroppableColumn 
                  id={dateInfo.dateStr} 
                  title={dateInfo.dateNum} 
                  label={dateInfo.label}
                  isToday={dateInfo.isToday}
                  tasks={dayTasks} 
                />
              </div>
            );
          })}
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="opacity-80 rotate-2 scale-105 cursor-grabbing">
            <SortableTaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
