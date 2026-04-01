import React, { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from 'recharts';
import {
    TrendingUp,
    Clock,
    Target,
    DollarSign,
    Zap,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    BrainCircuit,
    Sparkles,
    Briefcase
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export const Analytics = () => {
    const { state } = useApp();

    // ── Data Processing: Pomodoro History ──────────────────────────────────
    const pomodoroData = useMemo(() => {
        // Obter os últimos 7 dias dinamicamente
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const todayIdx = new Date().getDay();
        
        // Inicializar array com 0 para os últimos 7 dias (terminando em hoje)
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return {
                day: days[date.getDay()],
                dateStr: date.toISOString().split('T')[0],
                sessions: 0
            };
        });

        // Contabilizar sessões reais lendo 'wellnessStats.breaks' (Pausas denotam um Foco Terminado)
        const breaks = state.wellnessStats?.breaks || [];
        breaks.forEach(b => {
             if (b.dataHora && b.adesaoStatus === 'Concluida') {
                 const d = b.dataHora.split('T')[0];
                 const dayObj = last7Days.find(x => x.dateStr === d);
                 if (dayObj) dayObj.sessions++;
             }
        });

        return last7Days.map(d => ({ day: d.day, sessions: d.sessions }));
    }, [state.wellnessStats?.breaks]);

    // ── Data Processing: Finance ───────────────────────────────────────────
    const financeData = useMemo(() => {
        const transactions = state.financialTransactions || [];
        const monthly = transactions.reduce((acc: any, t) => {
            if (!t.date) return acc;
            const date = new Date(t.date);
            if (isNaN(date.getTime())) return acc;
            
            const month = date.toLocaleString('pt-BR', { month: 'short' });
            if (!acc[month]) acc[month] = { month, receita: 0, despesa: 0 };
            if (t.type === 'income') acc[month].receita += t.amount || 0;
            else acc[month].despesa += t.amount || 0;
            return acc;
        }, {});

        const data = Object.values(monthly).sort((a: any, b: any) => new Date(a.month).getTime() - new Date(b.month).getTime());
        return data; // Retorna array vazio se não houver registros, deixando o gráfico real limpo
    }, [state.financialTransactions]);

    // ── Data Processing: Kanban ────────────────────────────────────────────
    const kanbanDistribution = useMemo(() => {
        const tasks = state.kanban || [];
        const todo = tasks.filter(t => t.column === 'todo').length;
        const doing = tasks.filter(t => t.column === 'inProgress').length;
        const done = tasks.filter(t => t.column === 'done').length;

        return [
            { name: 'A Fazer', value: todo, color: '#94a3b8' },
            { name: 'Em Curso', value: doing, color: '#3b82f6' },
            { name: 'Concluído', value: done, color: '#22c55e' },
        ];
    }, [state.kanban]);

    const COLORS = ['#94a3b8', '#3b82f6', '#22c55e'];

    // Real computations
    const totalTransactions = state.financialTransactions || [];
    const absoluteBalance = totalTransactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
    const productivityRate = state.kanban?.length > 0 
        ? Math.round((state.kanban.filter(t => t.column === 'done').length / state.kanban.length) * 100) 
        : 0;


    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-xs">
                        <BrainCircuit className="h-4 w-4" />
                        Intelligence Insights
                    </div>
                    <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/50">
                        Relatórios Avançados
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Visão analítica do seu desempenho, progresso e saúde financeira.
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-card/50 p-2 rounded-2xl border border-primary/5">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-sm font-bold">Últimos 30 dias</span>
                </div>
            </div>

            {/* Top KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Produtividade (Tarefas)', value: `${productivityRate}%`, icon: Zap, trend: 'Kanban', color: 'text-yellow-500' },
                    { label: 'Tempo de Foco', value: `${state.pomodoroStats?.totalMinutes || 0}m`, icon: Clock, trend: 'Acumulado', color: 'text-primary' },
                    { label: 'Receita Total', value: `R$ ${Number(financeData.reduce((a: any, b: any) => a + (b.receita || 0), 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, trend: 'Líquido', color: 'text-green-500' },
                    { label: 'Projetos Ativos', value: state.projects?.filter(p => p.id !== 'default').length || 0, icon: Briefcase, trend: 'Customizados', color: 'text-blue-500' },
                ].map((kpi, i) => (
                    <Card key={i} className="group hover:shadow-2xl transition-all duration-500 border-primary/5 overflow-hidden">
                        <CardHeader className="p-4 pb-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase text-muted-foreground">{kpi.label}</span>
                                <kpi.icon className={cn("h-4 w-4", kpi.color)} />
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-black">{kpi.value}</div>
                            <div className="flex items-center gap-1 mt-1">
                                <span className="text-[10px] font-bold text-muted-foreground">{kpi.trend}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue vs Expense Chart */}
                <Card className="border-primary/5 shadow-xl bg-card/50 backdrop-blur">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-xl font-bold flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-green-500" />
                                    Fluxo de Caixa
                                </CardTitle>
                                <CardDescription>Receitas vs Despesas (Mensal)</CardDescription>
                            </div>
                            <div className="flex gap-4 text-xs font-bold">
                                <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-primary" /> Receita</div>
                                <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-destructive" /> Despesa</div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={financeData}>
                                <defs>
                                    <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--primary)/.1)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="receita" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRec)" strokeWidth={3} />
                                <Area type="monotone" dataKey="despesa" stroke="#ef4444" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Focus Distribution Chart */}
                <Card className="border-primary/5 shadow-xl bg-card/50 backdrop-blur">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            Distribuição de Foco
                        </CardTitle>
                        <CardDescription>Sessões de Pomodoro na última semana</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={pomodoroData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1, radius: 8 }}
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--primary)/.1)' }}
                                />
                                <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={35} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Row: Distribution & Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Kanban Status */}
                <Card className="lg:col-span-1 border-primary/5 shadow-xl bg-card/50">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Status do Kanban</CardTitle>
                        <CardDescription>Volume de tarefas por coluna</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[250px] flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={kanbanDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {kanbanDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                            <span className="text-2xl font-black">{kanbanDistribution.reduce((a, b) => a + b.value, 0)}</span>
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">Total</span>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col gap-2 p-4">
                        {kanbanDistribution.map((item, i) => (
                            <div key={i} className="flex items-center justify-between w-full text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span>{item.name}</span>
                                </div>
                                <span className="font-bold">{item.value}</span>
                            </div>
                        ))}
                    </CardFooter>
                </Card>

                {/* Goals & Completion */}
                <Card className="lg:col-span-2 border-primary/5 shadow-xl bg-card/50">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Target className="h-5 w-5 text-primary" />
                                    Metas & Objetivos
                                </CardTitle>
                                <CardDescription>Acompanhamento de objetivos do Q1</CardDescription>
                            </div>
                            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {[
                            { label: 'Evolução Profissional (Nível 5+)', value: ((state.gamificationStats?.nivel || 1) / 5) * 100, color: 'bg-primary' },
                            { label: 'Alvo de Caixa (R$ 10k)', value: (Math.max(0, absoluteBalance) / 10000) * 100, color: 'bg-green-500' },
                            { label: 'Consistência de Foco (100h)', value: ((state.pomodoroStats?.totalMinutes || 0) / 6000) * 100, color: 'bg-blue-500' },
                            { label: 'Badges Desbloqueados (10 total)', value: ((state.gamificationStats?.badges?.length || 0) / 10) * 100, color: 'bg-yellow-500' },
                        ].map((goal, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-semibold">{goal.label}</span>
                                    <span className="font-black text-primary">{Math.min(100, Math.round(goal.value))}%</span>
                                </div>
                                <Progress value={goal.value} className="h-2.5 bg-muted/30" indicatorClassName={goal.color} />
                            </div>
                        ))}
                    </CardContent>
                    <CardFooter className="bg-primary/5 p-4 rounded-b-xl border-t border-primary/5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                <Sparkles className="h-5 w-5 text-primary" />
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed italic">
                                "{productivityRate > 50 
                                    ? 'Sua esteira de produtividade está avançando bem! Mantenha a disciplina de fechar as tarefas pendentes.' 
                                    : 'Existem várias pendências acumuladas. Tente focar usando as sessões de Pomodoro para esvaziar seu Kanban.'}"
                            </p>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};
