import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Github,
    Slack,
    MessageSquare,
    Calendar,
    Zap,
    Settings2,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
    RotateCcw,
    Plug,
    CloudIcon,
    Cpu,
    MessagesSquare,
    Search,
    Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const PROVIDER_ICONS: Record<string, any> = {
    Github: Github,
    Slack: Slack,
    MessageSquare: MessageSquare,
    Calendar: Calendar,
    Zap: Zap,
};

export const Integrations = () => {
    const { state, toggleIntegration } = useApp();
    const [searchQuery, setSearchQuery] = useState('');
    const [connectingId, setConnectingId] = useState<string | null>(null);

    const integrations = state.integrations || [];
    const filteredIntegrations = integrations.filter(i =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleToggle = async (id: string, name: string, currentStatus: string) => {
        setConnectingId(id);

        // Simular um processo de conexão "Premium"
        await new Promise(resolve => setTimeout(resolve, 1500));

        toggleIntegration(id);
        setConnectingId(null);

        if (currentStatus === 'disconnected') {
            toast.success(`${name} conectado com sucesso!`);
        } else {
            toast.info(`${name} desconectado.`);
        }
    };

    const categories = [
        { id: 'all', label: 'Todos', icon: Plug },
        { id: 'dev', label: 'Desenvolvimento', icon: Cpu },
        { id: 'comm', label: 'Comunicação', icon: MessagesSquare },
        { id: 'productivity', label: 'Produtividade', icon: Calendar },
        { id: 'ai', label: 'Inteligência Artificial', icon: Zap },
    ];

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-xs">
                        <CloudIcon className="h-4 w-4" />
                        Marketplace
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Central de Integrações</h1>
                    <p className="text-muted-foreground">
                        Conecte suas ferramentas favoritas para automatizar seu workflow e centralizar seus dados.
                    </p>
                </div>
                <div className="relative w-full md:w-72 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Buscar integrações..."
                        className="pl-9 bg-card/50 border-primary/10 focus-visible:ring-primary/20"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <div className="flex items-center justify-between gap-4 mb-6">
                    <TabsList className="bg-muted/30 p-1">
                        {categories.map(cat => (
                            <TabsTrigger key={cat.id} value={cat.id} className="gap-2 px-4">
                                <cat.icon className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">{cat.label}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                {categories.map(cat => (
                    <TabsContent key={cat.id} value={cat.id} className="mt-0 outline-none">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredIntegrations
                                .filter(i => cat.id === 'all' || i.category === cat.id)
                                .map((integration) => {
                                    const Icon = PROVIDER_ICONS[integration.icon] || Plug;
                                    const isConnected = integration.status === 'connected';
                                    const isConnecting = connectingId === integration.id;

                                    return (
                                        <Card key={integration.id} className={cn(
                                            "group relative flex flex-col transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 border-primary/5 bg-card/50 backdrop-blur overflow-hidden",
                                            isConnected && "border-primary/20 bg-primary/5"
                                        )}>
                                            {isConnected && (
                                                <div className="absolute top-0 right-0 p-3">
                                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                                </div>
                                            )}

                                            <CardHeader className="pb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                                                        isConnected ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                                                    )}>
                                                        <Icon className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                                                        <Badge variant="outline" className="text-[10px] font-medium uppercase tracking-tighter h-5 px-1.5 mt-1 border-primary/10">
                                                            {integration.category}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <CardDescription className="pt-4 line-clamp-2 h-14">
                                                    {integration.description}
                                                </CardDescription>
                                            </CardHeader>

                                            <CardContent className="flex-1">
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-muted-foreground">Status</span>
                                                        <span className={cn(
                                                            "font-bold uppercase tracking-widest text-[10px]",
                                                            isConnected ? "text-green-500" : "text-muted-foreground"
                                                        )}>
                                                            {isConnected ? 'Conectado' : 'Disponível'}
                                                        </span>
                                                    </div>
                                                    {isConnected && integration.lastSync && (
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-muted-foreground">Última Sincro</span>
                                                            <span className="font-medium">
                                                                {new Date(integration.lastSync).toLocaleDateString('pt-BR')}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>

                                            <CardFooter className="pt-4 gap-2 border-t border-primary/5 bg-primary/[0.02]">
                                                {isConnected ? (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex-1 h-9 font-bold hover:bg-destructive hover:text-destructive-foreground transition-all duration-300"
                                                            onClick={() => handleToggle(integration.id, integration.name, integration.status)}
                                                            disabled={isConnecting}
                                                        >
                                                            {isConnecting ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : 'Desconectar'}
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary">
                                                            <Settings2 className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Button
                                                        className="w-full h-9 font-extrabold group/btn relative overflow-hidden transition-all duration-500"
                                                        onClick={() => handleToggle(integration.id, integration.name, integration.status)}
                                                        disabled={isConnecting}
                                                    >
                                                        {isConnecting ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                Conectar {integration.name}
                                                                <ExternalLink className="ml-2 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                            </CardFooter>
                                        </Card>
                                    );
                                })}
                        </div>

                        {filteredIntegrations.filter(i => cat.id === 'all' || i.category === cat.id).length === 0 && (
                            <div className="flex flex-col items-center justify-center py-24 text-center bg-card/30 rounded-3xl border border-dashed border-primary/10">
                                <Search className="h-12 w-12 text-muted-foreground/20 mb-4" />
                                <h3 className="text-lg font-bold">Nenhuma integração encontrada</h3>
                                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                                    Não encontramos nenhuma integração para "{searchQuery}" nesta categoria.
                                </p>
                                <Button
                                    variant="link"
                                    className="mt-4 text-primary font-bold"
                                    onClick={() => { setSearchQuery(''); }}
                                >
                                    Limpar Filtros
                                </Button>
                            </div>
                        )}
                    </TabsContent>
                ))}
            </Tabs>

            {/* Coming Soon Section */}
            <div className="pt-12 border-t border-primary/5">
                <div className="bg-primary/5 rounded-3xl p-8 md:p-12 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 blur-2xl group-hover:opacity-20 transition-opacity">
                        <Zap className="h-64 w-64 text-primary" />
                    </div>
                    <div className="relative z-10 max-w-2xl space-y-4">
                        <Badge className="bg-primary text-primary-foreground border-none px-3 py-1">Em Breve</Badge>
                        <h2 className="text-2xl md:text-3xl font-bold">Solicite uma Integração</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Não encontrou a ferramenta que você usa? Nossa equipe está constantemente adicionando novas integrações.
                            Vote nas próximas ou sugira uma nova API para priorizarmos no desenvolvimento.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-4">
                            <Button className="font-bold">Sugerir Integração</Button>
                            <Button variant="outline" className="font-bold">Ver Roadmap</Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-12 text-center border-t border-primary/5 opacity-60">
                <div className="space-y-2">
                    <div className="mx-auto h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-bold text-sm">OAuth 2.0 Seguro</h4>
                    <p className="text-xs text-muted-foreground">Suas credenciais nunca são armazenadas em texto plano.</p>
                </div>
                <div className="space-y-2">
                    <div className="mx-auto h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <RotateCcw className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-bold text-sm">Sincronização Ativa</h4>
                    <p className="text-xs text-muted-foreground">Dados atualizados periodicamente ou via webhooks.</p>
                </div>
                <div className="space-y-2">
                    <div className="mx-auto h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-bold text-sm">Controle de Privacidade</h4>
                    <p className="text-xs text-muted-foreground">Você escolhe exatamente quais permissões cada app terá.</p>
                </div>
            </div>
        </div>
    );
};

// Helper function for class names
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
