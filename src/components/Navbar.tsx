import { Search, Sun, Moon, Code2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { PomodoroTimer } from './PomodoroTimer';
import { SidebarTrigger } from './ui/sidebar';

export const Navbar = () => {
  const { state, currentProject, setCurrentProject, theme, toggleTheme, searchQuery, setSearchQuery } = useApp();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center gap-4 px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex items-center gap-2">
          <Code2 className="h-6 w-6 text-primary" />
          <span className="hidden font-bold sm:inline-block">DevCenter</span>
        </div>

        <div className="flex flex-1 items-center gap-2 md:gap-4">
          <Select value={currentProject} onValueChange={setCurrentProject}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {state.projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PomodoroTimer />
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </header>
  );
};
