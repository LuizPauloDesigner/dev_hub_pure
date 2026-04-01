import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ExtensionNavbar } from '@/components/ExtensionNavbar';
import { MusicPlayerBar } from '@/components/MusicPlayerBar';
import { CommandPalette } from '@/components/CommandPalette';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import React, { memo, useEffect, useState } from 'react';
import { DailyVerse } from '@/components/DailyVerse';

// Direct imports for instant loading
import { Dashboard } from '@/components/Dashboard';
import { Notes } from '@/components/Notes';
import { Prompts } from '@/components/Prompts';
import { Snippets } from '@/components/Snippets';
import { Cheatsheet } from '@/components/Cheatsheet';
import { Kanban } from '@/components/Kanban';
import { Passwords } from '@/components/Passwords';
import { Contacts } from '@/components/Contacts';
import { Checklists } from '@/components/Checklists';
import { Finance } from '@/components/Finance';
import { Diary } from '@/components/Diary';
import { Draft } from '@/components/Draft';
import { Favorites } from '@/components/Favorites';
import { Wellness } from '@/components/Wellness';
import { Settings } from '@/components/Settings';
import { MusicPlayer } from '@/components/MusicPlayer';
import { Budgets } from '@/components/Budgets';
import { Pricing } from '@/components/Pricing';
import { Stock } from '@/components/Stock';
import { TechSheet } from '@/components/TechSheet';
import Tutorial from '@/components/Tutorial';
import { VideoPlayer } from '@/components/VideoPlayer';
import { UserProfile } from '@/components/UserProfile';
import { Billing } from '@/components/Billing';
import { ProjectExplorer } from '@/components/ProjectExplorer';
import { Integrations } from '@/components/Integrations';
import { Analytics } from '@/components/Analytics';
import { Wiki } from '@/components/Wiki';
import { AssetManager } from '@/components/AssetManager';
import { ActivityLog } from '@/components/ActivityLog';
import { Planner } from '@/components/Planner';
import { Boards } from '@/components/Boards';

// Component map for cleaner rendering
const COMPONENT_MAP: Record<string, React.ComponentType> = {
  dashboard: Dashboard,
  planner: Planner,
  explorer: ProjectExplorer,
  tutorial: Tutorial,
  favorites: Favorites,
  notes: Notes,
  prompts: Prompts,
  snippets: Snippets,
  cheatsheet: Cheatsheet,
  kanban: Kanban,
  checklists: Checklists,
  passwords: Passwords,
  contacts: Contacts,
  orcamentos: Budgets,
  precificador: Pricing,
  estoque: Stock,
  fichatecnica: TechSheet,
  finance: Finance,
  diary: Diary,
  wellness: Wellness,
  musica: MusicPlayer,
  videos: VideoPlayer,
  draft: Draft,
  settings: Settings,
  profile: UserProfile,
  billing: Billing,
  integrations: Integrations,
  analytics: Analytics,
  wiki: Wiki,
  assets: AssetManager,
  activity: ActivityLog,
  boards: Boards,
};

const MainContent = memo(() => {
  const { currentTab, state, setCurrentTab, isLoading } = useApp();

  // Redirect to dashboard if module is disabled
  useEffect(() => {
    if (!isLoading && !state.enabledModules.includes(currentTab)) {
      setCurrentTab('dashboard');
    }
  }, [currentTab, state.enabledModules, setCurrentTab, isLoading]);

  const Component = COMPONENT_MAP[currentTab] || Dashboard;
 
  if (currentTab === 'boards') {
    return (
      <main className="flex-1 h-[calc(100vh-140px)] overflow-hidden">
        <Component />
      </main>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <main className="p-4 md:p-6 extension-content max-w-7xl mx-auto">
        <Component />
      </main>
    </ScrollArea>
  );
});
MainContent.displayName = 'MainContent';

const Index = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isPlayerVisible, setIsPlayerVisible] = useState(() => {
    const saved = localStorage.getItem('mini-player-visible');
    return saved !== 'false';
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    const checkVisibility = () => {
      const saved = localStorage.getItem('mini-player-visible');
      setIsPlayerVisible(saved !== 'false');
    };

    window.addEventListener('storage', checkVisibility);

    return () => {
      window.removeEventListener('storage', checkVisibility);
    };
  }, []);

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden extension-container">
      {/* Mini Player */}
      {isPlayerVisible && <MusicPlayerBar />}

      {/* Daily Verse */}
      <DailyVerse />

      {/* Extension Navbar */}
      <ExtensionNavbar />

      {/* Main Content */}
      <MainContent />

      {/* Command Palette */}
      <CommandPalette />
    </div>
  );
};

export default Index;
