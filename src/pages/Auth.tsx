import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Lock, Mail, UserPlus, LogIn, Github, KeyRound, ArrowRight, ShieldCheck, Building, User } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const Auth = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [regType, setRegType] = useState<'individual' | 'company'>('individual');
    const [companyName, setCompanyName] = useState('');
    const [companySlug, setCompanySlug] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [inviteToken, setInviteToken] = useState(searchParams.get('invite') || '');
    const [invitationInfo, setInvitationInfo] = useState<{ org_name: string, role: string } | null>(null);

    useEffect(() => {
        if (inviteToken) {
            validateInvite(inviteToken);
        }
    }, [inviteToken]);

    const validateInvite = async (token: string) => {
        try {
            const res = await fetch(`/api/auth/invitation/${token}`);
            if (res.ok) {
                const data = await res.json();
                setInvitationInfo({ org_name: data.org_name, role: data.role });
                setEmail(data.email);
            } else {
                toast.error('Convite inválido ou expirado');
                setInviteToken('');
            }
        } catch (error) {
            console.error('Invite validation failed');
        }
    };

    // Forgot Password State
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
    const [resetStep, setResetStep] = useState(1);
    const [resetEmail, setResetEmail] = useState('');
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const handleForgotPassword = async () => {
        if (!resetEmail) return toast.error('Digite seu e-mail');
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                setResetStep(2);
                // In dev, we can auto-fill the token if returned
                if (data.dev_token) {
                    console.log('Dev Reset Token:', data.dev_token);
                    setResetCode(data.dev_token);
                }
            } else {
                throw new Error(data.error);
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!resetCode || !newPassword) return toast.error('Preencha todos os campos');
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail, token: resetCode, newPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                setIsForgotModalOpen(false);
                setResetStep(1);
            } else {
                throw new Error(data.error);
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAuth = async (type: 'login' | 'register') => {
        setIsLoading(true);
        try {
            const payload = type === 'login'
                ? { email, password }
                : { email, password, type: regType, companyName, companySlug, inviteToken };

            const response = await fetch(`/api/auth/${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro na autenticação');
            }

            login(data.token, data.user);
            toast.success(type === 'login' ? 'Bem-vindo de volta!' : 'Conta criada com sucesso!');
            navigate('/');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[25%] -left-[25%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute -bottom-[25%] -right-[25%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
            </div>

            <Card className="w-full max-w-md border-primary/10 shadow-2xl backdrop-blur-sm bg-background/80">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-primary/10 rounded-2xl ring-1 ring-primary/20">
                            <Lock className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight">Pure Dev Dashboard</CardTitle>
                    <CardDescription>
                        Sua central de produtividade personalizada
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue={inviteToken ? "register" : "login"} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-8">
                            <TabsTrigger value="login" disabled={!!inviteToken}>Login</TabsTrigger>
                            <TabsTrigger value="register">Registro</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login" className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        placeholder="dev@exemplo.com"
                                        className="pl-10"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Senha</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        className="pl-10"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setIsForgotModalOpen(true)}
                                        className="text-xs text-primary hover:underline font-medium"
                                    >
                                        Esqueci minha senha
                                    </button>
                                </div>
                            </div>
                            <Button
                                className="w-full mt-4"
                                onClick={() => handleAuth('login')}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Carregando...' : <><LogIn className="mr-2 h-4 w-4" /> Entrar</>}
                            </Button>
                        </TabsContent>

                        <TabsContent value="register" className="space-y-4">
                            {invitationInfo ? (
                                <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl mb-6 flex items-start gap-3">
                                    <Building className="w-5 h-5 text-primary mt-1" />
                                    <div>
                                        <div className="text-sm font-bold">Você foi convidado!</div>
                                        <div className="text-xs text-muted-foreground">
                                            Juntando-se a <strong>{invitationInfo.org_name}</strong> como <strong>{invitationInfo.role}</strong>.
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Type Selector */
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <button
                                        type="button"
                                        onClick={() => setRegType('individual')}
                                        className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${regType === 'individual' ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-primary/10 hover:border-primary/30'}`}
                                    >
                                        <User className={`w-5 h-5 ${regType === 'individual' ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <span className={`text-xs font-semibold ${regType === 'individual' ? 'text-primary' : 'text-muted-foreground'}`}>Individual</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRegType('company')}
                                        className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${regType === 'company' ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-primary/10 hover:border-primary/30'}`}
                                    >
                                        <Building className={`w-5 h-5 ${regType === 'company' ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <span className={`text-xs font-semibold ${regType === 'company' ? 'text-primary' : 'text-muted-foreground'}`}>Empresa</span>
                                    </button>
                                </div>
                            )}

                            {!invitationInfo && regType === 'company' && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="company-name">Nome da Empresa</Label>
                                        <Input
                                            id="company-name"
                                            placeholder="Ex: Nerdzao Elite Corp"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="company-slug">Slug / URL (apenas letras, números e hífens)</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-mono">/</span>
                                            <Input
                                                id="company-slug"
                                                placeholder="nerdzao-elite"
                                                className="pl-6 font-mono text-xs"
                                                value={companySlug}
                                                onChange={(e) => setCompanySlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="reg-email">{regType === 'company' ? 'Email do Admin' : 'Email'}</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="reg-email"
                                        placeholder="dev@exemplo.com"
                                        className="pl-10"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={!!invitationInfo}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reg-password">Senha</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="reg-password"
                                        type="password"
                                        className="pl-10"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button
                                className="w-full mt-4"
                                variant="outline"
                                onClick={() => handleAuth('register')}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Criando conta...' : <><UserPlus className="mr-2 h-4 w-4" /> {regType === 'company' ? 'Registrar Empresa' : 'Criar Conta'}</>}
                            </Button>
                        </TabsContent>
                    </Tabs>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 border-t pt-6">
                    <div className="relative w-full">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Ou continue com</span>
                        </div>
                    </div>
                    <Button variant="ghost" className="w-full" disabled>
                        <Github className="mr-2 h-4 w-4" /> GitHub (Em breve)
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                        Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade.
                    </p>
                </CardFooter>
            </Card>

            {/* Forgot Password Modal */}
            <Dialog open={isForgotModalOpen} onOpenChange={(open) => {
                setIsForgotModalOpen(open);
                if (!open) setResetStep(1);
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <KeyRound className="w-5 h-5 text-primary" />
                            Recuperar Senha
                        </DialogTitle>
                        <DialogDescription>
                            {resetStep === 1
                                ? "Digite seu e-mail para receber um código de recuperação."
                                : "Digite o código enviado e sua nova senha."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {resetStep === 1 ? (
                            <div className="space-y-2">
                                <Label htmlFor="reset-email">Seu e-mail cadastrado</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="reset-email"
                                        placeholder="dev@exemplo.com"
                                        className="pl-10"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="reset-code">Código de 6 dígitos</Label>
                                    <div className="relative">
                                        <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="reset-code"
                                            placeholder="123456"
                                            className="pl-10"
                                            maxLength={6}
                                            value={resetCode}
                                            onChange={(e) => setResetCode(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">Nova Senha</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="new-password"
                                            type="password"
                                            className="pl-10"
                                            placeholder="••••••••"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            className="w-full"
                            onClick={resetStep === 1 ? handleForgotPassword : handleResetPassword}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Aguarde...' : (
                                resetStep === 1
                                    ? <><ArrowRight className="mr-2 h-4 w-4" /> Enviar Código</>
                                    : <><KeyRound className="mr-2 h-4 w-4" /> Alterar Senha</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Auth;
