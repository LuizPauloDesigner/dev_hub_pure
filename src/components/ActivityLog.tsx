import React, { useState, useMemo } from 'react';
import { useApp, ActivityLog as ActivityLogType } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    History,
    Search,
    Filter,
    ShieldAlert,
    Info,
    AlertTriangle,
    User,
    Clock,
    Download,
    RefreshCcw,
    ChevronRight,
    Terminal,
    Database,
    ShieldCheck,
    Calendar,
    ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const ActivityLog = () => {
    const { state } = useApp();
    const logs = state.activityLogs || [];
    const [searchQuery, setSearchQuery] = useState('');
    const [severityFilter, setSeverityFilter] = useState<'all' | 'info' | 'warning' | 'critical'>('all');

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesSearch =
                log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.entityType.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;

            return matchesSearch && matchesSeverity;
        });
    }, [logs, searchQuery, severityFilter]);

    const handleExport = () => {
        toast.promise(new Promise(resolve => setTimeout(resolve, 2000)), {
            loading: 'Gerando relatório de auditoria...',
            success: 'Log exportado com sucesso (AuditLog_2026.csv)',
            error: 'Erro ao exportar logs.'
        });
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <ShieldAlert className="h-4 w-4 text-destructive" />;
            case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'critical': return <Badge className="bg-destructive/10 text-destructive border-destructive/20 uppercase text-[10px] font-black">Crítico</Badge>;
            case 'warning': return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 uppercase text-[10px] font-black">Aviso</Badge>;
            default: return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 uppercase text-[10px] font-black">Info</Badge>;
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-xs">
                        <Terminal className="h-4 w-4" />
                        Security & Compliance
                    </div>
                    <h1 className="text-4xl font-black tracking-tight">Log de Atividades</h1>
                    <p className="text-muted-foreground">Rastreabilidade completa de todas as ações executadas na plataforma.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" className="font-bold gap-2 border-primary/10" onClick={handleExport}>
                        <Download className="h-4 w-4" /> Exportar Logs
                    </Button>
                    <Button variant="outline" size="icon" className="border-primary/10" onClick={() => toast.info('Log atualizado')}>
                        <RefreshCcw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                    { label: 'Eventos Hoje', value: logs.length, icon: Database, color: 'text-primary' },
                    { label: 'Alertas Críticos', value: logs.filter(l => l.severity === 'critical').length, icon: ShieldAlert, color: 'text-destructive' },
                    { label: 'Sessões Ativas', value: '12', icon: User, color: 'text-green-500' },
                ].map((stat, i) => (
                    <Card key={i} className="border-primary/5 bg-card/50 backdrop-blur">
                        <CardHeader className="p-4 flex flex-row items-center justify-between pb-2">
                            <span className="text-xs font-bold uppercase text-muted-foreground">{stat.label}</span>
                            <stat.icon className={cn("h-4 w-4", stat.color)} />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-black">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-card/30 p-4 rounded-3xl border border-primary/5">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    <div className="relative w-full sm:w-80 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Pesquisar por ação, usuário ou detalhe..."
                            className="pl-10 bg-card/50 border-primary/10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-2xl w-full sm:w-auto overflow-x-auto">
                        {(['all', 'info', 'warning', 'critical'] as const).map((sev) => (
                            <Button
                                key={sev}
                                variant={severityFilter === sev ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setSeverityFilter(sev)}
                                className={cn(
                                    "rounded-xl px-4 text-[10px] font-black uppercase tracking-widest",
                                    severityFilter === sev && "bg-background shadow-sm"
                                )}
                            >
                                {sev === 'all' ? 'Todos' : sev}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground px-2">
                    <Calendar className="h-4 w-4" />
                    Período: Últimas 24 Horas
                </div>
            </div>

            {/* Timeline View */}
            <Card className="border-primary/5 bg-card/50 backdrop-blur overflow-hidden shadow-2xl">
                <CardHeader className="bg-muted/30 border-b border-primary/5 py-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <History className="h-4 w-4 text-primary" />
                            Linha do Tempo de Auditoria
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px] border-primary/20">{filteredLogs.length} Registros</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[600px]">
                        {filteredLogs.length > 0 ? (
                            <div className="divide-y divide-primary/5">
                                {filteredLogs.map((log, i) => (
                                    <div key={log.id} className="group p-6 hover:bg-primary/[0.02] transition-colors flex flex-col sm:flex-row items-start gap-4">
                                        <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
                                            <div className={cn(
                                                "h-10 w-10 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
                                                log.severity === 'critical' ? "bg-destructive text-destructive-foreground shadow-destructive/20" :
                                                    log.severity === 'warning' ? "bg-yellow-500 text-white shadow-yellow-500/20" : "bg-primary text-primary-foreground shadow-primary/20"
                                            )}>
                                                {getSeverityIcon(log.severity)}
                                            </div>
                                            <div className="w-0.5 h-full bg-primary/10 mt-1 absolute left-[51px] -z-10 hidden sm:block" />
                                        </div>

                                        <div className="flex-1 space-y-2">
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                <span className="font-black text-foreground">{log.userName}</span>
                                                <ChevronRight className="h-3 w-3 text-muted-foreground opacity-50" />
                                                <span className="font-bold text-primary italic underline decoration-primary/20 underline-offset-4">{log.action}</span>
                                                {getSeverityBadge(log.severity)}
                                            </div>

                                            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                                {log.details}
                                                {log.entityType && (
                                                    <span className="ml-2 px-2 py-0.5 bg-muted rounded-lg text-[10px] font-black uppercase tracking-tighter border border-primary/5">
                                                        {log.entityType}
                                                    </span>
                                                )}
                                            </p>

                                            <div className="flex flex-wrap items-center gap-6 pt-1">
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(log.timestamp).toLocaleString('pt-BR')}
                                                </div>
                                                {log.ipAddress && (
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                                                        <ShieldCheck className="h-3 w-3" />
                                                        IP: {log.ipAddress}
                                                    </div>
                                                )}
                                                <Button variant="link" size="sm" className="h-auto p-0 text-[10px] font-black text-primary uppercase gap-1 hover:no-underline">
                                                    Ver Detalhes JSON <ArrowUpRight className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-32 text-center">
                                <History className="h-16 w-16 text-muted-foreground/10 mb-4" />
                                <h3 className="text-xl font-black opacity-30">Nenhum registro encontrado</h3>
                                <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                                    Não há atividades que correspondam aos seus filtros atuais no histórico de auditoria.
                                </p>
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
                <div className="p-4 bg-primary/5 border-t border-primary/5 flex items-center justify-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                        <ShieldCheck className="h-3 w-3 text-green-500" />
                        Auditoria de Segurança em Conformidade com LGPD/GDPR
                    </p>
                </div>
            </Card>
        </div>
    );
};
