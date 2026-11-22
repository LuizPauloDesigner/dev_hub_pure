import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabaseConfig, setSupabaseConfig } from '@/services/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Lock,
  Mail,
  UserPlus,
  LogIn,
  KeyRound,
  Cloud,
  CheckCircle2,
  Sparkles,
  Settings,
  HelpCircle,
  ShieldCheck,
  User,
  Database
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Auth = () => {
  const { signInWithSupabase, signUpWithSupabase, login, isCloudConnected } = useAuth();
  const navigate = useNavigate();

  const [config, setConfig] = useState(getSupabaseConfig());
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(!config.isConfigured);

  // Supabase Config Inputs
  const [supabaseUrl, setSupabaseUrl] = useState(config.url || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(config.anonKey || '');

  // Auth Inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Save Supabase credentials
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      toast.error('Informe a Project URL e a Anon Key do Supabase.');
      return;
    }

    if (!supabaseUrl.startsWith('http')) {
      toast.error('A Project URL deve começar com https://');
      return;
    }

    setSupabaseConfig(supabaseUrl, supabaseAnonKey);
    setConfig(getSupabaseConfig());
    setIsConfigModalOpen(false);
    toast.success('Chaves do Supabase salvas! Agora você pode criar sua conta ou fazer login.');
  };

  // Local / Guest login
  const handleLocalGuestLogin = () => {
    const localUser = {
      id: 'local_master_dev',
      email: email || 'dev@puredev.local',
      name: email ? email.split('@')[0] : 'Pure Developer',
      role: 'admin' as const,
      plan: 'pro' as const,
    };
    login('local_direct_token', localUser);
    toast.success('Entrando no Modo Local (dados salvos apenas neste navegador)');
    navigate('/');
  };

  // Login with Supabase
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Informe e-mail e senha.');
      return;
    }

    setIsLoading(true);
    try {
      await signInWithSupabase(email, password);
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao realizar login.');
    } finally {
      setIsLoading(false);
    }
  };

  // Register with Supabase
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Informe e-mail e senha.');
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      await signUpWithSupabase(email, password, name);
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar conta.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[25%] -left-[25%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-[25%] -right-[25%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[140px]" />
      </div>

      <Card className="w-full max-w-md border-primary/20 shadow-2xl backdrop-blur-md bg-background/90 relative z-10">
        <CardHeader className="space-y-1 text-center pb-4">
          <div className="flex justify-center mb-3">
            <div className="p-3.5 bg-primary/10 rounded-2xl ring-1 ring-primary/20 shadow-inner">
              <Cloud className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Pure Dev Dashboard</CardTitle>
          <CardDescription>
            Acesse seus cards, notas, kanban e planejamento de qualquer lugar
          </CardDescription>

          {/* Connection Pill */}
          <div className="pt-2 flex items-center justify-center gap-2">
            {config.isConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Supabase Conectado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Database className="w-3.5 h-3.5" /> Supabase Não Configurado
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px] text-muted-foreground hover:text-primary gap-1"
              onClick={() => setIsConfigModalOpen(true)}
            >
              <Settings className="w-3 h-3" /> Chaves da Nuvem
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Criar Conta</TabsTrigger>
            </TabsList>

            {/* ── TAB 1: LOGIN ── */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="dev@exemplo.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button className="w-full mt-2 gap-2 shadow-md" type="submit" disabled={isLoading}>
                  {isLoading ? 'Autenticando...' : <><LogIn className="w-4 h-4" /> Entrar e Sincronizar</>}
                </Button>
              </form>
            </TabsContent>

            {/* ── TAB 2: REGISTER ── */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Seu Nome / Apelido</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-name"
                      placeholder="Ex: Luiz Dev"
                      className="pl-10"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="dev@exemplo.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
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
                      placeholder="Pelo menos 6 caracteres"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button className="w-full mt-2 gap-2 shadow-md" type="submit" disabled={isLoading}>
                  {isLoading ? 'Criando conta...' : <><UserPlus className="w-4 h-4" /> Cadastrar Conta na Nuvem</>}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 border-t border-border/40 pt-5">
          <div className="relative w-full text-center">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Ou acesse offline</span>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-primary/20 hover:bg-primary/10 font-medium text-xs gap-2"
            onClick={handleLocalGuestLogin}
          >
            <Sparkles className="w-4 h-4 text-primary" /> Continuar em Modo Local (Sem Nuvem)
          </Button>

          <p className="text-center text-[11px] text-muted-foreground">
            Seus dados são criptografados e sincronizados com segurança no Supabase.
          </p>
        </CardFooter>
      </Card>

      {/* ── MODAL: SUPABASE CONFIGURATION ── */}
      <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSaveConfig}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" /> Conectar Banco de Dados Supabase
              </DialogTitle>
              <DialogDescription>
                Informe a URL e a Anon Key do seu projeto Supabase para habilitar o login e a sincronização em qualquer dispositivo.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="supa-url" className="text-xs font-bold uppercase tracking-wider">
                  Project URL *
                </Label>
                <Input
                  id="supa-url"
                  placeholder="https://xyzabcdefghijkl.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Encontrado em: <strong>Project Settings &gt; API &gt; Project URL</strong> no Supabase.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="supa-key" className="text-xs font-bold uppercase tracking-wider">
                  API Key (anon / public) *
                </Label>
                <Input
                  id="supa-key"
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Encontrado em: <strong>Project Settings &gt; API &gt; Project API keys &gt; anon public</strong>.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsConfigModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar Chaves e Conectar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
