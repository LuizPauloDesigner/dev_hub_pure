import { useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Dialog, DialogContent } from './ui/dialog';
import { Input } from './ui/input';
import { Command, FileText, Sparkles, Code, BookOpen, Columns, Lock, Calendar, FileEdit, Settings, LayoutDashboard, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const commands = [
  { id: 'dashboard', label: 'Ir para Dashboard', icon: LayoutDashboard, action: 'navigate' },
  { id: 'favorites', label: 'Ir para Favoritos', icon: Star, action: 'navigate' },
  { id: 'notes', label: 'Ir para Notas', icon: FileText, action: 'navigate' },
  { id: 'prompts', label: 'Ir para Prompts', icon: Sparkles, action: 'navigate' },
  { id: 'snippets', label: 'Ir para Snippets', icon: Code, action: 'navigate' },
  { id: 'cheatsheet', label: 'Ir para Cheatsheet', icon: BookOpen, action: 'navigate' },
  { id: 'kanban', label: 'Ir para Kanban', icon: Columns, action: 'navigate' },
  { id: 'passwords', label: 'Ir para Senhas', icon: Lock, action: 'navigate' },
  { id: 'diary', label: 'Ir para Diário', icon: Calendar, action: 'navigate' },
  { id: 'draft', label: 'Ir para Rascunho', icon: FileEdit, action: 'navigate' },
  { id: 'settings', label: 'Ir para Configurações', icon: Settings, action: 'navigate' },
  { id: 'theme', label: 'Alternar Tema', icon: Command, action: 'toggleTheme' },
];

export const CommandPalette = () => {
  const { setCurrentTab, toggleTheme, isCommandPaletteOpen, setIsCommandPaletteOpen } = useApp();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }

      if (!isCommandPaletteOpen) return;

      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setSearch('');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSelect(filteredCommands[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, filteredCommands, selectedIndex, setIsCommandPaletteOpen]);

  const handleSelect = (cmd: typeof commands[0]) => {
    if (cmd.action === 'navigate') {
      setCurrentTab(cmd.id);
    } else if (cmd.action === 'toggleTheme') {
      toggleTheme();
    }
    setIsCommandPaletteOpen(false);
    setSearch('');
    setSelectedIndex(0);
  };

  return (
    <Dialog open={isCommandPaletteOpen} onOpenChange={setIsCommandPaletteOpen}>
      <DialogContent className="p-0 max-w-2xl bg-card border-primary/20">
        <div className="flex items-center border-b border-primary/10 px-3">
          <Command className="mr-2 h-4 w-4 shrink-0 opacity-50 text-primary" />
          <Input
            placeholder="Digite um comando ou busque..."
            value={search}
            autoFocus
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent h-12"
          />
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">ESC</span>
          </kbd>
        </div>
        <div className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
          {filteredCommands.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Nenhum comando encontrado.
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCommands.map((cmd, index) => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => handleSelect(cmd)}
                    className={cn(
                      "w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                      index === selectedIndex
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                        : "hover:bg-primary/10 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn("h-4 w-4", index === selectedIndex ? "text-primary-foreground" : "text-primary")} />
                      <span className="font-medium">{cmd.label}</span>
                    </div>
                    {index === selectedIndex && (
                      <span className="text-[10px] opacity-70 font-mono">ENTER</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="border-t border-primary/10 p-3 text-[10px] text-muted-foreground flex items-center justify-between bg-primary/5">
          <div className="flex items-center gap-2">
            Use <kbd className="hidden sm:inline-flex h-4 items-center gap-1 rounded border bg-muted px-1 font-mono font-medium">↑↓</kbd> para navegar
          </div>
          <div className="flex items-center gap-2">
            <kbd className="h-4 items-center gap-1 rounded border bg-muted px-1 font-mono font-medium">Enter</kbd> para selecionar
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
