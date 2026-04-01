import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, CheckCircle2, ListTodo, Activity, Target, Trash2, Plus, CalendarDays, Heart, Palette } from 'lucide-react';
import { WeeklyPlanner } from '@/components/WeeklyPlanner';
import { MonthlyPlanner } from '@/components/MonthlyPlanner';
import { WheelOfLife } from '@/components/WheelOfLife';
import { YearInPixels } from '@/components/YearInPixels';
import { DreamBoard } from '@/components/DreamBoard';
import { Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Planner = () => {
  const { 
    state: { goals, habits, habitLogs, kanban, pomodoroStats }, 
    currentProject, 
    addGoal, updateGoal, deleteGoal, 
    addHabit, deleteHabit, 
    addHabitLog,
    updateKanbanTask
  } = useApp();

  const [newGoal, setNewGoal] = useState({ title: '', description: '', category: 'Trabalho', targetDate: '' });
  const [newHabit, setNewHabit] = useState({ title: '', frequency: 'daily' });
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isHabitDialogOpen, setIsHabitDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [newChecklistItems, setNewChecklistItems] = useState<Record<string, string>>({});

  // We ensure arrays are always defined (fallbacks due to loading states etc)
  const safeGoals = goals || [];
  const safeHabits = habits || [];
  const safeLogs = habitLogs || [];
  const safeKanban = kanban || [];

  const getLocalISODate = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayDate = getLocalISODate();

  const projectGoals = safeGoals.filter(g => g.projectId === currentProject);
  const projectHabits = safeHabits.filter(h => h.projectId === currentProject);
  
  // Foco de Hoje: Tarefas do Kanban com plannerDate igual a hoje e não concluídas
  const todayTasks = safeKanban.filter(t => t.projectId === currentProject && t.plannerDate === todayDate && t.column !== 'done');
  
  // Backlog: Tarefas sem plannerDate de hoje
  const backlogTasks = safeKanban.filter(t => t.projectId === currentProject && t.plannerDate !== todayDate && t.column !== 'done');
  

  const handleAddGoal = () => {
    if (!newGoal.title) return;
    addGoal({
      projectId: currentProject,
      title: newGoal.title,
      description: newGoal.description,
      category: newGoal.category,
      targetDate: newGoal.targetDate || new Date().toISOString(),
      progress: 0,
      status: 'pending'
    });
    setNewGoal({ title: '', description: '', category: 'Trabalho', targetDate: '' });
    setIsGoalDialogOpen(false);
  };

  const handleAddHabit = () => {
    if (!newHabit.title) return;
    addHabit({
      projectId: currentProject,
      title: newHabit.title,
      frequency: newHabit.frequency as 'daily' | 'weekly',
    });
    setNewHabit({ title: '', frequency: 'daily' });
    setIsHabitDialogOpen(false);
  };

  const toggleHabitForToday = (habitId: string) => {
    const existingLog = safeLogs.find(l => l.habitId === habitId && l.date === todayDate);
    if (!existingLog) {
      addHabitLog({
        habitId,
        date: todayDate,
        status: 'completed'
      });
    }
  };

  const isHabitCompletedToday = (habitId: string) => {
    return safeLogs.some(l => l.habitId === habitId && l.date === todayDate && l.status === 'completed');
  };

  const handleAddChecklistItem = (goalId: string) => {
    const title = newChecklistItems[goalId];
    if (!title) return;
    const goal = projectGoals.find(g => g.id === goalId);
    if (!goal) return;
    
    const newItem = { id: crypto.randomUUID(), title, completed: false };
    const updatedChecklist = [...(goal.checklist || []), newItem];
    
    updateGoal(goalId, { checklist: updatedChecklist });
    setNewChecklistItems(prev => ({ ...prev, [goalId]: '' }));
  };

  const handleToggleChecklistItem = (goalId: string, itemId: string) => {
    const goal = projectGoals.find(g => g.id === goalId);
    if (!goal || !goal.checklist) return;

    const updatedChecklist = goal.checklist.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    updateGoal(goalId, { checklist: updatedChecklist });
  };
  
  const handleDeleteChecklistItem = (goalId: string, itemId: string) => {
    const goal = projectGoals.find(g => g.id === goalId);
    if (!goal || !goal.checklist) return;

    const updatedChecklist = goal.checklist.filter(item => item.id !== itemId);
    updateGoal(goalId, { checklist: updatedChecklist });
  };

  // Auto-calculate goal progress based on connected kanban tasks or checklist
  const getGoalProgress = (goalId: string) => {
    const goal = projectGoals.find(g => g.id === goalId);
    
    const tasks = safeKanban.filter(t => t.goalId === goalId);
    if (tasks.length > 0) {
      const completed = tasks.filter(t => t.column === 'done').length;
      return Math.round((completed / tasks.length) * 100);
    }
    
    if (goal?.checklist && goal.checklist.length > 0) {
      const completed = goal.checklist.filter(i => i.completed).length;
      return Math.round((completed / goal.checklist.length) * 100);
    }

    return goal?.progress || 0;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Centro de Comando (Planner)</h1>
          <p className="text-muted-foreground mt-1">Conecte sua execução diária à sua visão de longo prazo.</p>
        </div>
      </div>

      <Tabs defaultValue="dia" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="dia" className="flex items-center gap-2"><Target className="w-4 h-4" /> Meu Dia</TabsTrigger>
          <TabsTrigger value="semana" className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Semana</TabsTrigger>
          <TabsTrigger value="mes" className="flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Mês</TabsTrigger>
          <TabsTrigger value="metas" className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Minhas Metas</TabsTrigger>
          <TabsTrigger value="habitos" className="flex items-center gap-2"><Activity className="w-4 h-4" /> Hábitos</TabsTrigger>
          <TabsTrigger value="autoconhecimento" className="flex items-center gap-2"><Heart className="w-4 h-4" /> Roda da Vida</TabsTrigger>
          <TabsTrigger value="pixels" className="flex items-center gap-2"><Palette className="w-4 h-4" /> Ano em Pixels</TabsTrigger>
          <TabsTrigger value="dreamboard" className="flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Tábua dos Sonhos</TabsTrigger>
        </TabsList>

        <TabsContent value="mes" className="space-y-4">
          <MonthlyPlanner />
        </TabsContent>

        <TabsContent value="semana" className="space-y-4">
          <WeeklyPlanner />
        </TabsContent>

        <TabsContent value="autoconhecimento" className="space-y-4">
          <WheelOfLife />
        </TabsContent>

        <TabsContent value="pixels" className="space-y-4">
          <YearInPixels />
        </TabsContent>

        <TabsContent value="dreamboard" className="space-y-4">
          <DreamBoard />
        </TabsContent>

        <TabsContent value="dia" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" /> Daily Tracker
                </CardTitle>
                <CardDescription>Pequenas vitórias diárias constroem o império.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {projectHabits.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum hábito rastreado. Vá na aba Hábitos!</p>
                ) : (
                  projectHabits.map(habit => (
                    <div key={habit.id} className="flex items-center space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <Checkbox 
                        id={`habit-${habit.id}`}
                        checked={isHabitCompletedToday(habit.id)}
                        onCheckedChange={() => toggleHabitForToday(habit.id)}
                        disabled={isHabitCompletedToday(habit.id)}
                      />
                      <label 
                        htmlFor={`habit-${habit.id}`}
                        className={`text-sm font-medium leading-none cursor-pointer flex-1 ${isHabitCompletedToday(habit.id) ? 'line-through text-muted-foreground' : ''}`}
                      >
                        {habit.title}
                      </label>
                      <span className="text-xs text-muted-foreground">{habit.frequency === 'daily' ? 'Diário' : 'Semanal'}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <ListTodo className="w-5 h-5 text-primary" /> Foco de Hoje
                  </CardTitle>
                  <CardDescription>O que precisamos terminar hoje?.</CardDescription>
                </div>
                <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2"><Plus className="w-4 h-4"/> Puxar Tarefa</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Puxar do Kanban</DialogTitle>
                      <DialogDescription>Selecione uma tarefa do Kanban para focar hoje.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto py-2">
                      {backlogTasks.length === 0 ? (
                        <p className="text-sm text-center text-muted-foreground p-4">Nenhuma tarefa pendente no Kanban para associar.</p>
                      ) : (
                        backlogTasks.map(bt => (
                          <div 
                            key={bt.id} 
                            onClick={() => { updateKanbanTask(bt.id, { plannerDate: todayDate }); setIsTaskDialogOpen(false); }}
                            className="p-3 border rounded-lg hover:border-primary/50 cursor-pointer flex justify-between items-center transition-colors"
                          >
                            <span className="text-sm font-medium">{bt.title}</span>
                            <Plus className="w-4 h-4 text-muted-foreground" />
                          </div>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
                {todayTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Sua mesa está limpa! Descanse ou puxe tarefas do Kanban.</p>
                ) : (
                  todayTasks.map(task => (
                    <div key={task.id} className="p-3 rounded-lg border bg-card flex flex-col gap-2 hover:border-primary/50 group">
                      <div className="flex justify-between items-start">
                        <div className="font-medium text-sm">{task.title}</div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => updateKanbanTask(task.id, { plannerDate: undefined })}>
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        {task.goalId && (
                          <div className="flex items-center gap-1 text-xs text-primary">
                            <Target className="w-3 h-3" />
                            <span>Atrelado a uma Meta</span>
                          </div>
                        )}
                        <Button 
                          size="sm" 
                          variant={task.column === 'done' ? 'outline' : 'default'} 
                          className="h-6 text-xs px-2 ml-auto"
                          onClick={() => updateKanbanTask(task.id, { column: 'done' })}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Concluir
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metas" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4"/> Nova Meta</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Meta</DialogTitle>
                  <DialogDescription>Defina sua direção de longo prazo.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome da Meta</label>
                    <Input placeholder="Ex: Atingir 10k MRR" value={newGoal.title} onChange={e => setNewGoal(prev => ({...prev, title: e.target.value}))}/>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Categoria</label>
                    <Select value={newGoal.category} onValueChange={v => setNewGoal(prev => ({...prev, category: v}))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Trabalho">Trabalho</SelectItem>
                        <SelectItem value="Financeiro">Financeiro</SelectItem>
                        <SelectItem value="Saúde">Saúde</SelectItem>
                        <SelectItem value="Pessoal">Pessoal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddGoal}>Salvar Meta</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectGoals.length === 0 ? (
              <div className="col-span-full text-center py-10 text-muted-foreground border border-dashed rounded-lg">
                <Target className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>Nenhuma meta definida. Para onde você está indo?</p>
              </div>
            ) : (
              projectGoals.map(goal => {
                const progress = getGoalProgress(goal.id) || goal.progress;
                return (
                  <Card key={goal.id} className="relative overflow-hidden group">
                    <div className={`absolute top-0 left-0 w-1 h-full bg-primary`} />
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary mb-2 inline-block">
                          {goal.category}
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteGoal(goal.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 mt-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progresso</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      <div className="space-y-3 mt-4 pt-4 border-t">
                        <div className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                          <ListTodo className="w-4 h-4" /> Passos / Checklist
                        </div>
                        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 scrollbar-none">
                          {(goal.checklist || []).map(item => (
                            <div key={item.id} className="flex items-center gap-2 group/check">
                              <Checkbox 
                                id={`check-${item.id}`}
                                checked={item.completed} 
                                onCheckedChange={() => handleToggleChecklistItem(goal.id, item.id)} 
                              />
                              <label htmlFor={`check-${item.id}`} className={cn("text-sm cursor-pointer select-none flex-1 truncate transition-all", item.completed ? 'line-through text-muted-foreground' : '')}>
                                {item.title}
                              </label>
                              <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover/check:opacity-100 transition-opacity" onClick={() => handleDeleteChecklistItem(goal.id, item.id)}>
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <Input 
                            placeholder="Adicionar passo..." 
                            className="h-8 text-sm" 
                            value={newChecklistItems[goal.id] || ''}
                            onChange={(e) => setNewChecklistItems(prev => ({ ...prev, [goal.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddChecklistItem(goal.id) }}
                          />
                          <Button size="sm" variant="secondary" className="h-8 px-2" onClick={() => handleAddChecklistItem(goal.id)}><Plus className="w-4 h-4"/></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="habitos" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isHabitDialogOpen} onOpenChange={setIsHabitDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4"/> Novo Hábito</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Monitor de Hábitos</DialogTitle>
                  <DialogDescription>O que você deseja monitorar?</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Hábito</label>
                    <Input placeholder="Ex: Beber 2L de Água" value={newHabit.title} onChange={e => setNewHabit(prev => ({...prev, title: e.target.value}))}/>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddHabit}>Adicionar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {projectHabits.length === 0 ? (
              <div className="col-span-full text-center py-10 text-muted-foreground border border-dashed rounded-lg">
                <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>Nenhum hábito rastreado. Comece hoje.</p>
              </div>
            ) : (
              projectHabits.map(habit => (
                <Card key={habit.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="py-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">{habit.title}</CardTitle>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteHabit(habit.id)}>
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
