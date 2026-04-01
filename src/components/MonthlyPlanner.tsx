import React, { useMemo, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Target, CheckCircle2, TrendingUp, Calendar as CalendarIcon, ListTodo, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

export const MonthlyPlanner = () => {
  const { state: { kanban, goals, pomodoroStats, financialTransactions }, currentProject, addGoal, addKanbanTask } = useApp();
  const [newGoal, setNewGoal] = useState({ title: '', description: '', category: 'Trabalho', targetDate: '' });
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

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
  const handleAddTask = () => {
    if (!newTaskTitle || !selectedDate) return;
    addKanbanTask({
      projectId: currentProject,
      title: newTaskTitle,
      description: '',
      column: 'todo',
      plannerDate: selectedDate
    });
    setNewTaskTitle('');
    setIsTaskDialogOpen(false);
  };

  const safeKanban = kanban || [];
  const safeGoals = goals || [];
  
  const projectTasks = safeKanban.filter(t => t.projectId === currentProject);
  const projectGoals = safeGoals.filter(g => g.projectId === currentProject);
  
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // -- Metrics -- //
  const tasksThisMonth = projectTasks.filter(t => {
    if (!t.plannerDate) return false;
    // plannerDate is "YYYY-MM-DD"
    const [year, month, day] = t.plannerDate.split('-');
    return parseInt(month, 10) - 1 === currentMonth && parseInt(year, 10) === currentYear;
  });
  
  const completedThisMonth = tasksThisMonth.filter(t => t.column === 'done').length;
  const totalThisMonth = tasksThisMonth.length;
  const completionRate = totalThisMonth > 0 ? Math.round((completedThisMonth / totalThisMonth) * 100) : 0;
  
  const activeGoalsThisMonth = projectGoals.filter(g => g.status !== 'done');
  
  // -- Financial Integration -- //
  const safeTransactions = financialTransactions || [];
  const projectTransactions = safeTransactions.filter(t => t.projectId === currentProject);
  const transactionsThisMonth = projectTransactions.filter(t => {
    // Check if the transaction falls into current year/month
    const [year, month] = t.date.split('-');
    return parseInt(month, 10) - 1 === currentMonth && parseInt(year, 10) === currentYear;
  });

  const totalIncome = transactionsThisMonth.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactionsThisMonth.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const currentBalance = totalIncome - totalExpense;

  // -- Calendar Grid -- //
  const getCalendarDays = () => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
    
    const days = [];
    
    // Empty padding for first week
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      // YYYY-MM-DD format strictly for mapping
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(i).padStart(2, '0');
      const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
      
      const dayTasks = tasksThisMonth.filter(t => t.plannerDate === dateStr);
      days.push({
        num: i,
        dateStr,
        isToday: i === today.getDate(),
        taskCount: dayTasks.length,
        doneCount: dayTasks.filter(t => t.column === 'done').length
      });
    }
    
    return days;
  };
  
  const calendarDays = useMemo(() => getCalendarDays(), [tasksThisMonth]);
  const monthName = today.toLocaleString('pt-BR', { month: 'long' });
  
  return (
    <div className="space-y-6">
      
      {/* Resumo de Produtividade */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-t-4 border-t-primary">
          <CardHeader className="py-4">
            <CardDescription className="text-xs font-semibold uppercase">Tarefas do Mês</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-primary" />
              {totalThisMonth}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="border-t-4 border-t-emerald-500">
          <CardHeader className="py-4">
            <CardDescription className="text-xs font-semibold uppercase">Concluídas</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2 text-emerald-500">
              <CheckCircle2 className="w-5 h-5" />
              {completedThisMonth}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="border-t-4 border-t-blue-500">
          <CardHeader className="py-4">
            <CardDescription className="text-xs font-semibold uppercase">Metas em Andamento</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2 text-blue-500">
              <Target className="w-5 h-5" />
              {activeGoalsThisMonth.length}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="border-t-4 border-t-amber-500">
          <CardHeader className="py-4">
            <CardDescription className="text-xs font-semibold uppercase">Sessões de Foco</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2 text-amber-500">
              <TrendingUp className="w-5 h-5" />
              {pomodoroStats.focusSessions}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calendário Mensal Heatmap */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center gap-2 capitalize">
              <CalendarIcon className="w-5 h-5 text-primary" /> {monthName} {currentYear}
            </CardTitle>
            <CardDescription>Visão geral de alocação de tarefas no mês.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground mb-2 mt-4">
              <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, ix) => {
                if (!day) return <div key={`empty-${ix}`} className="h-14 sm:h-20 bg-muted/10 rounded-lg"></div>;
                
                // Color intensity logic based on task volume
                let intensityClass = 'bg-card border-border';
                if (day.taskCount > 0) {
                  if (day.taskCount >= 5) intensityClass = 'bg-primary/40 border-primary border text-primary-foreground';
                  else if (day.taskCount >= 3) intensityClass = 'bg-primary/25 border-primary/50 text-foreground';
                  else intensityClass = 'bg-primary/10 border-primary/20 text-foreground';
                }
                
                return (
                  <div 
                    key={day.dateStr} 
                    onClick={() => { setSelectedDate(day.dateStr); setIsTaskDialogOpen(true); }}
                    className={cn(
                      "h-14 sm:h-20 rounded-lg border flex flex-col items-center justify-center p-1 transition-all relative hover:ring-2 hover:ring-primary/50 cursor-pointer",
                      intensityClass,
                      day.isToday ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                    )}
                  >
                    <span className={cn("text-xs sm:text-sm font-semibold", day.isToday ? 'text-primary' : '')}>{day.num}</span>
                    {day.taskCount > 0 && (
                      <div className="mt-1 flex items-center gap-1 text-[10px]">
                        <span className="font-bold">{day.doneCount}/{day.taskCount}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
          <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agendar Compromisso</DialogTitle>
                <DialogDescription>
                  Adicionar um novo compromisso para o dia {selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR') : ''}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">O que você precisa fazer?</label>
                  <Input 
                    placeholder="Ex: Reunião com Cliente, Pagar Fatura..." 
                    value={newTaskTitle} 
                    onChange={e => setNewTaskTitle(e.target.value)}
                    onKeyDown={e => { if(e.key === 'Enter') handleAddTask() }}
                    autoFocus
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddTask}>Adicionar ao Planner</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Card>
        
        {/* Metas Ativas Resumo e Finanças */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" /> Projetos e Metas
              </CardTitle>
            <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1"><Plus className="w-3.5 h-3.5"/></Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Mapear Nova Meta</DialogTitle>
                  <DialogDescription>Aponte na direção que você quer focar neste mês.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome da Meta</label>
                    <Input placeholder="Ex: Construir Feature X" value={newGoal.title} onChange={e => setNewGoal(prev => ({...prev, title: e.target.value}))}/>
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
                  <Button onClick={handleAddGoal}>Lançar Meta</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-4 mt-2">
            <div className="space-y-2">
              <div className="flex justify-between text-xs mb-1">
                <span>Taxa de Conclusão Mensal</span>
                <span className="font-bold">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>
            
            <div className="pt-4 border-t space-y-3">
              {activeGoalsThisMonth.length === 0 ? (
                <p className="text-sm text-center text-muted-foreground">Nenhuma meta ativa extraída para esse mês.</p>
              ) : (
                activeGoalsThisMonth.slice(0, 5).map(g => (
                  <div key={g.id} className="p-3 border rounded-lg bg-muted/20">
                    <div className="text-xs font-semibold text-primary mb-1">{g.category}</div>
                    <div className="text-sm font-medium">{g.title}</div>
                    {g.targetDate && (
                      <div className="text-[10px] text-muted-foreground mt-2">
                        Prazo: {new Date(g.targetDate).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Integração Financeira Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" /> Balanço Mensal
            </CardTitle>
            <CardDescription>Resumo financeiro do mês atual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 mt-2">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 border rounded-lg bg-green-500/10">
                <div className="flex items-center gap-2 text-green-600">
                  <ArrowUpCircle className="w-4 h-4" /> Entradas
                </div>
                <span className="font-semibold text-green-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncome)}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 border rounded-lg bg-red-500/10">
                <div className="flex items-center gap-2 text-red-600">
                  <ArrowDownCircle className="w-4 h-4" /> Saídas
                </div>
                <span className="font-semibold text-red-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpense)}
                </span>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Saldo Líquido</span>
                <span className={cn("text-lg font-bold", currentBalance >= 0 ? "text-green-600" : "text-red-500")}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentBalance)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};
