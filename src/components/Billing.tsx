import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    CheckCircle2,
    Zap,
    Shield,
    HelpCircle,
    History,
    CreditCard,
    Loader2,
    Calendar,
    DollarSign,
    Plus,
    ArrowUpRight,
    Download,
    ExternalLink,
    AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";

const PLANS = [
    {
        id: 'free',
        name: 'Plano Básico',
        price: 'R$ 0/mês',
        description: 'Ideal para devs que estão começando.',
        features: [
            'Até 5 projetos ativos',
            'Sincronização em 1 dispositivo',
            'Notas e Snippets ilimitados',
        ],
        buttonText: 'Explorar'
    },
    {
        id: 'pro',
        name: 'Plano Pro',
        price: 'R$ 29,90/mês',
        description: 'Otimize seu workflow com recursos avançados.',
        features: [
            'Projetos ilimitados',
            'Sincronização em tempo real',
            'Dashboard analítico',
            'Selo de verificação Pro',
        ],
        buttonText: 'Assinar Agora'
    },
    {
        id: 'team',
        name: 'Plano Business',
        price: 'R$ 99,90/mês',
        description: 'Perfeito para equipes e agências.',
        features: [
            'Tudo do Plano Pro',
            'Gestão de Organizações',
            'Colaboradores ilimitados',
            'Identidade Visual (White-Label)',
        ],
        buttonText: 'Fale Conosco'
    }
];

const MOCK_INVOICES = [
    { id: 'INV-001', date: '2024-03-01', amount: 'R$ 29,90', status: 'Pago' },
    { id: 'INV-002', date: '2024-02-01', amount: 'R$ 29,90', status: 'Pago' },
    { id: 'INV-003', date: '2024-01-01', amount: 'R$ 29,90', status: 'Pago' },
];

export const Billing = () => {
    const { user, updatePlan } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdatePlan = async (planId: any) => {
        if (planId === user?.plan) {
            toast.info('Você já está neste plano!');
            return;
        }

        setIsLoading(true);
        try {
            // Artificial delay for "premium" feel
            await new Promise(r => setTimeout(r, 1500));
            await updatePlan(planId);
            toast.success(`Parabéns! Você migrou para o ${planId.toUpperCase()}.`);
        } catch (error) {
            toast.error('Ocorreu um erro ao processar sua assinatura.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Faturamento</h1>
                    <p className="text-muted-foreground">
                        Gerencie sua assinatura, visualize faturas e atualize formas de pagamento.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                        <HelpCircle className="h-4 w-4" />
                        Suporte
                    </Button>
                    <Button size="sm" className="gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Portal do Cliente
                    </Button>
                </div>
            </div>

            {/* Current Subscription Status */}
            <Card className="bg-primary/5 border-primary/20 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                    <Zap className="h-24 w-24 text-primary" />
                </div>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                            {user?.plan?.toUpperCase()}
                        </Badge>
                        <CardTitle>Sua Assinatura</CardTitle>
                    </div>
                    <CardDescription>
                        Você está no plano {user?.plan} desde Janeiro de 2024.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase">Status</p>
                            <p className="text-sm font-semibold flex items-center gap-1.5 text-green-500">
                                <CheckCircle2 className="h-4 w-4" />
                                Ativo (Renovação Automática)
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase">Próxima Cobrança</p>
                            <p className="text-sm font-semibold flex items-center gap-1.5">
                                <Calendar className="h-4 w-4 text-primary" />
                                01 de Abril, 2024
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase">Valor Anual Estimado</p>
                            <p className="text-sm font-semibold flex items-center gap-1.5">
                                <DollarSign className="h-4 w-4 text-primary" />
                                R$ 358,80
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Plan Selection */}
            <div className="grid gap-6 md:grid-cols-3 pt-4">
                {PLANS.map((plan) => (
                    <Card key={plan.id} className={`relative flex flex-col transition-all duration-300 hover:shadow-xl ${plan.id === user?.plan ? 'border-primary shadow-lg ring-1 ring-primary/20 scale-[1.02] bg-card' : 'bg-card/50 opacity-90 hover:opacity-100'}`}>
                        {plan.id === user?.plan && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                                <Badge className="px-4 py-1 shadow-md bg-primary text-primary-foreground border-none">
                                    Seu Plano Atual
                                </Badge>
                            </div>
                        )}
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                            <div className="flex items-baseline gap-1 pt-2">
                                <span className={`text-3xl font-extrabold ${plan.id === user?.plan ? 'text-primary' : ''}`}>
                                    {plan.price.split('/')[0]}
                                </span>
                                <span className="text-sm text-muted-foreground">/mês</span>
                            </div>
                            <CardDescription className="pt-2">{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-4">
                            <ul className="space-y-3">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                        <span className="leading-tight">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter className="pt-6">
                            <Button
                                className="w-full font-bold transition-all duration-300"
                                variant={plan.id === user?.plan ? 'outline' : 'default'}
                                onClick={() => handleUpdatePlan(plan.id)}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    plan.id === user?.plan ? 'Personalizar' : plan.buttonText
                                )}
                                {!isLoading && plan.id !== user?.plan && <ArrowUpRight className="ml-2 h-4 w-4" />}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <div className="grid gap-8 md:grid-cols-3 pt-6">
                {/* Invoice Table */}
                <Card className="md:col-span-2 border-none shadow-sm bg-card/50 backdrop-blur">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <History className="h-5 w-5 text-primary" />
                                Histórico de Faturamento
                            </CardTitle>
                            <CardDescription>Visualize e baixe seus recibos anteriores.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {MOCK_INVOICES.length > 0 ? (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px]">ID</TableHead>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Valor</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Ação</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {MOCK_INVOICES.map((invoice) => (
                                            <TableRow key={invoice.id}>
                                                <TableCell className="font-medium text-xs">{invoice.id}</TableCell>
                                                <TableCell className="text-xs">{new Date(invoice.date).toLocaleDateString('pt-BR')}</TableCell>
                                                <TableCell className="text-xs font-semibold">{invoice.amount}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] bg-green-500/5 text-green-500 border-green-500/20 px-2 py-0">
                                                        {invoice.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                                        <Download className="h-3 w-3" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 rounded-xl border border-dashed border-primary/20">
                                <AlertCircle className="h-8 w-8 text-muted-foreground/30 mb-2" />
                                <p className="text-sm font-medium text-muted-foreground">Nenhuma fatura disponível ainda.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right Side Cards */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm bg-card/50 backdrop-blur">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-primary" />
                                <CardTitle className="text-lg">Pagamento</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-muted/30 rounded-xl border border-primary/10 relative group">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-12 bg-white rounded-md flex items-center justify-center p-1 shadow-sm shrink-0">
                                            <img src="https://img.icons8.com/color/48/000000/visa.png" alt="Visa" className="h-full object-contain" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold opacity-90">Visa **** 4242</p>
                                            <p className="text-[10px] text-muted-foreground">Expira em 12/28</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-[9px] uppercase tracking-tighter scale-90">Padrão</Badge>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1">Editar</Button>
                                    <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1">Remover</Button>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full text-xs h-9 border-dashed hover:border-primary/50 hover:bg-primary/5 transition-all">
                                <Plus className="mr-2 h-3 w-3" />
                                Adicionar Novo Cartão
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-orange-500/5 border-orange-500/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase text-orange-600 flex items-center gap-1.5">
                                <Shield className="h-3 w-3" />
                                Precisa de ajuda?
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Tem dúvidas sobre cobranças? Nosso time financeiro está disponível 24h para ajudar você com qualquer questão de estorno ou nota fiscal.
                            </p>
                            <Button variant="link" className="p-0 h-auto text-[10px] text-orange-600 font-bold mt-2">
                                Acessar Central de Ajuda
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Footer Trust Section */}
            <div className="flex justify-center flex-wrap gap-x-12 gap-y-6 pt-12 opacity-50 border-t">
                <div className="flex items-center gap-2.5 text-xs grayscale hover:grayscale-0 transition-all cursor-default">
                    <Zap className="h-5 w-5 text-primary" />
                    <span className="font-medium">Ativação em Segundos</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs grayscale hover:grayscale-0 transition-all cursor-default">
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="font-medium">Segurança PCI DSS Nível 1</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs grayscale hover:grayscale-0 transition-all cursor-default">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span className="font-medium">Satisfação Garantida</span>
                </div>
            </div>
        </div>
    );
};

