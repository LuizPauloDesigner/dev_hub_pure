import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    Database,
    Activity,
    Shield,
    Search,
    ArrowLeft,
    RefreshCw,
    UserCircle,
    BadgeCheck,
    Trash2,
    Eye,
    Megaphone,
    Hammer,
    BarChart3,
    Key,
    Building
} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AdminUser {
    id: string;
    email: string;
    role: string;
    sub_role: string;
    plan: string;
    organization_id: string | null;
    created_at: string;
    total_entities: number;
    last_activity: string | null;
}

interface AdminStats {
    users: number;
    organizations: { count: number };
    dataPoints: number;
    composition: { type: string, count: number }[];
}

interface AdminOrganization {
    id: string;
    name: string;
    slug: string;
    owner_id: string;
    plan: string;
    total_users: number;
    created_at: string;
}

interface SystemConfig {
    maintenance_mode: string;
    global_broadcast: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Admin = () => {
    const { isAdmin, token } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [config, setConfig] = useState<SystemConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);

    useEffect(() => {
        if (!isAdmin) {
            navigate('/');
            return;
        }
        fetchData();
    }, [isAdmin]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [usersRes, orgsRes, statsRes, configRes] = await Promise.all([
                fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/admin/organizations', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/admin/config', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (usersRes.ok && orgsRes.ok && statsRes.ok && configRes.ok) {
                setUsers(await usersRes.json());
                setOrganizations(await orgsRes.json());
                setStats(await statsRes.json());
                setConfig(await configRes.json());
            }
        } catch (error) {
            toast.error('Erro ao carregar dados administrativos');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateUser = async (id: string, updates: Partial<AdminUser>) => {
        setIsUpdating(id);
        const toastId = toast.loading('Atualizando usuário...');
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });
            if (res.ok) {
                toast.success('Usuário atualizado com sucesso', { id: toastId });
                fetchData();
            }
        } catch (error) {
            toast.error('Erro ao atualizar usuário', { id: toastId });
        } finally {
            setIsUpdating(null);
        }
    };

    const handleUpdateConfig = async (updates: Partial<SystemConfig>) => {
        try {
            const res = await fetch('/api/admin/config', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });
            if (res.ok) {
                toast.success('Configurações atualizadas');
                fetchData();
            }
        } catch (error) {
            toast.error('Erro ao atualizar configurações');
        }
    };

    const handleSendBroadcast = async () => {
        if (!broadcastMsg) return;
        const toastId = toast.loading('Enviando broadcast...');
        try {
            const res = await fetch('/api/admin/broadcast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: broadcastMsg })
            });
            if (res.ok) {
                toast.success('Broadcast enviado com sucesso', { id: toastId });
                setBroadcastMsg('');
                fetchData();
            }
        } catch (error) {
            toast.error('Erro ao enviar broadcast', { id: toastId });
        }
    };

    const handleDeleteUser = async (id: string) => {
        const toastId = toast.loading('Removendo usuário...');
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: 'suspended' })
            });
            if (res.ok) {
                toast.success('Usuário suspenso com sucesso', { id: toastId });
                fetchData();
            }
        } catch (error) {
            toast.error('Erro ao remover usuário', { id: toastId });
        } finally {
            setUserToDelete(null);
        }
    };

    const handleResetPassword = async (id: string) => {
        const toastId = toast.loading('Resetando senha...');
        try {
            const res = await fetch(`/api/admin/users/${id}/reset-password`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                toast.success(data.message, { id: toastId, duration: 5000 });
            }
        } catch (error) {
            toast.error('Erro ao resetar senha', { id: toastId });
        }
    };

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    const chartData = stats?.composition.map(c => ({
        name: c.type.charAt(0).toUpperCase() + c.type.slice(1),
        count: c.count
    })) || [];

    if (!isAdmin) return null;

    return (
        <div className="min-h-screen bg-background text-foreground p-6 md:p-10">
            {/* Header */}
            <div className="max-w-7xl mx-auto space-y-8 pb-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground mb-4">
                            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="px-0 hover:bg-transparent">
                                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao App
                            </Button>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Painel de Controle Elite</h1>
                        <p className="text-muted-foreground">Infraestrutura administrativa e monitoramento SaaS.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={fetchData} disabled={isLoading}>
                            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Sincronizar
                        </Button>
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20">
                            Nerdzao Elite <Shield className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="bg-card/50 backdrop-blur-md border-primary/20 hover:border-primary/40 transition-all border-l-4 border-l-primary">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Usuários B2C</CardTitle>
                            <UserCircle className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.users || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Plataforma global</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/50 backdrop-blur-md border-primary/20 hover:border-primary/40 transition-all border-l-4 border-l-blue-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Organizações B2B</CardTitle>
                            <Building className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.organizations?.count || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Empresas registradas</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/50 backdrop-blur-md border-primary/20 hover:border-primary/40 transition-all border-l-4 border-l-purple-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Entidades Cloud</CardTitle>
                            <Database className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.dataPoints || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Sincronização global ativa</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/50 backdrop-blur-md border-primary/20 hover:border-primary/40 transition-all border-l-4 border-l-emerald-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Server Health</CardTitle>
                            <Activity className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-500">100.0%</div>
                            <p className="text-xs text-muted-foreground mt-1">Status: Operational</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts & System Controls */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Data Composition Chart */}
                    <Card className="lg:col-span-2 bg-card/50 border-primary/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-primary" /> Distribuição de Dados
                            </CardTitle>
                            <CardDescription>Volume de informações sincronizadas por módulo.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* System Settings Side Panel */}
                    <div className="space-y-6">
                        <Card className="bg-card/50 border-primary/10">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Hammer className="w-4 h-4 text-amber-500" /> Modo Manutenção
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="maintenance-mode" className="text-sm font-normal">Ativar bloqueio global</Label>
                                    <Switch
                                        id="maintenance-mode"
                                        checked={config?.maintenance_mode === 'true'}
                                        onCheckedChange={(val) => handleUpdateConfig({ maintenance_mode: String(val) })}
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                    * Apenas administradores poderão realizar alterações enquanto ativo.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-card/50 border-primary/10">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Megaphone className="w-4 h-4 text-primary" /> Broadcast Global
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Input
                                    placeholder="Mensagem para todos..."
                                    value={broadcastMsg}
                                    onChange={(e) => setBroadcastMsg(e.target.value)}
                                    className="h-9"
                                />
                                <Button className="w-full h-9 gap-2" size="sm" onClick={handleSendBroadcast} disabled={!broadcastMsg}>
                                    Enviar Agora <Megaphone className="w-3.5 h-3.5" />
                                </Button>
                                {config?.global_broadcast && (
                                    <div className="p-2 bg-primary/5 border border-primary/10 rounded-md text-[10px]">
                                        <span className="font-bold text-primary">Ativo:</span> {config.global_broadcast}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-4 w-4 ml-2"
                                            onClick={() => handleUpdateConfig({ global_broadcast: '' })}
                                        >
                                            <RefreshCw className="w-2.5 h-2.5" />
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* User Table Section */}
                <Card className="bg-card/50 border-primary/10">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Gestão de Usuários</CardTitle>
                                <CardDescription>Controle de privilégios e planos de assinatura.</CardDescription>
                            </div>
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por e-mail..."
                                    className="pl-9 h-10 w-full"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Mobile View: Cards */}
                            <div className="grid grid-cols-1 gap-4 md:hidden">
                                {filteredUsers.map(u => (
                                    <div key={u.id} className="p-4 rounded-lg border border-primary/10 bg-primary/5 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                                    <UserCircle className="w-4 h-4 text-primary" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-semibold truncate max-w-[150px]">{u.email}</div>
                                                    <div className="text-[10px] text-muted-foreground">
                                                        {u.organization_id ? 'Empresa vinculado' : 'B2C Individual'}
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge variant={u.plan === 'pro' ? 'default' : 'outline'} className="text-[10px]">
                                                {u.plan.toUpperCase()}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-[11px] py-2 border-y border-primary/5">
                                            <div>
                                                <span className="text-muted-foreground">Cargo:</span> {u.sub_role || 'member'}
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Cloud:</span> {u.total_entities} itens
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-muted-foreground">Ativo:</span> {u.last_activity ? new Date(u.last_activity).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2 pt-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-xs"
                                                onClick={() => handleUpdateUser(u.id, { plan: u.plan === 'pro' ? 'free' : 'pro' })}
                                            >
                                                {u.plan === 'pro' ? 'Downgrade' : 'Pro'}
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-500" onClick={() => handleResetPassword(u.id)}>
                                                <Key className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setUserToDelete(u)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop View: Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground uppercase border-b border-primary/10">
                                        <tr>
                                            <th className="px-4 py-3">Usuário / Empresa</th>
                                            <th className="px-4 py-3">Plano / Cargo</th>
                                            <th className="px-4 py-3 text-center">Dados Cloud</th>
                                            <th className="px-4 py-3">Última Atividade</th>
                                            <th className="px-4 py-3 text-right">Ações Elites</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-primary/5">
                                        {filteredUsers.map(u => (
                                            <tr key={u.id} className="hover:bg-primary/5 transition-colors group">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                                            <UserCircle className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold flex items-center gap-1">
                                                                {u.email}
                                                                {u.role === 'admin' && <BadgeCheck className="w-3.5 h-3.5 text-primary" />}
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                {u.organization_id ? (
                                                                    <>
                                                                        <Building className="w-2.5 h-2.5" />
                                                                        {organizations.find(o => o.id === u.organization_id)?.name || 'Empresa vinculada'}
                                                                    </>
                                                                ) : (
                                                                    'Usuário Individual (B2C)'
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Badge variant={u.plan === 'pro' ? 'default' : 'outline'} className={u.plan === 'pro' ? 'bg-primary/20 text-primary hover:bg-primary/30' : ''}>
                                                        {u.plan.toUpperCase()}
                                                    </Badge>
                                                    <div className="text-[10px] text-muted-foreground mt-1 lowercase">
                                                        {u.sub_role || 'member'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-center font-mono text-xs">{u.total_entities}</td>
                                                <td className="px-4 py-4 text-xs text-muted-foreground">
                                                    {u.last_activity ? new Date(u.last_activity).toLocaleDateString() : 'Sem rastro'}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled={isUpdating === u.id || u.role === 'suspended'}
                                                            onClick={() => handleUpdateUser(u.id, { plan: u.plan === 'pro' ? 'free' : 'pro' })}
                                                            className={u.plan === 'pro' ? 'text-amber-500 hover:text-amber-600' : 'text-primary'}
                                                        >
                                                            {u.plan === 'pro' ? 'Downgrade' : 'Tornar Pro'}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-amber-500 hover:bg-amber-500/10"
                                                            onClick={() => handleResetPassword(u.id)}
                                                        >
                                                            <Key className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-muted-foreground hover:text-foreground"
                                                            onClick={() => toast.info(`Acesso restrito para logs de ${u.email}`)}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive hover:bg-destructive/10"
                                                            disabled={u.role === 'admin' || u.role === 'suspended'}
                                                            onClick={() => setUserToDelete(u)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Organization Management Section */}
                <Card className="bg-card/50 border-primary/10 mt-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building className="w-5 h-5 text-blue-500" /> Gestão de Organizações (B2B)
                        </CardTitle>
                        <CardDescription>Administração de contas corporativas e tenants.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Mobile Organizations: Cards */}
                            <div className="grid grid-cols-1 gap-4 md:hidden">
                                {organizations.map(org => (
                                    <div key={org.id} className="p-4 rounded-lg border border-blue-500/10 bg-blue-500/5 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-semibold text-blue-400">{org.name}</div>
                                                <div className="text-[10px] text-muted-foreground">Slug: /{org.slug}</div>
                                            </div>
                                            <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">
                                                {org.plan.replace('_', ' ').toUpperCase()}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-muted-foreground">Membros: <span className="text-foreground font-bold">{org.total_users}</span></span>
                                            <Button variant="ghost" size="sm" className="h-8 text-blue-400">
                                                <Eye className="w-4 h-4 mr-1" /> Detalhes
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Organizations: Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground uppercase border-b border-primary/10">
                                        <tr>
                                            <th className="px-4 py-3">Empresa</th>
                                            <th className="px-4 py-3">Slug / URL</th>
                                            <th className="px-4 py-3">Plano</th>
                                            <th className="px-4 py-3 text-center">Membros</th>
                                            <th className="px-4 py-3 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-primary/5">
                                        {organizations.map(org => (
                                            <tr key={org.id} className="hover:bg-blue-500/5 transition-colors group">
                                                <td className="px-4 py-4">
                                                    <div className="font-semibold">{org.name}</div>
                                                    <div className="text-[10px] text-muted-foreground">ID: {org.id.slice(0, 8)}</div>
                                                </td>
                                                <td className="px-4 py-4 font-mono text-xs">
                                                    /{org.slug}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                                                        {org.plan.replace('_', ' ').toUpperCase()}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-4 text-center font-bold">
                                                    {org.total_users}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <AlertDialogContent className="bg-card border-destructive/20">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Suspender Usuário?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Isso irá revogar o acesso de <strong>{userToDelete?.email}</strong> instantaneamente.
                            O usuário não poderá mais sincronizar dados com o servidor.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-muted border-none">Manter Ativo</AlertDialogCancel>
                        <AlertDialogAction onClick={() => userToDelete && handleDeleteUser(userToDelete.id)} className="bg-red-600 text-white hover:bg-red-700">
                            Confirmar Suspensão
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Admin;
