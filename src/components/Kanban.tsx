import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Plus, Trash2, GripVertical, Pencil, Users, Lock, Layout, Target } from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor, useDroppable, DragOverEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import type { KanbanTask } from '@/contexts/AppContext';

const columns = [
  { id: 'todo', title: 'A Fazer', color: 'bg-blue-500' },
  { id: 'inProgress', title: 'Fazendo', color: 'bg-amber-500' },
  { id: 'done', title: 'Pronto', color: 'bg-emerald-500' },
] as const;

function DroppableColumn({
  column,
  tasks,
  children
}: {
  column: typeof columns[number];
  tasks: KanbanTask[];
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div key={column.id} className="flex flex-col h-full bg-muted/30 rounded-xl overflow-hidden border border-transparent hover:border-muted-foreground/10 transition-colors">
      <div className={cn("px-4 py-3 font-bold text-sm tracking-wide flex items-center justify-between shadow-sm", column.color, "text-white")}>
        <span>{column.title.toUpperCase()}</span>
        <Badge variant="secondary" className="bg-white/20 text-white border-none h-5 px-1.5 text-[10px]">{tasks.length}</Badge>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 p-3 space-y-3 min-h-[500px] transition-all duration-200",
          isOver ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' : ''
        )}
      >
        {children}
      </div>
    </div>
  );
}

function SortableTask({ task, onDelete, onEdit, currentUserId }: { task: KanbanTask; onDelete: () => void; onEdit: () => void; currentUserId?: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 0,
  };

  const isOwner = task.userId === currentUserId;

  return (
    <div ref={setNodeRef} style={style} className="group outline-none">
      <Card className={cn(
        "hover:shadow-md transition-all border-none bg-card relative overflow-hidden",
        task.accessLevel === 'shared' ? "border-l-4 border-l-primary" : ""
      )}>
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <button {...attributes} {...listeners} className="mt-1 cursor-grab active:cursor-grabbing hover:text-primary transition-colors">
              <GripVertical className="h-4 w-4 text-muted-foreground/40" />
            </button>
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-1.5 mb-1">
                <h4 className="font-semibold text-sm leading-tight truncate">{task.title}</h4>
                {task.accessLevel === 'shared' && <Users className="h-3 w-3 text-primary shrink-0" />}
              </div>
              {task.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{task.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                {task.recurrence && task.recurrence !== 'none' && (
                  <Badge variant="outline" className="text-[9px] py-0 h-4 border-primary/20 text-primary">
                    {task.recurrence === 'daily' ? 'Diário' : 'Semanal'}
                  </Badge>
                )}
                {!isOwner && task.userId && (
                  <span className="text-[9px] text-muted-foreground italic flex items-center gap-1">
                    <Users className="h-2 w-2" /> Outro
                  </span>
                )}
                {task.goalId && (
                  <Badge variant="secondary" className="text-[9px] py-0 h-4 bg-primary/10 text-primary flex items-center gap-1">
                    <Target className="w-2 h-2" /> Meta
                  </Badge>
                )}
              </div>
            </div>
            <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={onEdit} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-primary"><Pencil className="h-3.5 w-3.5" /></button>
              <button onClick={onDelete} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const Kanban = () => {
  const { state, currentProject, addKanbanTask, updateKanbanTask, deleteKanbanTask } = useApp();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
  const [filter, setFilter] = useState<'all' | 'private' | 'shared'>('all');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    column: 'todo' as const,
    recurrence: 'none' as const,
    accessLevel: 'private' as 'private' | 'shared',
    goalId: 'none' as string | undefined,
  });

  const projectGoals = (state.goals || []).filter(g => g.projectId === currentProject);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const projectTasks = state.kanban.filter(task => {
    const isProject = task.projectId === currentProject;
    if (filter === 'all') return isProject;
    return isProject && task.accessLevel === filter;
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const task = projectTasks.find(t => t.id === taskId);
    if (!task) return;

    // Check permissions if shared
    const isOwner = task.userId === user?.id;
    const isAdmin = user?.sub_role === 'org_admin' || user?.sub_role === 'manager';
    if (task.accessLevel === 'shared' && !isOwner && !isAdmin) {
      toast.error('Somente administradores ou o dono podem mover tarefas do time');
      return;
    }

    // Check if dropped over a column
    const columnIds = columns.map(c => c.id);
    if (columnIds.includes(over.id as any)) {
      const newColumn = over.id as KanbanTask['column'];
      if (task.column !== newColumn) {
        updateKanbanTask(taskId, {
          column: newColumn,
          completedAt: newColumn === 'done' ? new Date().toISOString() : undefined,
        });
        toast.success('Tarefa movida');
      }
    }
  };

  const handleAddTask = () => {
    if (!newTask.title.trim()) {
      toast.error('O título é obrigatório');
      return;
    }

    addKanbanTask({
      projectId: currentProject,
      ...newTask,
      goalId: newTask.goalId === 'none' ? undefined : newTask.goalId,
      userId: user?.id,
    });

    setNewTask({
      title: '',
      description: '',
      column: 'todo',
      recurrence: 'none',
      accessLevel: 'private',
      goalId: 'none',
    });
    setIsDialogOpen(false);
    toast.success('Tarefa criada');
  };

  const handleEditTask = () => {
    if (!editingTask || !editingTask.title.trim()) {
      toast.error('O título é obrigatório');
      return;
    }

    updateKanbanTask(editingTask.id, {
      title: editingTask.title,
      description: editingTask.description,
      column: editingTask.column,
      recurrence: editingTask.recurrence,
      accessLevel: editingTask.accessLevel,
      goalId: editingTask.goalId,
    });

    setEditingTask(null);
    setIsEditDialogOpen(false);
    toast.success('Tarefa atualizada');
  };

  const openEditDialog = (task: KanbanTask) => {
    const isOwner = task.userId === user?.id;
    const isAdmin = user?.sub_role === 'org_admin' || user?.sub_role === 'manager';

    if (task.accessLevel === 'shared' && !isOwner && !isAdmin) {
      toast.error('Somente administradores ou o dono podem editar tarefas do time');
      return;
    }

    setEditingTask({ ...task });
    setIsEditDialogOpen(true);
  };

  const handleDeleteTask = (task: KanbanTask) => {
    const isOwner = task.userId === user?.id;
    const isAdmin = user?.sub_role === 'org_admin' || user?.sub_role === 'manager';

    if (!isOwner && !isAdmin) {
      toast.error('Sem permissão para excluir esta tarefa');
      return;
    }

    deleteKanbanTask(task.id);
    toast.success('Tarefa deletada');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/20 p-4 rounded-xl border border-dashed">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg"><Layout className="h-5 w-5 text-primary" /></div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Time Board</h2>
            <p className="text-xs text-muted-foreground font-medium">Gerencie o fluxo de trabalho {user?.organization_id ? 'da equipe' : 'pessoal'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Tabs defaultValue="all" className="w-full md:w-[240px]" onValueChange={(v) => setFilter(v as any)}>
            <TabsList className="grid w-full grid-cols-3 h-9">
              <TabsTrigger value="all" className="text-xs">Tudo</TabsTrigger>
              <TabsTrigger value="private" className="text-xs">Privado</TabsTrigger>
              <TabsTrigger value="shared" className="text-xs">Time</TabsTrigger>
            </TabsList>
          </Tabs>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0 h-9 font-bold bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" /> Novo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Criar Nova Tarefa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Input
                    placeholder="O que precisa ser feito?"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="font-semibold"
                  />
                </div>
                <Textarea
                  placeholder="Adicione mais detalhes..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="resize-none min-h-[100px]"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Coluna</label>
                    <Select
                      value={newTask.column}
                      onValueChange={(value: any) => setNewTask({ ...newTask, column: value })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map(col => (
                          <SelectItem key={col.id} value={col.id} className="text-xs">
                            {col.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Recorrência</label>
                    <Select
                      value={newTask.recurrence}
                      onValueChange={(value: any) => setNewTask({ ...newTask, recurrence: value })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs">Nenhuma</SelectItem>
                        <SelectItem value="daily" className="text-xs">Diária</SelectItem>
                        <SelectItem value="weekly" className="text-xs">Semanal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Meta Vinculada</label>
                    <Select
                      value={newTask.goalId || 'none'}
                      onValueChange={(value: any) => setNewTask({ ...newTask, goalId: value })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs">Nenhuma Meta</SelectItem>
                        {projectGoals.map(goal => (
                          <SelectItem key={goal.id} value={goal.id} className="text-xs">
                            🎯 {goal.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {user?.organization_id && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Quem pode ver?</label>
                    <div className="flex items-center gap-1 p-1 bg-muted rounded-md border">
                      <Button
                        variant={newTask.accessLevel === 'private' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setNewTask({ ...newTask, accessLevel: 'private' })}
                        className="flex-1 h-8 text-[11px] gap-2"
                      >
                        <Lock className="h-3 w-3" /> Privado
                      </Button>
                      <Button
                        variant={newTask.accessLevel === 'shared' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setNewTask({ ...newTask, accessLevel: 'shared' })}
                        className="flex-1 h-8 text-[11px] gap-2"
                      >
                        <Users className="h-3 w-3" /> Time
                      </Button>
                    </div>
                  </div>
                )}

                <Button onClick={handleAddTask} className="w-full h-10 font-bold uppercase tracking-wide">
                  Adicionar Tarefa
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Tarefa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Título"
                value={editingTask?.title || ''}
                onChange={(e) => setEditingTask(prev => prev ? { ...prev, title: e.target.value } : null)}
              />
              <Textarea
                placeholder="Descrição"
                value={editingTask?.description || ''}
                onChange={(e) => setEditingTask(prev => prev ? { ...prev, description: e.target.value } : null)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Select
                  value={editingTask?.column}
                  onValueChange={(value: any) => setEditingTask(prev => prev ? { ...prev, column: value } : null)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map(col => (
                      <SelectItem key={col.id} value={col.id} className="text-xs">
                        {col.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={editingTask?.recurrence}
                  onValueChange={(value: any) => setEditingTask(prev => prev ? { ...prev, recurrence: value } : null)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">Nenhuma</SelectItem>
                    <SelectItem value="daily" className="text-xs">Diária</SelectItem>
                    <SelectItem value="weekly" className="text-xs">Semanal</SelectItem>
                  </SelectContent>
                </Select>
                <div className="col-span-2">
                  <Select
                    value={editingTask?.goalId || 'none'}
                    onValueChange={(value: any) => setEditingTask(prev => prev ? { ...prev, goalId: value === 'none' ? undefined : value } : null)}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Vincular a uma Meta..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-xs">Nenhuma Meta</SelectItem>
                      {projectGoals.map(goal => (
                        <SelectItem key={goal.id} value={goal.id} className="text-xs">
                          🎯 {goal.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {user?.organization_id && (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Visibilidade</label>
                  <div className="flex items-center gap-1 p-1 bg-muted rounded-md border">
                    <Button
                      variant={editingTask?.accessLevel === 'private' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setEditingTask(prev => prev ? { ...prev, accessLevel: 'private' } : null)}
                      className="flex-1 h-8 text-[11px] gap-2"
                    >
                      <Lock className="h-3 w-3" /> Privado
                    </Button>
                    <Button
                      variant={editingTask?.accessLevel === 'shared' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setEditingTask(prev => prev ? { ...prev, accessLevel: 'shared' } : null)}
                      className="flex-1 h-8 text-[11px] gap-2"
                    >
                      <Users className="h-3 w-3" /> Time
                    </Button>
                  </div>
                </div>
              )}

              <Button onClick={handleEditTask} className="w-full font-bold">
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid gap-6 md:grid-cols-3 min-h-[600px]">
          {columns.map(column => {
            const columnTasks = projectTasks.filter(task => task.column === column.id);

            return (
              <DroppableColumn key={column.id} column={column} tasks={columnTasks}>
                <SortableContext items={columnTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  {columnTasks.map(task => (
                    <SortableTask
                      key={task.id}
                      task={task}
                      currentUserId={user?.id}
                      onEdit={() => openEditDialog(task)}
                      onDelete={() => handleDeleteTask(task)}
                    />
                  ))}
                </SortableContext>
              </DroppableColumn>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
};
