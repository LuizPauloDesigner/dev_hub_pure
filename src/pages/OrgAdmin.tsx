import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    UserPlus,
    Building,
    ArrowLeft,
    Mail,
    Trash2,
    Shield,
    RefreshCw,
    Copy,
    CheckCircle2,
    Database,
    Clock,
    Palette,
    Layout,
    Image as ImageIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth, Branding } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface OrgMember {
    id: string;
    email: string;
    sub_role: string;
    created_at: string;
}

interface Invitation {
    id: string;
    email: string;
    role: string;
    status: string;
    expires_at: string;
    token: string;
}

interface OrgStats {
    members: number;
    pendingInvites: number;
    sharedAssets: number;
}

const OrgAdmin = () => {
    const { user, token, isOrgAdmin, branding: globalBranding, refreshBranding } = useAuth();
    const navigate = useNavigate();

    // Member & Stats State
    const [members, setMembers] = useState<OrgMember[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [stats, setStats] = useState<OrgStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Form state for invitations
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'employee' | 'manager'>('employee');

    // State for branding
    const [brandingForm, setBrandingForm] = useState<Branding>({
        name: '',
        logo_url: '',
        primary_color: '355 78% 56%',
        accent_color: '355 78% 56%'
    });

    useEffect(() => {
        if (!isOrgAdmin) {
            navigate('/');
            return;
        }
        fetchData();
        if (globalBranding) {
            setBrandingForm(globalBranding);
        }
    }, [isOrgAdmin, globalBranding]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const [membersRes, invitesRes, statsRes, brandingRes] = await Promise.all([
                fetch('/api/org/members', { headers }),
                fetch('/api/org/invitations', { headers }),
                fetch('/api/org/stats', { headers }),
                fetch('/api/org/branding', { headers })
            ]);

            if (membersRes.ok && invitesRes.ok && statsRes.ok) {
                setMembers(await membersRes.json());
                setInvitations(await invitesRes.json());
                setStats(await statsRes.json());
            }
            if (brandingRes.ok) {
                const bData = await brandingRes.json();
                setBrandingForm(bData);
            }
        } catch (error) {
            toast.error('Erro ao carregar dados da empresa');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateBranding = async (e: React.FormEvent) => {
        e.preventDefault();
        const toastId = toast.loading('Salvando alterações...');
        try {
            const res = await fetch('/api/org/branding', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(brandingForm)
            });

            if (res.ok) {
                toast.success('Branding corporativo atualizado!', { id: toastId });
                refreshBranding();
            } else {
                toast.error('Erro ao atualizar branding', { id: toastId });
            }
        } catch (error) {
            toast.error('Erro na conexão', { id: toastId });
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;

        try {
            const res = await fetch('/api/org/invitations', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: inviteEmail, role: inviteRole })
            });

            if (res.ok) {
                toast.success('Convite enviado com sucesso!');
                setInviteEmail('');
                fetchData();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Erro ao enviar convite');
            }
        } catch (error) {
            toast.error('Erro na conexão');
        }
    };

    const copyInviteLink = (inviteToken: string) => {
        const link = `${window.location.origin}/#/auth?invite=${inviteToken}`;
        navigator.clipboard.writeText(link);
        toast.success('Link de convite copiado!');
    };

    const revokeInvitation = async (id: string) => {
        try {
            const res = await fetch(`/api/org/invitations/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Convite revogado');
                fetchData();
            }
        } catch (error) {
            toast.error('Erro ao revogar convite');
        }
    };

    if (!isOrgAdmin) return null;

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-10">
            <div className="max-w-7xl mx-auto space-y-8 pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="px-0 hover:bg-transparent text-muted-foreground mb-2">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao App
                        </Button>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
                            {brandingForm.logo_url ? (
                                <img src={brandingForm.logo_url} alt="Logo" className="w-10 h-10 object-contain" />
                            ) : (
                                <Building className="w-8 h-8 text-primary" />
                            )}
                            {brandingForm.name || 'Painel Corporativo'}
                        </h1>
                        <p className="text-sm text-muted-foreground font-medium">Gerencie sua identidade visual e equipe.</p>
                    </div>
                    <Button onClick={fetchData} disabled={isLoading} variant="outline" className="w-fit font-bold">
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Sincronizar
                    </Button>
                </div>

                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="bg-muted/50 p-1 border h-10">
                        <TabsTrigger value="overview" className="gap-2 text-xs md:text-sm">
                            <Layout className="w-4 h-4" /> Visão Geral
                        </TabsTrigger>
                        <TabsTrigger value="branding" className="gap-2 text-xs md:text-sm">
                            <Palette className="w-4 h-4" /> Branding & Estilo
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        {/* Quick Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                            <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-xl overflow-hidden group">
                                <div className="h-1 w-full bg-primary/20 group-hover:bg-primary transition-colors" />
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Membros Ativos</CardTitle>
                                    <Users className="h-4 w-4 text-primary" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-black">{stats?.members || 0}</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-xl overflow-hidden group">
                                <div className="h-1 w-full bg-amber-500/20 group-hover:bg-amber-500 transition-colors" />
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Convites Pendentes</CardTitle>
                                    <Mail className="h-4 w-4 text-amber-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-black">{stats?.pendingInvites || 0}</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-xl overflow-hidden group">
                                <div className="h-1 w-full bg-emerald-500/20 group-hover:bg-emerald-500 transition-colors" />
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assets Compartilhados</CardTitle>
                                    <Database className="h-4 w-4 text-emerald-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-black">{stats?.sharedAssets || 0}</div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                            <Card className="lg:col-span-2 bg-card/50 border-primary/10 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Shield className="w-5 h-5 text-primary" /> Equipe do Workspace
                                    </CardTitle>
                                    <CardDescription>Gerencie quem tem acesso aos recursos da sua empresa.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {members.map((member) => (
                                            <div key={member.id} className="flex items-center justify-between p-3 rounded-xl border border-primary/5 bg-primary/5 hover:bg-primary/10 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                                        {member.email[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold truncate max-w-[180px] md:max-w-xs">{member.email}</div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] text-muted-foreground uppercase font-black">{member.sub_role || 'employee'}</span>
                                                            <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                                            <span className="text-[10px] text-muted-foreground italic">Desde {new Date(member.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="text-[9px] font-bold">Ativo</Badge>
                                                    {user?.id !== member.id && (
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-6">
                                <Card className="bg-card/50 border-primary/10 shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2 font-bold">
                                            <UserPlus className="w-4 h-4 text-primary" /> Convidar Membro
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handleInvite} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="invite-email" className="text-[10px] uppercase font-bold text-muted-foreground ml-1">E-mail do Colaborador</Label>
                                                <Input
                                                    id="invite-email"
                                                    placeholder="exemplo@empresa.com"
                                                    value={inviteEmail}
                                                    onChange={(e) => setInviteEmail(e.target.value)}
                                                    className="h-10 border-primary/20 focus-visible:ring-primary"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Permissão</Label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Button
                                                        type="button"
                                                        variant={inviteRole === 'employee' ? 'default' : 'outline'}
                                                        className="h-9 text-xs font-bold"
                                                        onClick={() => setInviteRole('employee')}
                                                    >
                                                        Funcionário
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant={inviteRole === 'manager' ? 'default' : 'outline'}
                                                        className="h-9 text-xs font-bold"
                                                        onClick={() => setInviteRole('manager')}
                                                    >
                                                        Gerente
                                                    </Button>
                                                </div>
                                            </div>
                                            <Button type="submit" className="w-full h-10 font-bold" disabled={!inviteEmail || isLoading}>
                                                Enviar Convite
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>

                                {invitations.length > 0 && (
                                    <Card className="bg-card/50 border-primary/10 shadow-lg">
                                        <CardHeader>
                                            <CardTitle className="text-xs font-black uppercase flex items-center gap-2 text-muted-foreground">
                                                <Clock className="w-4 h-4 text-amber-500" /> Aguardando Aceite
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3 p-4">
                                            {invitations.map((invite) => (
                                                <div key={invite.id} className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[11px] font-bold truncate max-w-[150px]">{invite.email}</span>
                                                        <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-500 font-black uppercase">{invite.role}</Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            className="flex-1 h-8 text-[10px] gap-2 font-bold"
                                                            onClick={() => copyInviteLink(invite.token)}
                                                        >
                                                            <Copy className="w-3 h-3" /> Copiar Link
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                            onClick={() => revokeInvitation(invite.id)}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="branding" className="animate-in slide-in-from-right-4 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <Card className="bg-card/50 border-primary/10 shadow-xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Palette className="w-5 h-5 text-primary" /> Identidade Visual
                                    </CardTitle>
                                    <CardDescription>Personalize as cores e logo do Workspace para sua equipe.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleUpdateBranding} className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Nome da Empresa</Label>
                                            <Input
                                                value={brandingForm.name}
                                                onChange={(e) => setBrandingForm({ ...brandingForm, name: e.target.value })}
                                                placeholder="Sua Empresa Ltda"
                                                className="h-11 border-primary/20"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">URL do Logo</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={brandingForm.logo_url}
                                                    onChange={(e) => setBrandingForm({ ...brandingForm, logo_url: e.target.value })}
                                                    placeholder="https://sua-empresa.com/logo.png"
                                                    className="h-11 border-primary/20"
                                                />
                                                <div className="w-11 h-11 rounded-md border flex items-center justify-center bg-muted/30 shrink-0 overflow-hidden">
                                                    {brandingForm.logo_url ? (
                                                        <img src={brandingForm.logo_url} alt="Preview" className="w-full h-full object-contain p-1" />
                                                    ) : (
                                                        <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Cor Primária (HSL)</Label>
                                            <div className="flex gap-4 items-center">
                                                <Input
                                                    value={brandingForm.primary_color}
                                                    onChange={(e) => setBrandingForm({ ...brandingForm, primary_color: e.target.value })}
                                                    placeholder="355 78% 56%"
                                                    className="h-11 border-primary/20 font-mono text-xs"
                                                />
                                                <div
                                                    className="w-14 h-11 rounded-md border shadow-inner shrink-0"
                                                    style={{ backgroundColor: `hsl(${brandingForm.primary_color})` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground italic px-1">Exemplo: 220 70% 50% (Azul), 142 70% 45% (Verde)</p>
                                        </div>

                                        <Button type="submit" className="w-full h-12 font-bold text-base shadow-lg shadow-primary/20">
                                            <CheckCircle2 className="w-5 h-5 mr-2" /> Salvar Alterações Corporativas
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            <div className="space-y-6">
                                <Card className="bg-card/30 border-dashed border-primary/20 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                                    <CardHeader>
                                        <CardTitle className="text-sm font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                                            <Layout className="w-4 h-4" /> Prévia ao Vivo
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-8 flex flex-col items-center justify-center min-h-[300px] space-y-6 text-center">
                                        <div className="p-4 rounded-2xl bg-background border shadow-2xl scale-125 transition-all">
                                            <div className="flex items-center gap-3 mb-4 border-b pb-2">
                                                {brandingForm.logo_url ? (
                                                    <img src={brandingForm.logo_url} alt="Logo" className="w-6 h-6 object-contain" />
                                                ) : (
                                                    <Building className="w-6 h-6" style={{ color: `hsl(${brandingForm.primary_color})` }} />
                                                )}
                                                <span className="font-bold text-sm tracking-tight">{brandingForm.name || 'Sua Marca'}</span>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="h-2 w-32 rounded-full bg-muted" />
                                                <div className="h-2 w-24 rounded-full bg-muted" />
                                                <div
                                                    className="h-7 w-full rounded-md mt-4 transition-colors"
                                                    style={{ backgroundColor: `hsl(${brandingForm.primary_color})` }}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default OrgAdmin;
