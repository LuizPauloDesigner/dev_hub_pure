import { useState } from 'react';
import { storageService } from '@/services/storageService';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Plus, Trash2, Edit2, Key, ToggleLeft, ToggleRight, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import CryptoJS from 'crypto-js';

export const Settings = () => {
  const { 
    state, 
    currentProject,
    addProject, 
    updateProject, 
    deleteProject,
    addFinancialAccount,
    updateFinancialAccount,
    deleteFinancialAccount,
    addFinancialCategory,
    updateFinancialCategory,
    deleteFinancialCategory,
    addFinancialBudget,
    updateFinancialBudget,
    deleteFinancialBudget,
    addContactTag,
    deleteContactTag,
    updateBillingInfo,
    addServiceCatalogItem,
    updateServiceCatalogItem,
    deleteServiceCatalogItem,
    toggleModule,
  } = useApp();
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState({ name: '', color: '#dc3545' });

  // Financial states
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [accountForm, setAccountForm] = useState({ name: '', initialBalance: '' });

  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', type: 'expense' as 'income' | 'expense' });

  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [budgetForm, setBudgetForm] = useState({ categoryId: '', limit: '', month: new Date().toISOString().slice(0, 7) });

  // Contact tags state
  const [contactTagDialogOpen, setContactTagDialogOpen] = useState(false);
  const [newContactTag, setNewContactTag] = useState('');

  // Billing info state
  const [isBillingDialogOpen, setIsBillingDialogOpen] = useState(false);
  const [billingForm, setBillingForm] = useState(state.billingInfo);

  // Service catalog state
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState({ description: '', unitPrice: '', useIdealHourlyRate: false });

  // Master password state
  const [isMasterPasswordDialogOpen, setIsMasterPasswordDialogOpen] = useState(false);
  const [masterPasswordForm, setMasterPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [hasMasterPassword, setHasMasterPassword] = useState(!!localStorage.getItem('masterPassword'));

  const handleAddProject = () => {
    if (!projectForm.name.trim()) {
      toast.error('Nome do projeto é obrigatório');
      return;
    }

    if (editingProject) {
      updateProject(editingProject, projectForm);
      toast.success('Projeto atualizado');
    } else {
      addProject(projectForm);
      toast.success('Projeto criado');
    }

    setProjectForm({ name: '', color: '#dc3545' });
    setEditingProject(null);
    setIsProjectDialogOpen(false);
  };

  const handleEditProject = (projectId: string) => {
    const project = state.projects.find(p => p.id === projectId);
    if (project) {
      setProjectForm({ name: project.name, color: project.color });
      setEditingProject(projectId);
      setIsProjectDialogOpen(true);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    if (state.projects.length === 1) {
      toast.error('Não é possível deletar o único projeto');
      return;
    }
    deleteProject(projectId);
    toast.success('Projeto deletado');
  };

  const handleExportData = () => {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'devcommandcenter-backup.json';
    a.click();
    toast.success('Dados exportados');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        storageService.importAll(data).then(() => {
          toast.success('Dados importados! Recarregando...');
          setTimeout(() => window.location.reload(), 1000);
        });
      } catch (error) {
        toast.error('Erro ao importar dados');
      }
    };
    reader.readAsText(file);
  };

  // Financial handlers
  const handleAddAccount = () => {
    if (!accountForm.name.trim()) {
      toast.error('Nome da conta é obrigatório');
      return;
    }

    const accountData = {
      projectId: currentProject,
      name: accountForm.name,
      initialBalance: parseFloat(accountForm.initialBalance) || 0,
    };

    if (editingAccount) {
      updateFinancialAccount(editingAccount, accountData);
      toast.success('Conta atualizada');
    } else {
      addFinancialAccount(accountData);
      toast.success('Conta criada');
    }

    setAccountForm({ name: '', initialBalance: '' });
    setEditingAccount(null);
    setIsAccountDialogOpen(false);
  };

  const handleEditAccount = (accountId: string) => {
    const account = state.financialAccounts.find(a => a.id === accountId);
    if (account) {
      setAccountForm({ name: account.name, initialBalance: account.initialBalance.toString() });
      setEditingAccount(accountId);
      setIsAccountDialogOpen(true);
    }
  };

  const handleDeleteAccount = (accountId: string) => {
    if (confirm('Deseja deletar esta conta?')) {
      deleteFinancialAccount(accountId);
      toast.success('Conta deletada');
    }
  };

  const handleAddCategory = () => {
    if (!categoryForm.name.trim()) {
      toast.error('Nome da categoria é obrigatório');
      return;
    }

    const categoryData = {
      projectId: currentProject,
      name: categoryForm.name,
      type: categoryForm.type,
    };

    if (editingCategory) {
      updateFinancialCategory(editingCategory, categoryData);
      toast.success('Categoria atualizada');
    } else {
      addFinancialCategory(categoryData);
      toast.success('Categoria criada');
    }

    setCategoryForm({ name: '', type: 'expense' });
    setEditingCategory(null);
    setIsCategoryDialogOpen(false);
  };

  const handleEditCategory = (categoryId: string) => {
    const category = state.financialCategories.find(c => c.id === categoryId);
    if (category) {
      setCategoryForm({ name: category.name, type: category.type });
      setEditingCategory(categoryId);
      setIsCategoryDialogOpen(true);
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (confirm('Deseja deletar esta categoria?')) {
      deleteFinancialCategory(categoryId);
      toast.success('Categoria deletada');
    }
  };

  const handleAddBudget = () => {
    if (!budgetForm.categoryId || !budgetForm.limit) {
      toast.error('Preencha todos os campos');
      return;
    }

    const budgetData = {
      projectId: currentProject,
      categoryId: budgetForm.categoryId,
      limit: parseFloat(budgetForm.limit),
      month: budgetForm.month,
    };

    if (editingBudget) {
      updateFinancialBudget(editingBudget, budgetData);
      toast.success('Orçamento atualizado');
    } else {
      addFinancialBudget(budgetData);
      toast.success('Orçamento criado');
    }

    setBudgetForm({ categoryId: '', limit: '', month: new Date().toISOString().slice(0, 7) });
    setEditingBudget(null);
    setIsBudgetDialogOpen(false);
  };

  const handleEditBudget = (budgetId: string) => {
    const budget = state.financialBudgets.find(b => b.id === budgetId);
    if (budget) {
      setBudgetForm({ categoryId: budget.categoryId, limit: budget.limit.toString(), month: budget.month });
      setEditingBudget(budgetId);
      setIsBudgetDialogOpen(true);
    }
  };

  const handleDeleteBudget = (budgetId: string) => {
    if (confirm('Deseja deletar este orçamento?')) {
      deleteFinancialBudget(budgetId);
      toast.success('Orçamento deletado');
    }
  };

  const projectAccounts = (state.financialAccounts || []).filter(a => a.projectId === currentProject);
  const projectCategories = (state.financialCategories || []).filter(c => c.projectId === currentProject);
  const projectBudgets = (state.financialBudgets || []).filter(b => b.projectId === currentProject);

  const handleSaveBillingInfo = () => {
    updateBillingInfo(billingForm);
    setIsBillingDialogOpen(false);
    toast.success('Dados de faturamento atualizados');
  };

  const handleAddService = () => {
    if (!serviceForm.description.trim()) {
      toast.error('Descrição é obrigatória');
      return;
    }

    const serviceData = {
      description: serviceForm.description,
      unitPrice: parseFloat(serviceForm.unitPrice) || 0,
      useIdealHourlyRate: serviceForm.useIdealHourlyRate,
    };

    if (editingService) {
      updateServiceCatalogItem(editingService, serviceData);
      toast.success('Serviço atualizado');
    } else {
      addServiceCatalogItem(serviceData);
      toast.success('Serviço adicionado');
    }

    setServiceForm({ description: '', unitPrice: '', useIdealHourlyRate: false });
    setEditingService(null);
    setIsServiceDialogOpen(false);
  };

  const handleEditService = (serviceId: string) => {
    const service = state.serviceCatalog.find(s => s.id === serviceId);
    if (service) {
      setServiceForm({ 
        description: service.description, 
        unitPrice: service.unitPrice.toString(),
        useIdealHourlyRate: service.useIdealHourlyRate || false,
      });
      setEditingService(serviceId);
      setIsServiceDialogOpen(true);
    }
  };

  const handleDeleteService = (serviceId: string) => {
    if (confirm('Deseja deletar este serviço?')) {
      deleteServiceCatalogItem(serviceId);
      toast.success('Serviço deletado');
    }
  };

  const handleSaveMasterPassword = () => {
    if (!hasMasterPassword) {
      // Criando nova senha
      if (!masterPasswordForm.new || !masterPasswordForm.confirm) {
        toast.error('Preencha todos os campos');
        return;
      }
      if (masterPasswordForm.new !== masterPasswordForm.confirm) {
        toast.error('As senhas não coincidem');
        return;
      }
      if (masterPasswordForm.new.length < 6) {
        toast.error('A senha deve ter pelo menos 6 caracteres');
        return;
      }
      localStorage.setItem('masterPassword', masterPasswordForm.new);
      setHasMasterPassword(true);
      toast.success('Senha Mestra criada com sucesso!');
    } else {
      // Alterando senha existente
      const currentPassword = localStorage.getItem('masterPassword');
      if (masterPasswordForm.current !== currentPassword) {
        toast.error('Senha atual incorreta');
        return;
      }
      if (!masterPasswordForm.new || !masterPasswordForm.confirm) {
        toast.error('Preencha a nova senha');
        return;
      }
      if (masterPasswordForm.new !== masterPasswordForm.confirm) {
        toast.error('As novas senhas não coincidem');
        return;
      }
      if (masterPasswordForm.new.length < 6) {
        toast.error('A senha deve ter pelo menos 6 caracteres');
        return;
      }
      localStorage.setItem('masterPassword', masterPasswordForm.new);
      toast.success('Senha Mestra alterada com sucesso!');
    }
    setMasterPasswordForm({ current: '', new: '', confirm: '' });
    setIsMasterPasswordDialogOpen(false);
  };

  const handleRemoveMasterPassword = () => {
    const currentPassword = localStorage.getItem('masterPassword');
    if (masterPasswordForm.current !== currentPassword) {
      toast.error('Senha atual incorreta');
      return;
    }
    if (confirm('⚠️ ATENÇÃO: Ao remover a Senha Mestra, você não poderá mais descriptografar dados exportados anteriormente. Deseja continuar?')) {
      localStorage.removeItem('masterPassword');
      setHasMasterPassword(false);
      setMasterPasswordForm({ current: '', new: '', confirm: '' });
      setIsMasterPasswordDialogOpen(false);
      toast.success('Senha Mestra removida');
    }
  };

  const handleExportAllData = () => {
    try {
      // Coletar TODOS os dados de todos os módulos
      const allData = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        appState: state,
        musicPlaylists: JSON.parse(localStorage.getItem('musicPlaylists') || '[]'),
        theme: localStorage.getItem('theme') || 'dark',
        currentProject: localStorage.getItem('currentProject') || 'default',
        miniPlayerVisible: localStorage.getItem('mini-player-visible') !== 'false',
      };

      const masterPassword = localStorage.getItem('masterPassword');
      let exportContent: string;
      let fileName: string;

      if (masterPassword) {
        // Exportar criptografado
        exportContent = CryptoJS.AES.encrypt(
          JSON.stringify(allData),
          masterPassword
        ).toString();
        fileName = `backup-completo-${new Date().toISOString().split('T')[0]}.enc`;
      } else {
        // Exportar em JSON puro
        exportContent = JSON.stringify(allData, null, 2);
        fileName = `backup-completo-${new Date().toISOString().split('T')[0]}.json`;
      }

      const blob = new Blob([exportContent], { type: masterPassword ? 'text/plain' : 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Backup criado! ${masterPassword ? '(Criptografado)' : '(JSON)'}`);
    } catch (error) {
      toast.error('Erro ao exportar dados');
      console.error(error);
    }
  };

  const handleImportAllData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const fileContent = e.target?.result as string;
        let importedData;

        // Tentar primeiro como JSON puro
        try {
          importedData = JSON.parse(fileContent);
        } catch {
          // Se falhar, tentar descriptografar
          const masterPassword = localStorage.getItem('masterPassword');
          if (!masterPassword) {
            toast.error('Arquivo criptografado detectado. Configure a Senha Mestra primeiro.');
            return;
          }
          
          const decrypted = CryptoJS.AES.decrypt(fileContent, masterPassword).toString(CryptoJS.enc.Utf8);
          if (!decrypted) {
            toast.error('Senha incorreta ou arquivo inválido');
            return;
          }
          importedData = JSON.parse(decrypted);
        }

        // Verificar versão e estrutura
        let stateToImport;
        const extras: { theme?: string; currentProject?: string } = {};

        if (!importedData.version || !importedData.appState) {
          // Formato antigo (v1.0)
          stateToImport = importedData.data || importedData;
        } else {
          // Formato novo (v2.0)
          stateToImport = importedData.appState;
          if (importedData.theme) extras.theme = importedData.theme;
          if (importedData.currentProject) extras.currentProject = importedData.currentProject;

          if (importedData.musicPlaylists) {
            localStorage.setItem('musicPlaylists', JSON.stringify(importedData.musicPlaylists));
          }
          if (importedData.miniPlayerVisible !== undefined) {
            localStorage.setItem('mini-player-visible', importedData.miniPlayerVisible.toString());
          }
        }

        await storageService.importAll(stateToImport, extras);

        toast.success('Dados importados! Recarregando...');
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        toast.error('Erro ao importar dados. Verifique o arquivo.');
        console.error(error);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Configurações</h2>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Projetos</CardTitle>
            <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => {
                  setEditingProject(null);
                  setProjectForm({ name: '', color: '#dc3545' });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Projeto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingProject ? 'Editar' : 'Novo'} Projeto</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    placeholder="Nome do projeto"
                    value={projectForm.name}
                    onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Cor:</label>
                    <input
                      type="color"
                      value={projectForm.color}
                      onChange={(e) => setProjectForm({ ...projectForm, color: e.target.value })}
                      className="h-10 w-20 rounded border cursor-pointer"
                    />
                  </div>
                  <Button onClick={handleAddProject} className="w-full">
                    {editingProject ? 'Atualizar' : 'Criar'} Projeto
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {state.projects.map(project => (
            <div
              key={project.id}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <span className="font-medium">{project.name}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleEditProject(project.id)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                {state.projects.length > 1 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteProject(project.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup & Restauração</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Exporte todos os seus dados para um arquivo JSON
            </p>
            <Button onClick={handleExportData} variant="outline" className="w-full">
              Exportar Todos os Dados
            </Button>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Importe dados de um backup anterior
            </p>
            <label className="cursor-pointer">
              <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
              <div className="inline-flex items-center justify-center w-full h-10 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium transition-colors">
                Importar Dados
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Senha Mestra
            </CardTitle>
            <Dialog open={isMasterPasswordDialogOpen} onOpenChange={setIsMasterPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => setMasterPasswordForm({ current: '', new: '', confirm: '' })}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  {hasMasterPassword ? 'Alterar' : 'Configurar'} Senha
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{hasMasterPassword ? 'Alterar' : 'Configurar'} Senha Mestra</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  {hasMasterPassword && (
                    <div>
                      <Label>Senha Atual</Label>
                      <Input
                        type="password"
                        value={masterPasswordForm.current}
                        onChange={(e) => setMasterPasswordForm({ ...masterPasswordForm, current: e.target.value })}
                        placeholder="Digite a senha atual"
                      />
                    </div>
                  )}
                  <div>
                    <Label>Nova Senha</Label>
                    <Input
                      type="password"
                      value={masterPasswordForm.new}
                      onChange={(e) => setMasterPasswordForm({ ...masterPasswordForm, new: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  <div>
                    <Label>Confirmar Nova Senha</Label>
                    <Input
                      type="password"
                      value={masterPasswordForm.confirm}
                      onChange={(e) => setMasterPasswordForm({ ...masterPasswordForm, confirm: e.target.value })}
                      placeholder="Digite novamente"
                    />
                  </div>
                  <Button onClick={handleSaveMasterPassword} className="w-full">
                    {hasMasterPassword ? 'Alterar' : 'Criar'} Senha
                  </Button>
                  {hasMasterPassword && (
                    <Button variant="destructive" onClick={handleRemoveMasterPassword} className="w-full">
                      Remover Senha Mestra
                    </Button>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant={hasMasterPassword ? "default" : "secondary"}>
                {hasMasterPassword ? '🔒 Configurada' : '🔓 Não Configurada'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              A Senha Mestra protege módulos sensíveis como Estoque, Ficha Técnica e Senhas. 
              Configure-a para exportar/importar dados criptografados desses módulos.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Backup do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Backup do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Exporte <strong>todos os dados de todos os módulos</strong> em um único arquivo. Se você tiver uma Senha Mestra configurada, o arquivo será criptografado automaticamente.
          </p>
          <div className="p-3 border rounded bg-muted/50 space-y-2">
            <p className="text-xs text-muted-foreground">
              <strong>📦 Dados incluídos no backup:</strong>
            </p>
            <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
              <li>Notas, Prompts, Snippets, Cheatsheet</li>
              <li>Kanban, Checklists, Favoritos</li>
              <li>Senhas, Contatos (criptografados)</li>
              <li>Finanças, Orçamentos, Precificador</li>
              <li>Estoque, Fichas Técnicas</li>
              <li>Diário, Rascunho</li>
              <li>Playlists de música</li>
              <li>Estatísticas Pomodoro/Wellness</li>
              <li>Configurações e preferências</li>
            </ul>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportAllData} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Exportar Todos os Dados
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <label className="cursor-pointer flex items-center justify-center">
                <Upload className="h-4 w-4 mr-2" />
                Importar Dados
                <input
                  type="file"
                  accept=".json,.enc,.txt"
                  onChange={handleImportAllData}
                  className="hidden"
                />
              </label>
            </Button>
          </div>
          <div className="p-3 border rounded bg-yellow-500/10 border-yellow-500/30">
            <p className="text-xs text-muted-foreground">
              ⚠️ <strong>Importante:</strong> {hasMasterPassword 
                ? 'Seu backup será criptografado com a Senha Mestra. Mantenha-o em local seguro.' 
                : 'Configure uma Senha Mestra para criptografar seus backups automaticamente.'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ToggleRight className="h-5 w-5" />
            Gerenciar Módulos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Habilite ou desabilite módulos para personalizar sua Central de Comando. 
            Módulos desabilitados não aparecerão na barra lateral.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { id: 'dashboard', label: 'Dashboard', protected: true },
              { id: 'planner', label: 'Planner', protected: false },
              { id: 'tutorial', label: 'Tutorial', protected: true },
              { id: 'wellness', label: 'Bem-Estar', protected: false },
              { id: 'musica', label: 'Biblioteca de Músicas', protected: false },
              { id: 'videos', label: 'Biblioteca de Vídeos', protected: false },
              { id: 'favorites', label: 'Favoritos', protected: false },
              { id: 'notes', label: 'Notas', protected: false },
              { id: 'prompts', label: 'Prompts IA', protected: false },
              { id: 'snippets', label: 'Snippets', protected: false },
              { id: 'cheatsheet', label: 'Cheatsheet', protected: false },
              { id: 'kanban', label: 'Kanban', protected: false },
              { id: 'checklists', label: 'Listas Pessoais', protected: false },
              { id: 'passwords', label: 'Senhas', protected: false },
              { id: 'contacts', label: 'Contatos', protected: false },
              { id: 'orcamentos', label: 'Orçamentos', protected: false },
              { id: 'precificador', label: 'Precificador', protected: false },
              { id: 'estoque', label: 'Estoque', protected: false },
              { id: 'fichatecnica', label: 'Ficha Técnica', protected: false },
              { id: 'finance', label: 'Financeiro', protected: false },
              { id: 'diary', label: 'Diário', protected: false },
              { id: 'draft', label: 'Rascunho', protected: false },
              { id: 'settings', label: 'Configurações', protected: true },
            ].map(module => {
              const isEnabled = state.enabledModules.includes(module.id);
              return (
                <div 
                  key={module.id} 
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <span className="font-medium text-sm">{module.label}</span>
                  <Button
                    variant={isEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (module.protected) {
                        toast.error('Este módulo não pode ser desabilitado');
                        return;
                      }
                      toggleModule(module.id);
                      toast.success(
                        isEnabled 
                          ? `${module.label} desabilitado` 
                          : `${module.label} habilitado`
                      );
                    }}
                    disabled={module.protected}
                  >
                    {isEnabled ? (
                      <>
                        <ToggleRight className="h-4 w-4 mr-1" />
                        Ativo
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="h-4 w-4 mr-1" />
                        Inativo
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estatísticas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total de Notas:</span>
            <span className="font-medium">{state.notes.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total de Prompts:</span>
            <span className="font-medium">{state.prompts.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total de Snippets:</span>
            <span className="font-medium">{state.snippets.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tarefas Kanban:</span>
            <span className="font-medium">{state.kanban.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sites Favoritos:</span>
            <span className="font-medium">{state.bookmarks.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Entradas no Diário:</span>
            <span className="font-medium">{state.diary.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Transações Financeiras:</span>
            <span className="font-medium">{(state.financialTransactions || []).length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Contatos:</span>
            <span className="font-medium">{(state.contacts || []).length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Listas Pessoais:</span>
            <span className="font-medium">{(state.checklists || []).length}</span>
          </div>
        </CardContent>
      </Card>

      {/* Contact Tags Management */}
      <Card>
        <CardHeader>
          <CardTitle>Tags de Contatos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Dialog open={contactTagDialogOpen} onOpenChange={setContactTagDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setNewContactTag('')}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Tag de Contato</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Nome da Tag</Label>
                  <Input
                    value={newContactTag}
                    onChange={(e) => setNewContactTag(e.target.value)}
                    placeholder="Ex: Cliente, Fornecedor, Parceiro"
                  />
                </div>
                <Button
                  onClick={() => {
                    if (newContactTag.trim()) {
                      addContactTag(newContactTag.trim());
                      setContactTagDialogOpen(false);
                      setNewContactTag('');
                      toast.success('Tag adicionada');
                    }
                  }}
                  className="w-full"
                >
                  Adicionar
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="space-y-2">
            {(state.contactTags || []).map(tag => (
              <div key={tag} className="flex items-center justify-between p-3 rounded-lg border">
                <span className="font-medium">{tag}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`Remover a tag "${tag}"?`)) {
                      deleteContactTag(tag);
                      toast.success('Tag removida');
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
            {(state.contactTags || []).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma tag cadastrada
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Billing Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Meus Dados de Faturamento</CardTitle>
            <Dialog open={isBillingDialogOpen} onOpenChange={setIsBillingDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => setBillingForm(state.billingInfo)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Editar Dados
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Dados de Faturamento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Nome da Empresa/Pessoa</Label>
                    <Input
                      value={billingForm.companyName}
                      onChange={(e) => setBillingForm({ ...billingForm, companyName: e.target.value })}
                      placeholder="Ex: João Silva"
                    />
                  </div>
                  <div>
                    <Label>Endereço</Label>
                    <Textarea
                      value={billingForm.address}
                      onChange={(e) => setBillingForm({ ...billingForm, address: e.target.value })}
                      placeholder="Endereço completo"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>CNPJ/CPF</Label>
                    <Input
                      value={billingForm.taxId}
                      onChange={(e) => setBillingForm({ ...billingForm, taxId: e.target.value })}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div>
                    <Label>E-mail</Label>
                    <Input
                      type="email"
                      value={billingForm.email}
                      onChange={(e) => setBillingForm({ ...billingForm, email: e.target.value })}
                      placeholder="contato@empresa.com"
                    />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input
                      value={billingForm.phone}
                      onChange={(e) => setBillingForm({ ...billingForm, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <Label>URL da Logo</Label>
                    <Input
                      value={billingForm.logoUrl}
                      onChange={(e) => setBillingForm({ ...billingForm, logoUrl: e.target.value })}
                      placeholder="https://exemplo.com/logo.png"
                    />
                  </div>
                  <Button onClick={handleSaveBillingInfo} className="w-full">
                    Salvar Dados
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {state.billingInfo.companyName ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Empresa:</span>
                <span className="font-medium">{state.billingInfo.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CNPJ/CPF:</span>
                <span className="font-medium">{state.billingInfo.taxId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">E-mail:</span>
                <span className="font-medium">{state.billingInfo.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Telefone:</span>
                <span className="font-medium">{state.billingInfo.phone}</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum dado de faturamento cadastrado
            </p>
          )}
        </CardContent>
      </Card>

      {/* Service Catalog */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Catálogo de Serviços/Itens</CardTitle>
            <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => {
                  setEditingService(null);
                  setServiceForm({ description: '', unitPrice: '', useIdealHourlyRate: false });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Serviço
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingService ? 'Editar' : 'Novo'} Serviço</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Descrição</Label>
                    <Input
                      value={serviceForm.description}
                      onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                      placeholder="Ex: Desenvolvimento de website"
                    />
                  </div>
                   <div>
                    <Label>Preço Unitário (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={serviceForm.unitPrice}
                      onChange={(e) => setServiceForm({ ...serviceForm, unitPrice: e.target.value })}
                      placeholder="0.00"
                      disabled={serviceForm.useIdealHourlyRate}
                    />
                    {serviceForm.useIdealHourlyRate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Preço vinculado ao Valor/Hora Ideal
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="useIdealHourlyRate"
                      checked={serviceForm.useIdealHourlyRate}
                      onChange={(e) => setServiceForm({ ...serviceForm, useIdealHourlyRate: e.target.checked })}
                      className="h-4 w-4 rounded border-input"
                    />
                    <Label htmlFor="useIdealHourlyRate" className="text-sm font-normal cursor-pointer">
                      Usar Valor/Hora Ideal do Precificador
                    </Label>
                  </div>
                  <Button onClick={handleAddService} className="w-full">
                    {editingService ? 'Atualizar' : 'Adicionar'} Serviço
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {state.serviceCatalog.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum serviço cadastrado
            </p>
          ) : (
            state.serviceCatalog.map(service => (
              <div key={service.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <div>
                    <span className="font-medium">{service.description}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      - R$ {service.unitPrice.toFixed(2)}
                    </span>
                  </div>
                  {service.useIdealHourlyRate && (
                    <Badge variant="secondary" className="text-xs">
                      Valor/Hora Ideal
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEditService(service.id)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteService(service.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financeiro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Contas</h3>
              <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => {
                    setEditingAccount(null);
                    setAccountForm({ name: '', initialBalance: '' });
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Conta
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingAccount ? 'Editar' : 'Nova'} Conta</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label>Nome da Conta</Label>
                      <Input
                        placeholder="Ex: Carteira, Conta Corrente"
                        value={accountForm.name}
                        onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Saldo Inicial</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={accountForm.initialBalance}
                        onChange={(e) => setAccountForm({ ...accountForm, initialBalance: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleAddAccount} className="w-full">
                      {editingAccount ? 'Atualizar' : 'Criar'} Conta
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-2">
              {projectAccounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma conta criada</p>
              ) : (
                projectAccounts.map(account => (
                  <div key={account.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <span className="font-medium">{account.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        (Saldo inicial: R$ {account.initialBalance.toFixed(2)})
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => handleEditAccount(account.id)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteAccount(account.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Categorias */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Categorias</h3>
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => {
                    setEditingCategory(null);
                    setCategoryForm({ name: '', type: 'expense' });
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Categoria
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingCategory ? 'Editar' : 'Nova'} Categoria</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label>Nome da Categoria</Label>
                      <Input
                        placeholder="Ex: Salário, Moradia, Lazer"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Tipo</Label>
                      <Select
                        value={categoryForm.type}
                        onValueChange={(value: 'income' | 'expense') => 
                          setCategoryForm({ ...categoryForm, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Receita</SelectItem>
                          <SelectItem value="expense">Despesa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddCategory} className="w-full">
                      {editingCategory ? 'Atualizar' : 'Criar'} Categoria
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-2">
              {projectCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma categoria criada</p>
              ) : (
                projectCategories.map(category => (
                  <div key={category.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <span className="font-medium">{category.name}</span>
                      <span className={`text-sm ml-2 ${
                        category.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ({category.type === 'income' ? 'Receita' : 'Despesa'})
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => handleEditCategory(category.id)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteCategory(category.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Orçamentos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Orçamentos Mensais</h3>
              <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      setEditingBudget(null);
                      setBudgetForm({ categoryId: '', limit: '', month: new Date().toISOString().slice(0, 7) });
                    }}
                    disabled={projectCategories.filter(c => c.type === 'expense').length === 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Orçamento
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingBudget ? 'Editar' : 'Novo'} Orçamento</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label>Categoria de Despesa</Label>
                      <Select
                        value={budgetForm.categoryId}
                        onValueChange={(value) => setBudgetForm({ ...budgetForm, categoryId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {projectCategories
                            .filter(c => c.type === 'expense')
                            .map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Limite Mensal</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={budgetForm.limit}
                        onChange={(e) => setBudgetForm({ ...budgetForm, limit: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Mês</Label>
                      <Input
                        type="month"
                        value={budgetForm.month}
                        onChange={(e) => setBudgetForm({ ...budgetForm, month: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleAddBudget} className="w-full">
                      {editingBudget ? 'Atualizar' : 'Criar'} Orçamento
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-2">
              {projectBudgets.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum orçamento definido</p>
              ) : (
                projectBudgets.map(budget => {
                  const category = projectCategories.find(c => c.id === budget.categoryId);
                  const [year, month] = budget.month.split('-');
                  return (
                    <div key={budget.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <span className="font-medium">{category?.name || 'Categoria deletada'}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({month}/{year}) - Limite: R$ {budget.limit.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handleEditBudget(budget.id)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteBudget(budget.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
