import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Star,
  FileText,
  Sparkles,
  Code,
  BookOpen,
  Columns,
  Lock,
  User,
  UserCircle,
  CreditCard,
  DollarSign,
  Calendar,
  FileEdit,
  Settings,
  Heart,
  ListChecks,
  Music,
  Receipt,
  Calculator,
  LucideIcon,
  Package,
  FileSpreadsheet,
  HelpCircle,
  Menu,
  Search,
  X,
  ChevronRight,
  LayoutGrid,
  MonitorPlay,
  Cloud,
  CloudOff,
  LogOut,
  RefreshCw,
  Sun,
  Moon,
  Shield,
  Building,
  Users,
  Plug,
  Workflow,
  BarChart3,
  Book,
  HardDrive,
  History,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '@/services/db';
import { PomodoroTimer } from './PomodoroTimer';
import { NotificationHub } from './NotificationHub';

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  category: 'main' | 'productivity' | 'business' | 'personal' | 'system';
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'main' },
  { id: 'planner', label: 'Planner', icon: Target, category: 'main' },
  { id: 'explorer', label: 'Project Explorer', icon: LayoutGrid, category: 'main' },
  { id: 'tutorial', label: 'Tutorial', icon: HelpCircle, category: 'system' },
  { id: 'wellness', label: 'Bem-Estar', icon: Heart, category: 'personal' },
  { id: 'musica', label: 'Músicas', icon: Music, category: 'personal' },
  { id: 'videos', label: 'Vídeos', icon: MonitorPlay, category: 'personal' },
  { id: 'favorites', label: 'Favoritos', icon: Star, category: 'main' },
  { id: 'notes', label: 'Notas', icon: FileText, category: 'productivity' },
  { id: 'prompts', label: 'Prompts IA', icon: Sparkles, category: 'productivity' },
  { id: 'snippets', label: 'Snippets', icon: Code, category: 'productivity' },
  { id: 'cheatsheet', label: 'Cheatsheet', icon: BookOpen, category: 'productivity' },
  { id: 'kanban', label: 'Kanban', icon: Columns, category: 'productivity' },
  { id: 'boards', label: 'Mural Criativo (Milanote)', icon: LayoutGrid, category: 'productivity' },
  { id: 'checklists', label: 'Listas', icon: ListChecks, category: 'personal' },
  { id: 'passwords', label: 'Senhas', icon: Lock, category: 'personal' },
  { id: 'contacts', label: 'Contatos', icon: User, category: 'personal' },
  { id: 'orcamentos', label: 'Orçamentos', icon: Receipt, category: 'business' },
  { id: 'precificador', label: 'Precificador', icon: Calculator, category: 'business' },
  { id: 'estoque', label: 'Estoque', icon: Package, category: 'business' },
  { id: 'fichatecnica', label: 'Ficha Técnica', icon: FileSpreadsheet, category: 'business' },
  { id: 'finance', label: 'Financeiro', icon: DollarSign, category: 'business' },
  { id: 'diary', label: 'Diário', icon: Calendar, category: 'personal' },
  { id: 'draft', label: 'Rascunho', icon: FileEdit, category: 'productivity' },
  { id: 'integrations', label: 'Integrações', icon: Plug, category: 'system' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, category: 'main' },
  { id: 'wiki', label: 'Company Wiki', icon: Book, category: 'business' },
  { id: 'assets', label: 'Assets', icon: HardDrive, category: 'business' },
  { id: 'activity', label: 'Atividade', icon: History, category: 'system' },
  { id: 'settings', label: 'Config', icon: Settings, category: 'system' },
];

const categoryLabels: Record<string, string> = {
  main: 'Principal',
  productivity: 'Produtividade',
  business: 'Negócios',
  personal: 'Pessoal',
  system: 'Sistema',
};

export function ExtensionNavbar() {
  const { state, currentTab, setCurrentTab, theme, toggleTheme, setIsCommandPaletteOpen } = useApp();
  const { isAuthenticated, user, logout, isAdmin, isOrgAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const checkQueue = async () => {
      try {
        const queue = await db.getAll('syncQueue');
        setPendingCount(queue.length);
      } catch (e) {
        setPendingCount(0);
      }
    };

    checkQueue();
    const interval = setInterval(checkQueue, 10000);
    return () => clearInterval(interval);
  }, []);

  // Reset search when module changes
  useEffect(() => {
    setSearchQuery('');
  }, [currentTab]);

  const enabledMenuItems = useMemo(() =>
    menuItems.filter(item => state.enabledModules.includes(item.id)),
    [state.enabledModules]
  );

  // Prevention: If the search query looks like an email (likely auto-fill), clear it
  useEffect(() => {
    if (searchQuery.includes('@')) {
      setSearchQuery('');
    }
  }, [searchQuery]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return enabledMenuItems;
    return enabledMenuItems.filter(item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [enabledMenuItems, searchQuery]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    filteredItems.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  const currentItem = menuItems.find(item => item.id === currentTab);
  const CurrentIcon = currentItem?.icon || LayoutDashboard;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-12 items-center gap-2 px-3">
        {/* Menu Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-2 px-2">
              <Menu className="h-4 w-4" />
              <CurrentIcon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium truncate max-w-[120px] hidden sm:inline">
                {currentItem?.label || 'Menu'}
              </span>
              <ChevronRight className="h-3 w-3 ml-auto opacity-50 hidden sm:inline" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 max-h-[70vh] overflow-auto">
            {/* Search inside dropdown */}
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar módulo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-7 text-sm"
                  autoComplete="off"
                  id="module-search-input"
                  name="module-search-unique-field"
                  spellCheck={false}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-6 w-6"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            <DropdownMenuSeparator />

            {/* Admin Links in Main Menu (Mobile Friendly) */}
            {(isAdmin || isOrgAdmin) && (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground">Administração</DropdownMenuLabel>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin')} className="gap-2 cursor-pointer text-primary">
                    <Shield className="h-4 w-4" />
                    <span>Painel Admin Global</span>
                  </DropdownMenuItem>
                )}
                {isOrgAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/org-admin')} className="gap-2 cursor-pointer text-primary">
                    <Building className="h-4 w-4" />
                    <span>Painel da Empresa</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
              </>
            )}

            {Object.entries(groupedItems).map(([category, items]) => (
              <React.Fragment key={category}>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  {categoryLabels[category]}
                </DropdownMenuLabel>
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => setCurrentTab(item.id)}
                      className={cn(
                        "gap-2 cursor-pointer",
                        isActive && "bg-primary/10 text-primary"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </DropdownMenuItem>
                  );
                })}
              </React.Fragment>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Pomodoro Timer */}
        <PomodoroTimer />

        {/* Spacer */}
        <div className="flex-1" />

        <div className="flex items-center gap-1">
          {/* Cloud Status */}
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium transition-colors",
            isAuthenticated
              ? (pendingCount > 0 ? "bg-yellow-500/10 text-yellow-500" : "bg-primary/10 text-primary")
              : "bg-muted text-muted-foreground"
          )}>
            {isAuthenticated ? (
              pendingCount > 0 ? (
                <><RefreshCw className="h-3 w-3 animate-spin" /> <span className="hidden sm:inline">{pendingCount} pendente(s)</span></>
              ) : (
                <><Cloud className="h-3 w-3" /> <span className="hidden sm:inline">Nuvem Ativa</span></>
              )
            ) : (
              <><CloudOff className="h-3 w-3" /> <span className="hidden sm:inline">Offline</span></>
            )}
          </div>

          {/* Org Workspace Status */}
          {user?.organization_id && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium bg-blue-500/10 text-blue-500">
              <Users className="h-3 w-3" />
              <span className="hidden md:inline">Espaço Equipe</span>
            </div>
          )}

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary transition-all duration-300"
            onClick={toggleTheme}
            id="theme-toggle"
            title={theme === 'dark' ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Notification Hub */}
          <NotificationHub />

          {/* Quick Search Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary transition-all duration-300"
            onClick={() => setIsCommandPaletteOpen(true)}
            title="Pesquisa Rápida (Ctrl+K)"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* User / Logout */}
          {isAuthenticated && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-primary/20">
                  <User className="h-4 w-4 text-primary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sua Conta</DropdownMenuLabel>
                <div className="px-2 py-1.5 text-xs text-muted-foreground">{user?.email}</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setCurrentTab('profile')} className="gap-2 cursor-pointer">
                  <UserCircle className="h-4 w-4 text-primary" />
                  <span>Seu Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrentTab('billing')} className="gap-2 cursor-pointer">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span>Planos & Assinatura</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin')} className="gap-2 cursor-pointer">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>Painel Admin</span>
                  </DropdownMenuItem>
                )}
                {isOrgAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/org-admin')} className="gap-2 cursor-pointer">
                    <Building className="h-4 w-4 text-primary" />
                    <span>Painel Empresa</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive gap-2 cursor-pointer">
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

    </header>
  );
}
