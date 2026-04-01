import React, { useMemo, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Folder,
    FileText,
    Code,
    Layers,
    DollarSign,
    Plus,
    ChevronRight,
    MoreVertical,
    CheckCircle2,
    Clock,
    LayoutGrid,
    Search,
    Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export const ProjectExplorer = () => {
    const { state, setCurrentProject, setCurrentTab } = useApp();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProject, setSelectedProject] = useState<string | null>(null);

    const filteredProjects = useMemo(() => {
        return state.projects.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [state.projects, searchQuery]);

    const activeProject = useMemo(() => {
        const id = selectedProject || 'default';
        return state.projects.find(p => p.id === id);
    }, [state.projects, selectedProject]);

    // Summary calculations for the selected project
    const summary = useMemo(() => {
        const id = activeProject?.id;
        if (!id) return null;

        return {
            notes: state.notes.filter(n => n.projectId === id).length,
            snippets: state.snippets.filter(s => s.projectId === id).length,
            tasks: state.kanban.filter(t => t.projectId === id).length,
            tasksDone: state.kanban.filter(t => t.projectId === id && t.column === 'done').length,
            finance: state.financialTransactions.filter(t => t.projectId === id).length,
            balance: state.financialTransactions
                .filter(t => t.projectId === id)
                .reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0),
        };
    }, [state, activeProject]);

    const handleSelectProject = (projectId: string) => {
        setSelectedProject(projectId);
        setCurrentProject(projectId);
    };

    const navigateToModule = (tab: string) => {
        setCurrentTab(tab);
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Project Explorer</h1>
                    <p className="text-muted-foreground">Visão 360º de todos os seus ativos por projeto.</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar projeto..."
                            className="pl-9 h-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button size="sm" className="h-9 gap-2">
                        <Plus className="h-4 w-4" />
                        Novo Projeto
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Projects Sidebar/List */}
                <Card className="lg:col-span-1 border-none bg-card/50 backdrop-blur">
                    <CardHeader className="p-4">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Layers className="h-4 w-4 text-primary" />
                            Seus Projetos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 pt-0">
                        <ScrollArea className="h-[500px] pr-4">
                            <div className="space-y-1">
                                {filteredProjects.map((project) => (
                                    <button
                                        key={project.id}
                                        onClick={() => handleSelectProject(project.id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group relative",
                                            activeProject?.id === project.id
                                                ? "bg-primary/15 text-primary font-medium"
                                                : "hover:bg-muted text-muted-foreground"
                                        )}
                                    >
                                        <div
                                            className="h-2 w-2 rounded-full shrink-0 shadow-sm"
                                            style={{ backgroundColor: project.color }}
                                        />
                                        <span className="truncate flex-1 text-left">{project.name}</span>
                                        {activeProject?.id === project.id && (
                                            <div className="h-1 w-1 bg-primary rounded-full animate-pulse" />
                                        )}
                                        <ChevronRight className={cn(
                                            "h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100",
                                            activeProject?.id === project.id && "opacity-100"
                                        )} />
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Project Details View */}
                <div className="lg:col-span-3 space-y-6">
                    {activeProject ? (
                        <>
                            <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-primary/10 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="h-10 w-10 rounded-xl flex items-center justify-center text-white"
                                        style={{ backgroundColor: activeProject.color }}
                                    >
                                        <Folder className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{activeProject.name}</h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-[10px] h-4">ID: {activeProject.id}</Badge>
                                            <span className="text-xs text-muted-foreground">Última atualização: Hoje</span>
                                        </div>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>Editar Detalhes</DropdownMenuItem>
                                        <DropdownMenuItem>Arquivar Projeto</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive">Excluir Permanente</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="bg-primary/5 border-primary/10 group cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigateToModule('kanban')}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tarefas</CardTitle>
                                            <CheckCircle2 className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                                        </div>
                                        <div className="text-2xl font-bold">{summary?.tasks}</div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span className="text-primary font-medium">{summary?.tasksDone} concluídas</span>
                                            <span>•</span>
                                            <span>{summary?.tasks ? Math.round((summary.tasksDone / summary.tasks) * 100) : 0}% progresso</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-card border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigateToModule('notes')}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Notas & Docs</CardTitle>
                                            <FileText className="h-4 w-4 text-blue-500" />
                                        </div>
                                        <div className="text-2xl font-bold">{summary?.notes}</div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-xs text-muted-foreground">Clique para gerenciar base de conhecimento</p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-card border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigateToModule('finance')}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Financeiro</CardTitle>
                                            <DollarSign className="h-4 w-4 text-green-500" />
                                        </div>
                                        <div className="text-2xl font-bold">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary?.balance || 0)}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>{summary?.finance} transações vinculadas</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base">Snippets & Código</CardTitle>
                                            <Code className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {summary?.snippets ? (
                                            <div className="space-y-4">
                                                {state.snippets.filter(s => s.projectId === activeProject.id).slice(0, 3).map(snippet => (
                                                    <div key={snippet.id} className="flex items-center justify-between p-2 rounded bg-muted/50 border">
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <div className="h-2 w-2 rounded-full bg-blue-400" />
                                                            <span className="text-sm font-medium truncate">{snippet.title}</span>
                                                        </div>
                                                        <Badge variant="secondary" className="text-[10px] shrink-0">{snippet.language}</Badge>
                                                    </div>
                                                ))}
                                                <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => navigateToModule('snippets')}>
                                                    Ver todos os {summary.snippets} trechos
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 text-muted-foreground text-sm">
                                                Nenhum snippet vinculado.
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base">Cronograma</CardTitle>
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="relative pl-4 border-l-2 border-primary/20 space-y-4">
                                                <div className="relative">
                                                    <div className="absolute -left-[1.35rem] h-2.5 w-2.5 rounded-full bg-primary" />
                                                    <p className="text-xs font-semibold">Criação do Projeto</p>
                                                    <p className="text-[10px] text-muted-foreground">Inicializado em 01 Jan 2026</p>
                                                </div>
                                                <div className="relative">
                                                    <div className="absolute -left-[1.35rem] h-2.5 w-2.5 rounded-full bg-muted border-2" />
                                                    <p className="text-xs font-semibold">Primeiro MVP</p>
                                                    <p className="text-[10px] text-muted-foreground">Previsão: Março 2026</p>
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm" className="w-full text-xs">Editar Timeline</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    ) : (
                        <div className="h-[400px] flex flex-col items-center justify-center text-center p-8 bg-card/50 rounded-2xl border border-dashed">
                            <LayoutGrid className="h-12 w-12 text-muted-foreground/30 mb-4" />
                            <h2 className="text-xl font-semibold">Selecione um Projeto</h2>
                            <p className="text-muted-foreground max-w-sm mt-2">
                                Escolha um projeto na barra lateral para visualizar todos os ativos, tarefas e métricas financeiras consolidadas.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
