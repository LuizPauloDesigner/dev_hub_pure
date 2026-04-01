import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Plus, Eye, EyeOff, Copy, Trash2, Lock, Shield, RefreshCw, Check, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import CryptoJS from 'crypto-js';
import { toast } from 'sonner';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { cn } from '@/lib/utils';

export const Passwords = () => {
  const { state, currentProject, addPassword, updatePassword, deletePassword } = useApp();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [showMasterDialog, setShowMasterDialog] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({
    title: '',
    username: '',
    password: '',
    url: '',
    notes: '',
  });

  // Generator State
  const [genLength, setGenLength] = useState(16);
  const [genOptions, setGenOptions] = useState({
    upper: true,
    lower: true,
    numbers: true,
    symbols: true,
  });
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  const generatePassword = () => {
    const charSets = {
      upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lower: 'abcdefghijklmnopqrstuvwxyz',
      numbers: '0123456789',
      symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    };

    let allowedChars = '';
    if (genOptions.upper) allowedChars += charSets.upper;
    if (genOptions.lower) allowedChars += charSets.lower;
    if (genOptions.numbers) allowedChars += charSets.numbers;
    if (genOptions.symbols) allowedChars += charSets.symbols;

    if (!allowedChars) {
      toast.error('Selecione ao menos um tipo de caractere');
      return '';
    }

    let result = '';
    const array = new Uint32Array(genLength);
    crypto.getRandomValues(array);
    for (let i = 0; i < genLength; i++) {
      result += allowedChars.charAt(array[i] % allowedChars.length);
    }
    return result;
  };

  const handleGenerate = () => {
    const newPass = generatePassword();
    if (newPass) {
      setForm(prev => ({ ...prev, password: newPass }));
      setIsGeneratorOpen(false);
      toast.success('Senha gerada com sucesso');
    }
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'Vazio', color: 'bg-muted' };
    let score = 0;
    if (pass.length > 8) score++;
    if (pass.length > 12) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    
    if (score <= 2) return { score, label: 'Fraca', color: 'bg-destructive', icon: ShieldX };
    if (score <= 4) return { score, label: 'Média', color: 'bg-yellow-500', icon: ShieldAlert };
    return { score, label: 'Forte', color: 'bg-emerald-500', icon: ShieldCheck };
  };

  const strength = getPasswordStrength(form.password);
  const StrengthIcon = strength.icon || Shield;

  const projectPasswords = state.passwords.filter(p => p.projectId === currentProject);

  const handleUnlock = () => {
    if (!masterPassword) {
      toast.error('Digite a senha mestra');
      return;
    }

    // In a real app, you would validate the master password
    // For demo purposes, we'll accept any non-empty password
    setIsUnlocked(true);
    setShowMasterDialog(false);
    toast.success('Cofre desbloqueado');
  };

  const handleAdd = () => {
    if (!form.title.trim() || !form.password.trim()) {
      toast.error('Título e senha são obrigatórios');
      return;
    }

    addPassword({
      projectId: currentProject,
      ...form,
    });

    setForm({ title: '', username: '', password: '', url: '', notes: '' });
    setIsDialogOpen(false);
    toast.success('Senha adicionada');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado');
  };

  const toggleShowPassword = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!isUnlocked) {
    return (
      <Dialog open={showMasterDialog} onOpenChange={setShowMasterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Digite a Senha Mestra
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Digite sua senha mestra para acessar o gerenciador de senhas.
            </p>
            <Input
              type="password"
              placeholder="Senha mestra"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            />
            <Button onClick={handleUnlock} className="w-full">
              Desbloquear
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciador de Senhas</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsUnlocked(false)}>
            <Lock className="h-4 w-4 mr-2" />
            Bloquear
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Senha
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Senha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Título"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Input
              placeholder="Usuário/Email"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text" // Change to text if generated to show it, or keep toggle
                    placeholder="Senha"
                    className="pr-10"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button 
                    type="button"
                    onClick={() => setIsGeneratorOpen(!isGeneratorOpen)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    title="Gerador de Senha"
                  >
                    <RefreshCw className={cn("h-4 w-4", isGeneratorOpen && "animate-spin text-primary")} />
                  </button>
                </div>
              </div>

              {/* Enhanced Password Strength Meter */}
              {form.password && (
                <div className="space-y-1.5 px-1">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <StrengthIcon className={cn("h-3 w-3", strength.color.replace('bg-', 'text-'))} />
                      <span>Força: <span className={strength.color.replace('bg-', 'text-')}>{strength.label}</span></span>
                    </div>
                    <span className="text-muted-foreground">{form.password.length} caracteres</span>
                  </div>
                  <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all duration-500", strength.color)}
                      style={{ width: `${(strength.score / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Generator Options Panel */}
              {isGeneratorOpen && (
                <div className="p-4 bg-accent/30 rounded-lg border border-primary/10 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Comprimento: {genLength}</Label>
                    </div>
                    <Slider
                      value={[genLength]}
                      min={8}
                      max={64}
                      step={1}
                      onValueChange={(val) => setGenLength(val[0])}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">ABC</Label>
                      <Switch 
                        checked={genOptions.upper} 
                        onCheckedChange={(v) => setGenOptions(prev => ({ ...prev, upper: v }))} 
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">abc</Label>
                      <Switch 
                        checked={genOptions.lower} 
                        onCheckedChange={(v) => setGenOptions(prev => ({ ...prev, lower: v }))} 
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">123</Label>
                      <Switch 
                        checked={genOptions.numbers} 
                        onCheckedChange={(v) => setGenOptions(prev => ({ ...prev, numbers: v }))} 
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">#$&</Label>
                      <Switch 
                        checked={genOptions.symbols} 
                        onCheckedChange={(v) => setGenOptions(prev => ({ ...prev, symbols: v }))} 
                      />
                    </div>
                  </div>

                  <Button 
                    type="button" 
                    variant="secondary" 
                    size="sm" 
                    className="w-full gap-2 text-xs font-bold uppercase"
                    onClick={handleGenerate}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Gerar e Aplicar
                  </Button>
                </div>
              )}
            </div>

            <Input
              placeholder="URL (opcional)"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />
            <Textarea
              placeholder="Notas (opcional)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            <Button onClick={handleAdd} className="w-full">
              Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projectPasswords.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Nenhuma senha salva</p>
            </CardContent>
          </Card>
        ) : (
          projectPasswords.map(password => (
            <Card key={password.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{password.title}</CardTitle>
                  <button
                    onClick={() => {
                      deletePassword(password.id);
                      toast.success('Senha deletada');
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {password.username && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground">Usuário:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">{password.username}</span>
                      <button onClick={() => handleCopy(password.username)}>
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">Senha:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">
                      {showPasswords[password.id] ? password.password : '••••••••'}
                    </span>
                    <button onClick={() => toggleShowPassword(password.id)}>
                      {showPasswords[password.id] ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </button>
                    <button onClick={() => handleCopy(password.password)}>
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                {password.url && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground">URL:</span>
                    <a
                      href={password.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline truncate max-w-[150px]"
                    >
                      {password.url}
                    </a>
                  </div>
                )}
                {password.notes && (
                  <p className="text-sm text-muted-foreground mt-2">{password.notes}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
