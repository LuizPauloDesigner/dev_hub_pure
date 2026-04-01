import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { storageService } from '@/services/storageService';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

export interface Project {
  id: string;
  name: string;
  color: string;
}

export interface Note {
  id: string;
  projectId: string;
  userId?: string;
  title: string;
  content: string;
  isFavorite: boolean;
  accessLevel?: 'private' | 'shared';
  createdAt: string;
  updatedAt: string;
}

export interface Prompt {
  id: string;
  projectId: string;
  userId?: string;
  title: string;
  content: string;
  notes: string;
  tags: string[];
  isFavorite: boolean;
  accessLevel?: 'private' | 'shared';
  createdAt: string;
}

export interface Snippet {
  id: string;
  projectId: string;
  userId?: string;
  title: string;
  code: string;
  language: string;
  tags: string[];
  isFavorite: boolean;
  accessLevel?: 'private' | 'shared';
  createdAt: string;
}

export interface CheatsheetItem {
  id: string;
  projectId: string;
  title: string;
  content: string;
  category: string;
  isFavorite: boolean;
}

export interface KanbanTask {
  id: string;
  projectId: string;
  userId?: string;
  goalId?: string;
  plannerDate?: string;
  priorityRank?: 'top1' | 'top2' | 'top3' | 'normal' | 'low' | 'high' | 'medium';
  title: string;
  description: string;
  column: 'todo' | 'inProgress' | 'done';
  recurrence?: 'daily' | 'weekly' | 'none';
  accessLevel?: 'private' | 'shared';
  completedAt?: string;
  createdAt: string;
}

export interface Password {
  id: string;
  projectId: string;
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
}

export interface Contact {
  id: string;
  projectId: string;
  nomeCompleto: string;
  telefones: string[];
  emails: string[];
  empresa: string;
  cargo: string;
  tags: string[];
  notas: string;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  texto: string;
  concluido: boolean;
}

export interface Checklist {
  id: string;
  projectId: string;
  titulo: string;
  itens: ChecklistItem[];
  createdAt: string;
}

export interface Bookmark {
  id: string;
  projectId: string;
  title: string;
  url: string;
  description: string;
  favicon?: string;
  category: string;
  createdAt: string;
}

export interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  moodScore?: number | null;
  projetoId?: string;
  origem?: string;
  dataHoraRegistro?: string;
}

export interface FinancialAccount {
  id: string;
  projectId: string;
  name: string;
  initialBalance: number;
  createdAt: string;
}

export interface FinancialCategory {
  id: string;
  projectId: string;
  name: string;
  type: 'income' | 'expense';
  createdAt: string;
}

export interface FinancialBudget {
  id: string;
  projectId: string;
  categoryId: string;
  limit: number;
  month: string;
}

export interface FinancialTransaction {
  id: string;
  projectId: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  accountId: string;
  recurrence: 'never' | 'monthly' | 'yearly';
  lastRecurrence?: string;
  createdAt: string;
}

export interface PomodoroStats {
  focusSessions: number;
  totalMinutes: number;
}

export interface WellnessBreakRecord {
  id: string;
  dataHora: string;
  tipoCiclo: 'short' | 'long';
  adesaoStatus: 'Concluida' | 'Pulada';
  duracaoPausa: number;
}

export interface WellnessStats {
  breaks: WellnessBreakRecord[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'achievement';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface GamificationStats {
  pontos: number;
  nivel: number;
  historico: Array<{
    id: string;
    tipo: string;
    pontos: number;
    descricao: string;
    timestamp: string;
  }>;
  badges: Badge[];
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
}

export interface WikiArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  lastUpdated: string;
  projectId?: string;
  isInternal: boolean;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string; // Blob URL for preview
  category: 'image' | 'document' | 'other';
  projectId?: string;
  createdAt: string;
  blob?: Blob; // For persistence in IndexedDB
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId?: string;
  details: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
  ipAddress?: string;
}

export interface Integration {
  id: string;
  provider: string;
  name: string;
  description: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'pending' | 'error';
  category: 'dev' | 'comm' | 'productivity' | 'cloud' | 'ai';
  lastSync?: string;
  config?: Record<string, any>;
  createdAt: string;
}

export interface BillingInfo {
  companyName: string;
  address: string;
  taxId: string;
  logoUrl: string;
  email: string;
  phone: string;
}

export interface ServiceCatalogItem {
  id: string;
  description: string;
  unitPrice: number;
  useIdealHourlyRate?: boolean;
  createdAt: string;
}

export interface BudgetItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Budget {
  id: string;
  projectId: string;
  clientId: string;
  items: BudgetItem[];
  subtotal: number;
  discount: number;
  total: number;
  terms: string;
  status: 'draft' | 'sent' | 'approved';
  createdAt: string;
  updatedAt: string;
}

export interface PricingData {
  fixedCosts: number;
  desiredSalary: number;
  taxesPercent: number;
  hoursPerDay: number;
  daysPerMonth: number;
  idealHourlyRate: number;
}

export interface StockMaterial {
  id: string;
  nomeMaterial: string;
  qtdEmbalagem: number;
  unidadeEmbalagem: string;
  precoPago: number;
  custoUnitario: number;
  createdAt: string;
}

export interface TechSheetItem {
  id: string;
  materialId: string;
  materialName: string;
  quantidadeUsada: number;
  unidade: string;
  custoUnitario: number;
  custoTotalItem: number;
}

export interface TechSheet {
  id: string;
  projectId: string;
  nomeProduto: string;
  rendimento: string;
  itens: TechSheetItem[];
  custoTotalProduto: number;
  custoPorUnidade: number;
  tempoProducao?: number;
  imagemProduto?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  projectId: string;
  title: string;
  description: string;
  category: string;
  targetDate: string;
  progress: number;
  status: 'pending' | 'inProgress' | 'done';
  createdAt: string;
  checklist?: { id: string; title: string; completed: boolean }[];
}

export interface Habit {
  id: string;
  projectId: string;
  title: string;
  frequency: 'daily' | 'weekly';
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  status: 'completed' | 'missed';
}

export interface PlannerDay {
  id: string;
  userId?: string;
  date: string;
  mood?: string;
  energyLevel?: string;
  notes?: string;
  dailyReflection?: string;
  createdAt: string;
}

export interface WheelOfLifeAssessment {
  id: string; // Ex: '2026-03' or uuid
  date: string;
  notes?: string;
  scores: {
    saudeFisica: number;
    saudeMental: number;
    carreira: number;
    financas: number;
    relacionamentos: number;
    desenvolvimento: number;
    lazer: number;
    ambienteFisico: number;
  };
}

export type EmotionType = 'Incrível' | 'Feliz' | 'Normal' | 'Triste' | 'Estressado' | 'Cansado';

export interface MoodPixel {
  id: string;         // YYYY-MM-DD
  date: string;       // YYYY-MM-DD
  colorCode: string;  
  emotion: EmotionType;
  shortNote?: string;
  createdAt: string;
}

export interface DreamBoardItem {
  id: string;
  title: string;
  category: string; // 'Viagens', 'Carreira', 'Bens Materiais', 'Experiências', 'Saúde'
  imageUrl: string; // url from unsplash or local
  createdAt: string;
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  createdAt: string;
  background?: string;
}

export interface BoardElement {
  id: string;
  boardId: string;
  type: 'note' | 'list' | 'image' | 'link' | 'column' | 'todo' | 'line' | 'board' | 'comment' | 'table' | 'map' | 'video' | 'audio' | 'sketch' | 'document' | 'heading' | 'code' | 'color';
  x: number;
  y: number;
  width?: number;
  height?: number;
  content: string; // JSON or plain text
  color?: string;
  zIndex?: number;
  parentId?: string; // For nesting or items inside columns
}

export interface BoardConnection {
  id: string;
  boardId: string;
  fromId: string;
  toId: string;
  label?: string;
  color?: string;
}

export interface AppState {
  projects: Project[];
  notes: Note[];
  prompts: Prompt[];
  snippets: Snippet[];
  cheatsheet: CheatsheetItem[];
  kanban: KanbanTask[];
  passwords: Password[];
  bookmarks: Bookmark[];
  diary: DiaryEntry[];
  draft: string;
  pomodoroStats: PomodoroStats;
  wellnessStats: WellnessStats;
  gamificationStats: GamificationStats;
  noteTemplates: string[];
  taskTemplates: Omit<KanbanTask, 'id' | 'projectId' | 'createdAt'>[];
  encryptedPasswords?: string;
  financialAccounts: FinancialAccount[];
  financialCategories: FinancialCategory[];
  financialBudgets: FinancialBudget[];
  financialTransactions: FinancialTransaction[];
  encryptedFinancial?: string;
  contacts: Contact[];
  contactTags: string[];
  encryptedContacts?: string;
  checklists: Checklist[];
  encryptedChecklists?: string;
  musicPlayerVolume: number;
  musicPlayerShuffle: boolean;
  musicPlayerRepeat: boolean;
  billingInfo: BillingInfo;
  serviceCatalog: ServiceCatalogItem[];
  budgets: Budget[];
  encryptedBudgets?: string;
  pricingData: PricingData;
  encryptedPricingData?: string;
  stockMaterials: StockMaterial[];
  encryptedStock?: string;
  techSheets: TechSheet[];
  encryptedTechSheets?: string;
  enabledModules: string[];
  notifications: AppNotification[];
  integrations: Integration[];
  wikiArticles: WikiArticle[];
  assets: Asset[];
  activityLogs: ActivityLog[];
  boards: Board[];
  boardElements: BoardElement[];
  goals: Goal[];
  habits: Habit[];
  habitLogs: HabitLog[];
  plannerDays: PlannerDay[];
  wheelOfLife: WheelOfLifeAssessment[];
  moodPixels: MoodPixel[];
  dreamBoard: DreamBoardItem[];
  boardConnections: BoardConnection[];
}

interface AppContextType {
  state: AppState;
  currentProject: string;
  setCurrentProject: (id: string) => void;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  addProject: (project: Omit<Project, 'id'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addPrompt: (prompt: Omit<Prompt, 'id' | 'createdAt'>) => void;
  updatePrompt: (id: string, updates: Partial<Prompt>) => void;
  deletePrompt: (id: string) => void;
  addSnippet: (snippet: Omit<Snippet, 'id' | 'createdAt'>) => void;
  updateSnippet: (id: string, updates: Partial<Snippet>) => void;
  deleteSnippet: (id: string) => void;
  addCheatsheetItem: (item: Omit<CheatsheetItem, 'id'>) => void;
  updateCheatsheetItem: (id: string, updates: Partial<CheatsheetItem>) => void;
  deleteCheatsheetItem: (id: string) => void;
  addKanbanTask: (task: Omit<KanbanTask, 'id' | 'createdAt'>) => void;
  updateKanbanTask: (id: string, updates: Partial<KanbanTask>) => void;
  deleteKanbanTask: (id: string) => void;
  addPassword: (password: Omit<Password, 'id'>) => void;
  updatePassword: (id: string, updates: Partial<Password>) => void;
  deletePassword: (id: string) => void;
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt'>) => void;
  updateBookmark: (id: string, updates: Partial<Bookmark>) => void;
  deleteBookmark: (id: string) => void;
  addDiaryEntry: (entry: Omit<DiaryEntry, 'id'>) => void;
  updateDiaryEntry: (date: string, content: string, moodScore?: number | null, projetoId?: string) => void;
  updateDraft: (content: string) => void;
  updatePomodoroStats: (stats: Partial<PomodoroStats>) => void;
  addWellnessBreak: (breakRecord: Omit<WellnessBreakRecord, 'id'>) => void;
  addGamificationPoints: (pontos: number, tipo: string, descricao: string) => void;
  unlockBadge: (badgeId: string) => void;
  updateFocusDurations: (focus: number, shortBreak: number, longBreak: number) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  addFinancialAccount: (account: Omit<FinancialAccount, 'id' | 'createdAt'>) => void;
  updateFinancialAccount: (id: string, updates: Partial<FinancialAccount>) => void;
  deleteFinancialAccount: (id: string) => void;
  addFinancialCategory: (category: Omit<FinancialCategory, 'id' | 'createdAt'>) => void;
  updateFinancialCategory: (id: string, updates: Partial<FinancialCategory>) => void;
  deleteFinancialCategory: (id: string) => void;
  addFinancialBudget: (budget: Omit<FinancialBudget, 'id'>) => void;
  updateFinancialBudget: (id: string, updates: Partial<FinancialBudget>) => void;
  deleteFinancialBudget: (id: string) => void;
  addFinancialTransaction: (transaction: Omit<FinancialTransaction, 'id' | 'createdAt'>) => void;
  updateFinancialTransaction: (id: string, updates: Partial<FinancialTransaction>) => void;
  deleteFinancialTransaction: (id: string) => void;
  setMusicPlayerVolume: (volume: number) => void;
  setMusicPlayerShuffle: (shuffle: boolean) => void;
  setMusicPlayerRepeat: (repeat: boolean) => void;
  addContact: (contact: Omit<Contact, 'id' | 'createdAt'>) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  addContactTag: (tag: string) => void;
  deleteContactTag: (tag: string) => void;
  addChecklist: (checklist: Omit<Checklist, 'id' | 'createdAt'>) => void;
  updateChecklist: (id: string, updates: Partial<Checklist>) => void;
  deleteChecklist: (id: string) => void;
  addChecklistItem: (checklistId: string, item: Omit<ChecklistItem, 'id'>) => void;
  updateChecklistItem: (checklistId: string, itemId: string, updates: Partial<ChecklistItem>) => void;
  deleteChecklistItem: (checklistId: string, itemId: string) => void;
  updateBillingInfo: (info: Partial<BillingInfo>) => void;
  addServiceCatalogItem: (item: Omit<ServiceCatalogItem, 'id' | 'createdAt'>) => void;
  updateServiceCatalogItem: (id: string, updates: Partial<ServiceCatalogItem>) => void;
  deleteServiceCatalogItem: (id: string) => void;
  addBudget: (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  updatePricingData: (data: PricingData) => void;
  addStockMaterial: (material: Omit<StockMaterial, 'id' | 'createdAt' | 'custoUnitario'>) => void;
  updateStockMaterial: (id: string, updates: Partial<StockMaterial>) => void;
  deleteStockMaterial: (id: string) => void;
  addTechSheet: (sheet: Omit<TechSheet, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTechSheet: (id: string, updates: Partial<TechSheet>) => void;
  deleteTechSheet: (id: string) => void;
  toggleModule: (moduleId: string) => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;
  toggleIntegration: (id: string) => void;
  updateIntegrationConfig: (id: string, config: Record<string, any>) => void;
  addWikiArticle: (article: Omit<WikiArticle, 'id' | 'lastUpdated'>) => void;
  updateWikiArticle: (article: WikiArticle) => void;
  deleteWikiArticle: (id: string) => void;
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt'>) => void;
  deleteAsset: (id: string) => void;
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'timestamp' | 'userId' | 'userName'>) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  addHabitLog: (log: Omit<HabitLog, 'id'>) => void;
  updateHabitLog: (id: string, updates: Partial<HabitLog>) => void;
  addPlannerDay: (day: Omit<PlannerDay, 'id' | 'createdAt'>) => void;
  updatePlannerDay: (id: string, updates: Partial<PlannerDay>) => void;
  addWheelOfLifeAssessment: (assessment: Omit<WheelOfLifeAssessment, 'id'>) => void;
  updateWheelOfLifeAssessment: (id: string, updates: Partial<WheelOfLifeAssessment>) => void;
  deleteWheelOfLifeAssessment: (id: string) => void;
  addMoodPixel: (pixel: Omit<MoodPixel, 'createdAt'>) => void;
  deleteMoodPixel: (id: string) => void;
  addDreamBoardItem: (item: Omit<DreamBoardItem, 'id' | 'createdAt'>) => void;
  updateDreamBoardItem: (id: string, updates: Partial<DreamBoardItem>) => void;
  deleteDreamBoardItem: (id: string) => void;
  addBoard: (board: Omit<Board, 'id' | 'createdAt'>) => string;
  updateBoard: (id: string, updates: Partial<Board>) => void;
  deleteBoard: (id: string) => void;
  addBoardElement: (element: Omit<BoardElement, 'id'>) => void;
  updateBoardElement: (id: string, updates: Partial<BoardElement>) => void;
  deleteBoardElement: (id: string) => void;
  addBoardConnection: (conn: Omit<BoardConnection, 'id'>) => void;
  deleteBoardConnection: (id: string) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AVAILABLE_BADGES: Badge[] = [
  { id: 'foco10', name: 'Focado', description: 'Completou 10 ciclos de foco', icon: 'Target' },
  { id: 'foco25', name: 'Concentrado', description: 'Completou 25 ciclos de foco', icon: 'Brain' },
  { id: 'foco50', name: 'Mestre do Foco', description: 'Completou 50 ciclos de foco', icon: 'Trophy' },
  { id: 'pausa10', name: 'Cuidadoso', description: 'Completou 10 pausas ativas', icon: 'Heart' },
  { id: 'pausa25', name: 'Bem-Estar', description: 'Completou 25 pausas ativas', icon: 'Smile' },
  { id: 'streak7', name: 'Consistente', description: '7 dias consecutivos com ciclos', icon: 'Zap' },
  { id: 'meditacao5', name: 'Zen', description: 'Completou 5 meditações', icon: 'Flower' },
  { id: 'nivel5', name: 'Evoluído', description: 'Alcançou nível 5', icon: 'Star' },
  { id: 'notes10', name: 'Escritor', description: 'Criou suas primeiras 10 notas', icon: 'FileText' },
  { id: 'tasks20', name: 'Executor', description: 'Concluiu 20 tarefas no Kanban', icon: 'Package' },
  { id: 'prompts5', name: 'Engenheiro de IA', description: 'Salvou 5 prompts úteis', icon: 'Lightbulb' },
  { id: 'snippets5', name: 'Dev Pro', description: 'Guardou 5 trechos de código', icon: 'Code' },
  { id: 'budget1', name: 'Economista', description: 'Criou seu primeiro orçamento', icon: 'DollarSign' },
  { id: 'diary5', name: 'Reflexivo', description: 'Escreveu 5 entradas no diário', icon: 'Book' },
];

const initialState: AppState = {
  projects: [{ id: 'default', name: 'Projeto Padrão', color: '#dc3545' }],
  notes: [],
  prompts: [],
  snippets: [],
  cheatsheet: [],
  kanban: [],
  passwords: [],
  bookmarks: [],
  diary: [],
  draft: '',
  pomodoroStats: { focusSessions: 0, totalMinutes: 0 },
  wellnessStats: { breaks: [] },
  gamificationStats: {
    pontos: 0,
    nivel: 1,
    historico: [],
    badges: [],
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
  },
  noteTemplates: [],
  taskTemplates: [],
  financialAccounts: [],
  financialCategories: [],
  financialBudgets: [],
  financialTransactions: [],
  contacts: [],
  contactTags: [],
  checklists: [],
  musicPlayerVolume: 0.7,
  musicPlayerShuffle: false,
  musicPlayerRepeat: false,
  billingInfo: {
    companyName: '',
    address: '',
    taxId: '',
    logoUrl: '',
    email: '',
    phone: '',
  },
  serviceCatalog: [],
  budgets: [],
  pricingData: {
    fixedCosts: 0,
    desiredSalary: 0,
    taxesPercent: 0,
    hoursPerDay: 8,
    daysPerMonth: 22,
    idealHourlyRate: 0,
  },
  stockMaterials: [],
  techSheets: [],
  enabledModules: ['dashboard', 'explorer', 'tutorial', 'wellness', 'musica', 'videos', 'favorites', 'notes', 'prompts', 'snippets', 'cheatsheet', 'kanban', 'checklists', 'passwords', 'contacts', 'orcamentos', 'precificador', 'estoque', 'fichatecnica', 'finance', 'diary', 'draft', 'settings', 'profile', 'billing', 'integrations', 'analytics', 'wiki', 'assets', 'activity', 'planner', 'boards'],
  notifications: [],
  integrations: [
    { id: 'github', provider: 'github', name: 'GitHub', description: 'Sincronize seus repositórios e gerencie issues diretamente do dashboard.', icon: 'Github', status: 'disconnected', category: 'dev', createdAt: new Date().toISOString() },
    { id: 'slack', provider: 'slack', name: 'Slack', description: 'Receba notificações e envie atualizações para seus canais de equipe.', icon: 'Slack', status: 'disconnected', category: 'comm', createdAt: new Date().toISOString() },
    { id: 'discord', provider: 'discord', name: 'Discord', description: 'Integração com webhooks e bots para monitoramento em tempo real.', icon: 'MessageSquare', status: 'disconnected', category: 'comm', createdAt: new Date().toISOString() },
    { id: 'gcalendar', provider: 'google', name: 'Google Calendar', description: 'Visualize seus compromissos e prazos integrados ao seu Kanban.', icon: 'Calendar', status: 'disconnected', category: 'productivity', createdAt: new Date().toISOString() },
    { id: 'openai', provider: 'openai', name: 'OpenAI (GPT-4)', description: 'Poder de IA para seus prompts, notas e geração automática de código.', icon: 'Zap', status: 'disconnected', category: 'ai', createdAt: new Date().toISOString() },
  ],
  wikiArticles: [],
  assets: [],
  activityLogs: [],
  boards: [],
  boardElements: [],
  boardConnections: [],
  goals: [],
  habits: [],
  habitLogs: [],
  plannerDays: [],
  wheelOfLife: [],
  moodPixels: [],
  dreamBoard: [],
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>(initialState);
  const [currentProject, setCurrentProjectState] = useState('default');
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCommandPaletteOpen, setIsCommandPaletteOpenState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Ref to track previous state for incremental diff
  const prevStateRef = useRef<AppState | null>(null);

  // ── Async Load from IndexedDB + Settings Store ──────────────────────────
  useEffect(() => {
    storageService.loadAll()
      .then((loaded) => {
        // Ensure new modules like 'videos' and 'planner' are added to the list for existing users
        const stateWithVideos = { ...loaded.state };
        if (stateWithVideos.enabledModules) {
          if (!stateWithVideos.enabledModules.includes('videos')) {
            stateWithVideos.enabledModules = [...stateWithVideos.enabledModules, 'videos'];
          }
          if (!stateWithVideos.enabledModules.includes('planner')) {
            stateWithVideos.enabledModules = [...stateWithVideos.enabledModules, 'planner'];
          }
          if (!stateWithVideos.enabledModules.includes('boards')) {
            stateWithVideos.enabledModules = [...stateWithVideos.enabledModules, 'boards'];
          }
        }

        if (stateWithVideos.notifications && stateWithVideos.notifications.length === 0) {
          stateWithVideos.notifications = [{
            id: 'welcome',
            title: 'Bem-vindo ao Pure Dev!',
            message: 'Seu Notification Hub está ativo. Aqui você receberá alertas de conquistas, lembretes de bem-estar e atualizações de sistema.',
            type: 'info',
            read: false,
            createdAt: new Date().toISOString()
          }];
        }

        setState(stateWithVideos);
        setCurrentProjectState(loaded.currentProject);
        const loadedTheme = (loaded.theme === 'light' ? 'light' : 'dark') as 'light' | 'dark';
        setTheme(loadedTheme);
        document.documentElement.classList.toggle('dark', loadedTheme === 'dark');
        prevStateRef.current = stateWithVideos;
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('[AppContext] Failed to load state:', err);
        setIsLoading(false);
      });
  }, []);

  // ── Plan Management & Cloud Sync ─────────────────────────────────────────
  useEffect(() => {
    if (user?.plan) {
      storageService.setPlan(user.plan);
    }
    if (user?.id) {
      storageService.syncFromCloud().catch(console.error);
    }
  }, [user?.plan, user?.id]);

  // ── Real-time Sync between Tabs ─────────────────────────────────────────
  useEffect(() => {
    storageService.onRemoteUpdate(() => {
      console.log('[AppContext] Remote update detected, reloading state...');
      storageService.loadAll().then((loaded) => {
        // Ensure boards is always enabled after reload
        const reloadedState = { ...loaded.state };
        if (!reloadedState.enabledModules.includes('boards')) {
          reloadedState.enabledModules = [...reloadedState.enabledModules, 'boards'];
        }

        setState(reloadedState);
        setCurrentProjectState(loaded.currentProject);

        const newTheme = loaded.theme === 'light' ? 'light' : 'dark';
        if (newTheme !== theme) {
          setTheme(newTheme);
          document.documentElement.classList.toggle('dark', newTheme === 'dark');
        }

        prevStateRef.current = loaded.state;
      });
    });
  }, [theme]);

  // ── Periodic & Focus Backend Sync ──────────────────────────────────────────
  useEffect(() => {
    if (user && state.enabledModules.length > 0) {
      storageService.syncFromCloud().catch(console.error);

      // Instantly sync when returning to the tab/browser
      const handleFocus = () => {
        if (document.visibilityState === 'visible') {
          storageService.syncFromCloud().catch(console.error);
        }
      };
      
      window.addEventListener('visibilitychange', handleFocus);
      window.addEventListener('focus', handleFocus);

      // Setup 5-minute background polling for external changes (like from other browser tabs)
      const interval = setInterval(() => {
        storageService.syncFromCloud().catch(console.error);
      }, 5 * 60 * 1000);
      
      return () => {
          clearInterval(interval);
          window.removeEventListener('visibilitychange', handleFocus);
          window.removeEventListener('focus', handleFocus);
      };
    }
  }, [user, state.enabledModules]);

  // ── Smart Incremental Save (diff by reference) ─────────────────────────
  useEffect(() => {
    if (isLoading) return;
    const prev = prevStateRef.current;
    if (!prev) {
      prevStateRef.current = state;
      return;
    }

    // Delegate diffing + debounced writes to storageService
    storageService.diffAndPersist(prev, state);
    prevStateRef.current = state;
  }, [state, isLoading]);

  // ── Achievement Tracker ──────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading) return;

    const checkAchievements = () => {
      // Pomodoro & Focus
      if (state.pomodoroStats.focusSessions >= 10) unlockBadge('foco10');
      if (state.pomodoroStats.focusSessions >= 25) unlockBadge('foco25');
      if (state.pomodoroStats.focusSessions >= 50) unlockBadge('foco50');

      // Wellness
      if (state.wellnessStats.breaks.length >= 10) unlockBadge('pausa10');
      if (state.wellnessStats.breaks.length >= 25) unlockBadge('pausa25');

      // Productivity
      if (state.notes.length >= 10) unlockBadge('notes10');
      if (state.kanban.filter(t => t.column === 'done').length >= 20) unlockBadge('tasks20');

      // Knowledge
      if (state.prompts.length >= 5) unlockBadge('prompts5');
      if (state.snippets.length >= 5) unlockBadge('snippets5');

      // System
      if (state.gamificationStats.nivel >= 5) unlockBadge('nivel5');
      if (state.diary.length >= 5) unlockBadge('diary5');
      if (state.budgets.length >= 1) unlockBadge('budget1');
    };

    const timer = setTimeout(checkAchievements, 2000); // Check shortly after state changes
    return () => clearTimeout(timer);
  }, [
    state.notes.length,
    state.kanban.length,
    state.pomodoroStats.focusSessions,
    state.wellnessStats.breaks.length,
    state.prompts.length,
    state.snippets.length,
    state.diary.length,
    state.budgets.length,
    state.gamificationStats.nivel,
    isLoading
  ]);

  // ── Persist currentProject changes ──────────────────────────────────────
  const setCurrentProject = useCallback((id: string) => {
    setCurrentProjectState(id);
    storageService.queueSettingsWrite({ currentProject: id });
  }, []);

  // ── Check for recurring tasks ───────────────────────────────────────────
  useEffect(() => {
    if (isLoading) return;

    const checkRecurringTasks = async () => {
      const today = new Date().toDateString();
      const settings = await storageService.getSettings(['lastRecurringCheck']);

      if (settings.lastRecurringCheck === today) return;

      const updatedTasks = [...state.kanban];
      let hasChanges = false;

      state.kanban.forEach(task => {
        if (task.column === 'done' && task.recurrence && task.recurrence !== 'none' && task.completedAt) {
          const completedDate = new Date(task.completedAt);
          const now = new Date();

          let shouldRecreate = false;
          if (task.recurrence === 'daily') {
            shouldRecreate = now.getDate() !== completedDate.getDate();
          } else if (task.recurrence === 'weekly') {
            const daysDiff = Math.floor((now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
            shouldRecreate = daysDiff >= 7;
          }

          if (shouldRecreate) {
            updatedTasks.push({
              ...task,
              id: `${task.id}-${Date.now()}`,
              column: 'todo',
              completedAt: undefined,
              createdAt: new Date().toISOString(),
            });
            hasChanges = true;
          }
        }
      });

      if (hasChanges) {
        setState(prev => ({ ...prev, kanban: updatedTasks }));
      }

      storageService.queueSettingsWrite({ lastRecurringCheck: today });
    };

    checkRecurringTasks();
  }, [isLoading]);

  // ── Check for recurring financial transactions ──────────────────────────
  useEffect(() => {
    if (isLoading) return;

    const checkRecurringTransactions = async () => {
      const today = new Date().toDateString();
      const settings = await storageService.getSettings(['lastFinancialRecurringCheck']);

      if (settings.lastFinancialRecurringCheck === today) return;

      const updatedTransactions = [...(state.financialTransactions || [])];
      let hasChanges = false;

      (state.financialTransactions || []).forEach(transaction => {
        if (transaction.recurrence !== 'never' && transaction.lastRecurrence) {
          const lastDate = new Date(transaction.lastRecurrence);
          const now = new Date();

          let shouldRecreate = false;
          if (transaction.recurrence === 'monthly') {
            const monthsDiff = (now.getFullYear() - lastDate.getFullYear()) * 12 +
              (now.getMonth() - lastDate.getMonth());
            shouldRecreate = monthsDiff >= 1;
          } else if (transaction.recurrence === 'yearly') {
            const yearsDiff = now.getFullYear() - lastDate.getFullYear();
            shouldRecreate = yearsDiff >= 1;
          }

          if (shouldRecreate) {
            updatedTransactions.push({
              ...transaction,
              id: `${transaction.id}-${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              lastRecurrence: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            });
            hasChanges = true;
          }
        }
      });

      if (hasChanges) {
        setState(prev => ({ ...prev, financialTransactions: updatedTransactions }));
      }

      storageService.queueSettingsWrite({ lastFinancialRecurringCheck: today });
    };

    checkRecurringTransactions();
  }, [isLoading]);

  // ── Theme toggle ────────────────────────────────────────────────────────
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
    storageService.queueSettingsWrite({ theme: newTheme });
  };

  // ── CRUD Operations (all unchanged, same API) ──────────────────────────

  const addProject = (project: Omit<Project, 'id'>) => {
    const newProject = { ...project, id: Date.now().toString() };
    setState(prev => ({ ...prev, projects: [...prev.projects, newProject] }));
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === id ? { ...p, ...updates } : p),
    }));
  };

  const deleteProject = (id: string) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== id),
    }));
  };

  const addNote = (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newNote: Note = {
      ...note,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, notes: [...prev.notes, newNote] }));
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setState(prev => ({
      ...prev,
      notes: prev.notes.map(n =>
        n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
      ),
    }));
  };

  const deleteNote = (id: string) => {
    setState(prev => ({ ...prev, notes: prev.notes.filter(n => n.id !== id) }));
  };

  const addPrompt = (prompt: Omit<Prompt, 'id' | 'createdAt'>) => {
    const newPrompt: Prompt = {
      ...prompt,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, prompts: [...prev.prompts, newPrompt] }));
  };

  const updatePrompt = (id: string, updates: Partial<Prompt>) => {
    setState(prev => ({
      ...prev,
      prompts: prev.prompts.map(p => p.id === id ? { ...p, ...updates } : p),
    }));
  };

  const deletePrompt = (id: string) => {
    setState(prev => ({ ...prev, prompts: prev.prompts.filter(p => p.id !== id) }));
  };

  const addSnippet = (snippet: Omit<Snippet, 'id' | 'createdAt'>) => {
    const newSnippet: Snippet = {
      ...snippet,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, snippets: [...prev.snippets, newSnippet] }));
  };

  const updateSnippet = (id: string, updates: Partial<Snippet>) => {
    setState(prev => ({
      ...prev,
      snippets: prev.snippets.map(s => s.id === id ? { ...s, ...updates } : s),
    }));
  };

  const deleteSnippet = (id: string) => {
    setState(prev => ({ ...prev, snippets: prev.snippets.filter(s => s.id !== id) }));
  };

  const addCheatsheetItem = (item: Omit<CheatsheetItem, 'id'>) => {
    const newItem: CheatsheetItem = { ...item, id: Date.now().toString() };
    setState(prev => ({ ...prev, cheatsheet: [...prev.cheatsheet, newItem] }));
  };

  const updateCheatsheetItem = (id: string, updates: Partial<CheatsheetItem>) => {
    setState(prev => ({
      ...prev,
      cheatsheet: prev.cheatsheet.map(item => item.id === id ? { ...item, ...updates } : item),
    }));
  };

  const deleteCheatsheetItem = (id: string) => {
    setState(prev => ({ ...prev, cheatsheet: prev.cheatsheet.filter(item => item.id !== id) }));
  };

  const addKanbanTask = (task: Omit<KanbanTask, 'id' | 'createdAt'>) => {
    const newTask: KanbanTask = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, kanban: [...prev.kanban, newTask] }));
  };

  const updateKanbanTask = (id: string, updates: Partial<KanbanTask>) => {
    setState(prev => ({
      ...prev,
      kanban: prev.kanban.map(task => task.id === id ? { ...task, ...updates } : task),
    }));
  };

  const deleteKanbanTask = (id: string) => {
    setState(prev => ({ ...prev, kanban: prev.kanban.filter(task => task.id !== id) }));
  };

  const addPassword = (password: Omit<Password, 'id'>) => {
    const newPassword: Password = { ...password, id: Date.now().toString() };
    setState(prev => ({ ...prev, passwords: [...prev.passwords, newPassword] }));
  };

  const updatePassword = (id: string, updates: Partial<Password>) => {
    setState(prev => ({
      ...prev,
      passwords: prev.passwords.map(p => p.id === id ? { ...p, ...updates } : p),
    }));
  };

  const deletePassword = (id: string) => {
    setState(prev => ({ ...prev, passwords: prev.passwords.filter(p => p.id !== id) }));
  };

  const addBookmark = (bookmark: Omit<Bookmark, 'id' | 'createdAt'>) => {
    const newBookmark: Bookmark = {
      ...bookmark,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, bookmarks: [...prev.bookmarks, newBookmark] }));
  };

  const updateBookmark = (id: string, updates: Partial<Bookmark>) => {
    setState(prev => ({
      ...prev,
      bookmarks: prev.bookmarks.map(b => b.id === id ? { ...b, ...updates } : b),
    }));
  };

  const deleteBookmark = (id: string) => {
    setState(prev => ({ ...prev, bookmarks: prev.bookmarks.filter(b => b.id !== id) }));
  };

  const addDiaryEntry = (entry: Omit<DiaryEntry, 'id'>) => {
    const newEntry: DiaryEntry = { ...entry, id: Date.now().toString() };
    setState(prev => ({ ...prev, diary: [...prev.diary, newEntry] }));
  };

  const updateDiaryEntry = (date: string, content: string, moodScore?: number | null, projetoId?: string) => {
    setState(prev => {
      const existing = prev.diary.find(e => e.date === date);
      const dataHoraRegistro = new Date().toISOString();

      if (existing) {
        return {
          ...prev,
          diary: prev.diary.map(e =>
            e.date === date
              ? {
                ...e,
                content,
                moodScore,
                projetoId,
                origem: 'Diario',
                dataHoraRegistro
              }
              : e
          ),
        };
      }
      return {
        ...prev,
        diary: [...prev.diary, {
          id: Date.now().toString(),
          date,
          content,
          moodScore,
          projetoId,
          origem: 'Diario',
          dataHoraRegistro
        }],
      };
    });
  };

  const updateDraft = (content: string) => {
    setState(prev => ({ ...prev, draft: content }));
  };

  const updatePomodoroStats = (stats: Partial<PomodoroStats>) => {
    setState(prev => ({
      ...prev,
      pomodoroStats: { ...prev.pomodoroStats, ...stats },
    }));
  };

  const addWellnessBreak = (breakRecord: Omit<WellnessBreakRecord, 'id'>) => {
    const newBreak: WellnessBreakRecord = {
      ...breakRecord,
      id: Date.now().toString(),
    };
    setState(prev => ({
      ...prev,
      wellnessStats: {
        ...prev.wellnessStats,
        breaks: [...prev.wellnessStats.breaks, newBreak],
      },
    }));
  };

  const addGamificationPoints = (pontos: number, tipo: string, descricao: string) => {
    setState(prev => {
      const novoHistorico = {
        id: Date.now().toString(),
        tipo,
        pontos,
        descricao,
        timestamp: new Date().toISOString(),
      };

      const novosPontos = prev.gamificationStats.pontos + pontos;
      const novoNivel = Math.floor(novosPontos / 150) + 1;

      return {
        ...prev,
        gamificationStats: {
          ...prev.gamificationStats,
          pontos: novosPontos,
          nivel: novoNivel,
          historico: [...prev.gamificationStats.historico, novoHistorico],
        },
      };
    });
  };

  const unlockBadge = (badgeId: string) => {
    setState(prev => {
      const badge = AVAILABLE_BADGES.find(b => b.id === badgeId);
      if (!badge || prev.gamificationStats.badges.some(b => b.id === badgeId)) {
        return prev;
      }

      toast.success(`Conquista desbloqueada: ${badge.name}`, {
        description: badge.description,
        position: 'top-center'
      });

      addNotification({
        title: 'Nova Conquista!',
        message: `Você desbloqueou o selo: ${badge.name}. ${badge.description}`,
        type: 'achievement'
      });

      return {
        ...prev,
        gamificationStats: {
          ...prev.gamificationStats,
          badges: [...prev.gamificationStats.badges, { ...badge, unlockedAt: new Date().toISOString() }],
        },
      };
    });
  };

  const updateFocusDurations = (focus: number, shortBreak: number, longBreak: number) => {
    setState(prev => ({
      ...prev,
      gamificationStats: {
        ...prev.gamificationStats,
        focusDuration: focus,
        shortBreakDuration: shortBreak,
        longBreakDuration: longBreak,
      },
    }));
  };

  const addFinancialAccount = (account: Omit<FinancialAccount, 'id' | 'createdAt'>) => {
    const newAccount: FinancialAccount = {
      ...account,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, financialAccounts: [...prev.financialAccounts, newAccount] }));
  };

  const updateFinancialAccount = (id: string, updates: Partial<FinancialAccount>) => {
    setState(prev => ({
      ...prev,
      financialAccounts: prev.financialAccounts.map(a => a.id === id ? { ...a, ...updates } : a),
    }));
  };

  const deleteFinancialAccount = (id: string) => {
    setState(prev => ({ ...prev, financialAccounts: prev.financialAccounts.filter(a => a.id !== id) }));
  };

  const addFinancialCategory = (category: Omit<FinancialCategory, 'id' | 'createdAt'>) => {
    const newCategory: FinancialCategory = {
      ...category,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, financialCategories: [...prev.financialCategories, newCategory] }));
  };

  const updateFinancialCategory = (id: string, updates: Partial<FinancialCategory>) => {
    setState(prev => ({
      ...prev,
      financialCategories: prev.financialCategories.map(c => c.id === id ? { ...c, ...updates } : c),
    }));
  };

  const deleteFinancialCategory = (id: string) => {
    setState(prev => ({ ...prev, financialCategories: prev.financialCategories.filter(c => c.id !== id) }));
  };

  const addFinancialBudget = (budget: Omit<FinancialBudget, 'id'>) => {
    const newBudget: FinancialBudget = { ...budget, id: Date.now().toString() };
    setState(prev => ({ ...prev, financialBudgets: [...prev.financialBudgets, newBudget] }));
  };

  const updateFinancialBudget = (id: string, updates: Partial<FinancialBudget>) => {
    setState(prev => ({
      ...prev,
      financialBudgets: prev.financialBudgets.map(b => b.id === id ? { ...b, ...updates } : b),
    }));
  };

  const deleteFinancialBudget = (id: string) => {
    setState(prev => ({ ...prev, financialBudgets: prev.financialBudgets.filter(b => b.id !== id) }));
  };

  const addFinancialTransaction = (transaction: Omit<FinancialTransaction, 'id' | 'createdAt'>) => {
    const newTransaction: FinancialTransaction = {
      ...transaction,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, financialTransactions: [...prev.financialTransactions, newTransaction] }));
  };

  const updateFinancialTransaction = (id: string, updates: Partial<FinancialTransaction>) => {
    setState(prev => ({
      ...prev,
      financialTransactions: prev.financialTransactions.map(t => t.id === id ? { ...t, ...updates } : t),
    }));
  };

  const deleteFinancialTransaction = (id: string) => {
    setState(prev => ({ ...prev, financialTransactions: prev.financialTransactions.filter(t => t.id !== id) }));
  };

  const setMusicPlayerVolume = (volume: number) => {
    setState(prev => ({ ...prev, musicPlayerVolume: volume }));
  };

  const setMusicPlayerShuffle = (shuffle: boolean) => {
    setState(prev => ({ ...prev, musicPlayerShuffle: shuffle }));
  };

  const setMusicPlayerRepeat = (repeat: boolean) => {
    setState(prev => ({ ...prev, musicPlayerRepeat: repeat }));
  };

  const addContact = (contact: Omit<Contact, 'id' | 'createdAt'>) => {
    const newContact: Contact = {
      ...contact,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, contacts: [...prev.contacts, newContact] }));
  };

  const updateContact = (id: string, updates: Partial<Contact>) => {
    setState(prev => ({
      ...prev,
      contacts: prev.contacts.map(c => c.id === id ? { ...c, ...updates } : c),
    }));
  };

  const deleteContact = (id: string) => {
    setState(prev => ({ ...prev, contacts: prev.contacts.filter(c => c.id !== id) }));
  };

  const addContactTag = (tag: string) => {
    setState(prev => ({
      ...prev,
      contactTags: [...prev.contactTags, tag],
    }));
  };

  const deleteContactTag = (tag: string) => {
    setState(prev => ({
      ...prev,
      contactTags: prev.contactTags.filter(t => t !== tag),
    }));
  };

  const addChecklist = (checklist: Omit<Checklist, 'id' | 'createdAt'>) => {
    const newChecklist: Checklist = {
      ...checklist,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, checklists: [...prev.checklists, newChecklist] }));
  };

  const updateChecklist = (id: string, updates: Partial<Checklist>) => {
    setState(prev => ({
      ...prev,
      checklists: prev.checklists.map(c => c.id === id ? { ...c, ...updates } : c),
    }));
  };

  const deleteChecklist = (id: string) => {
    setState(prev => ({ ...prev, checklists: prev.checklists.filter(c => c.id !== id) }));
  };

  const addChecklistItem = (checklistId: string, item: Omit<ChecklistItem, 'id'>) => {
    setState(prev => ({
      ...prev,
      checklists: prev.checklists.map(checklist =>
        checklist.id === checklistId
          ? {
            ...checklist,
            itens: [...checklist.itens, { ...item, id: Date.now().toString() }]
          }
          : checklist
      ),
    }));
  };

  const updateChecklistItem = (checklistId: string, itemId: string, updates: Partial<ChecklistItem>) => {
    setState(prev => ({
      ...prev,
      checklists: prev.checklists.map(checklist =>
        checklist.id === checklistId
          ? {
            ...checklist,
            itens: checklist.itens.map(item =>
              item.id === itemId ? { ...item, ...updates } : item
            )
          }
          : checklist
      ),
    }));
  };

  const deleteChecklistItem = (checklistId: string, itemId: string) => {
    setState(prev => ({
      ...prev,
      checklists: prev.checklists.map(checklist =>
        checklist.id === checklistId
          ? {
            ...checklist,
            itens: checklist.itens.filter(item => item.id !== itemId)
          }
          : checklist
      ),
    }));
  };

  const updateBillingInfo = (info: Partial<BillingInfo>) => {
    setState(prev => ({
      ...prev,
      billingInfo: { ...prev.billingInfo, ...info }
    }));
  };

  const addServiceCatalogItem = (item: Omit<ServiceCatalogItem, 'id' | 'createdAt'>) => {
    setState(prev => ({
      ...prev,
      serviceCatalog: [...prev.serviceCatalog, {
        ...item,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      }],
    }));
  };

  const updateServiceCatalogItem = (id: string, updates: Partial<ServiceCatalogItem>) => {
    setState(prev => ({
      ...prev,
      serviceCatalog: prev.serviceCatalog.map(item =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  };

  const deleteServiceCatalogItem = (id: string) => {
    setState(prev => ({
      ...prev,
      serviceCatalog: prev.serviceCatalog.filter(item => item.id !== id),
    }));
  };

  const addBudget = (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    setState(prev => ({
      ...prev,
      budgets: [...prev.budgets, {
        ...budget,
        id: Date.now().toString(),
        createdAt: now,
        updatedAt: now,
      }],
    }));
  };

  const updateBudget = (id: string, updates: Partial<Budget>) => {
    setState(prev => ({
      ...prev,
      budgets: prev.budgets.map(budget =>
        budget.id === id ? { ...budget, ...updates, updatedAt: new Date().toISOString() } : budget
      ),
    }));
  };

  const deleteBudget = (id: string) => {
    setState(prev => ({
      ...prev,
      budgets: prev.budgets.filter(budget => budget.id !== id),
    }));
  };

  const updatePricingData = (data: PricingData) => {
    setState(prev => ({
      ...prev,
      pricingData: data,
    }));
  };

  const addStockMaterial = (material: Omit<StockMaterial, 'id' | 'createdAt' | 'custoUnitario'>) => {
    const custoUnitario = material.precoPago / material.qtdEmbalagem;
    setState(prev => ({
      ...prev,
      stockMaterials: [...prev.stockMaterials, {
        ...material,
        id: Date.now().toString(),
        custoUnitario,
        createdAt: new Date().toISOString(),
      }],
    }));
  };

  const updateStockMaterial = (id: string, updates: Partial<StockMaterial>) => {
    setState(prev => ({
      ...prev,
      stockMaterials: prev.stockMaterials.map(material => {
        if (material.id === id) {
          const updated = { ...material, ...updates };
          if (updates.precoPago !== undefined || updates.qtdEmbalagem !== undefined) {
            updated.custoUnitario = updated.precoPago / updated.qtdEmbalagem;
          }
          return updated;
        }
        return material;
      }),
    }));
  };

  const deleteStockMaterial = (id: string) => {
    setState(prev => ({
      ...prev,
      stockMaterials: prev.stockMaterials.filter(material => material.id !== id),
    }));
  };

  const addTechSheet = (sheet: Omit<TechSheet, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    setState(prev => ({
      ...prev,
      techSheets: [...prev.techSheets, {
        ...sheet,
        id: Date.now().toString(),
        createdAt: now,
        updatedAt: now,
      }],
    }));
  };

  const updateTechSheet = (id: string, updates: Partial<TechSheet>) => {
    setState(prev => ({
      ...prev,
      techSheets: prev.techSheets.map(sheet =>
        sheet.id === id ? { ...sheet, ...updates, updatedAt: new Date().toISOString() } : sheet
      ),
    }));
  };

  const deleteTechSheet = (id: string) => {
    setState(prev => ({
      ...prev,
      techSheets: prev.techSheets.filter(sheet => sheet.id !== id),
    }));
  };

  const toggleModule = (moduleId: string) => {
    setState(prev => {
      const isEnabled = prev.enabledModules.includes(moduleId);
      return {
        ...prev,
        enabledModules: isEnabled
          ? prev.enabledModules.filter(id => id !== moduleId)
          : [...prev.enabledModules, moduleId],
      };
    });
  };

  const addNotification = (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: AppNotification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      read: false,
    };
    setState(prev => ({
      ...prev,
      notifications: [newNotification, ...prev.notifications].slice(0, 50),
    }));
  };

  const markNotificationAsRead = (id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n),
    }));
  };

  const markAllNotificationsAsRead = () => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, read: true })),
    }));
  };

  const deleteNotification = (id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id),
    }));
  };

  const toggleIntegration = (id: string) => {
    setState(prev => ({
      ...prev,
      integrations: prev.integrations.map(i => {
        if (i.id === id) {
          const newStatus = i.status === 'connected' ? 'disconnected' : 'connected';
          if (newStatus === 'connected') {
            addNotification({
              title: 'Integração Ativada',
              message: `A integração com ${i.name} foi estabelecida com sucesso!`,
              type: 'success'
            });
          }
          return { ...i, status: newStatus as any, lastSync: newStatus === 'connected' ? new Date().toISOString() : i.lastSync };
        }
        return i;
      }),
    }));
  };

  const updateIntegrationConfig = (id: string, config: Record<string, any>) => {
    setState(prev => ({
      ...prev,
      integrations: prev.integrations.map(i => i.id === id ? { ...i, config } : i),
    }));
  };

  const addWikiArticle = (article: Omit<WikiArticle, 'id' | 'lastUpdated'>) => {
    setState(prev => ({
      ...prev,
      wikiArticles: [...prev.wikiArticles, {
        ...article,
        id: Date.now().toString(),
        lastUpdated: new Date().toISOString()
      }]
    }));
  };

  const updateWikiArticle = (article: WikiArticle) => {
    setState(prev => ({
      ...prev,
      wikiArticles: prev.wikiArticles.map(a => a.id === article.id ? { ...article, lastUpdated: new Date().toISOString() } : a)
    }));
  };

  const deleteWikiArticle = (id: string) => {
    setState(prev => ({
      ...prev,
      wikiArticles: prev.wikiArticles.filter(a => a.id !== id)
    }));
  };

  const addAsset = (asset: Omit<Asset, 'id' | 'createdAt'>) => {
    setState(prev => ({
      ...prev,
      assets: [...prev.assets, {
        ...asset,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      }]
    }));
  };

  const deleteAsset = (id: string) => {
    setState(prev => ({
      ...prev,
      assets: prev.assets.filter(a => a.id !== id)
    }));
  };

  const addActivityLog = (log: Omit<ActivityLog, 'id' | 'timestamp' | 'userId' | 'userName'>) => {
    setState(prev => ({
      ...prev,
      activityLogs: [
        {
          ...log,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          userId: user?.id || 'system',
          userName: user?.name || 'Sistema'
        },
        ...prev.activityLogs
      ].slice(0, 500) // Keep last 500 logs
    }));
  };

  const addGoal = (goal: Omit<Goal, 'id' | 'createdAt'>) => {
    setState(prev => ({ ...prev, goals: [{ ...goal, id: Date.now().toString(), createdAt: new Date().toISOString() }, ...prev.goals] }));
  };
  const updateGoal = (id: string, updates: Partial<Goal>) => {
    setState(prev => ({ ...prev, goals: prev.goals.map(g => g.id === id ? { ...g, ...updates } : g) }));
  };
  const deleteGoal = (id: string) => {
    setState(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }));
  };

  const addHabit = (habit: Omit<Habit, 'id' | 'createdAt'>) => {
    setState(prev => ({ ...prev, habits: [{ ...habit, id: Date.now().toString(), createdAt: new Date().toISOString() }, ...prev.habits] }));
  };
  const updateHabit = (id: string, updates: Partial<Habit>) => {
    setState(prev => ({ ...prev, habits: prev.habits.map(h => h.id === id ? { ...h, ...updates } : h) }));
  };
  const deleteHabit = (id: string) => {
    setState(prev => ({ ...prev, habits: prev.habits.filter(h => h.id !== id) }));
  };

  const addHabitLog = (log: Omit<HabitLog, 'id'>) => {
    setState(prev => ({ ...prev, habitLogs: [{ ...log, id: Date.now().toString() }, ...prev.habitLogs] }));
  };
  const updateHabitLog = (id: string, updates: Partial<HabitLog>) => {
    setState(prev => ({ ...prev, habitLogs: prev.habitLogs.map(l => l.id === id ? { ...l, ...updates } : l) }));
  };

  const addPlannerDay = (day: Omit<PlannerDay, 'id' | 'createdAt'>) => {
    setState(prev => ({ ...prev, plannerDays: [{ ...day, id: Date.now().toString(), createdAt: new Date().toISOString() }, ...prev.plannerDays] }));
  };
  const updatePlannerDay = (id: string, updates: Partial<PlannerDay>) => {
    setState(prev => ({ ...prev, plannerDays: prev.plannerDays.map(d => d.id === id ? { ...d, ...updates } : d) }));
  };

  const addWheelOfLifeAssessment = (assessment: Omit<WheelOfLifeAssessment, 'id'>) => {
    setState(prev => ({ ...prev, wheelOfLife: [{ ...assessment, id: Date.now().toString() }, ...prev.wheelOfLife] }));
  };
  const updateWheelOfLifeAssessment = (id: string, updates: Partial<WheelOfLifeAssessment>) => {
    setState(prev => ({ ...prev, wheelOfLife: prev.wheelOfLife.map(w => w.id === id ? { ...w, ...updates } : w) }));
  };
  const deleteWheelOfLifeAssessment = (id: string) => {
    setState(prev => ({ ...prev, wheelOfLife: prev.wheelOfLife.filter(w => w.id !== id) }));
  };

  const addMoodPixel = (pixel: Omit<MoodPixel, 'createdAt'>) => {
    const newPixel = { ...pixel, createdAt: new Date().toISOString() };
    setState(prev => {
      // Overwrite if same date/id exists
      const existing = prev.moodPixels.filter(p => p.id !== pixel.id);
      return { ...prev, moodPixels: [...existing, newPixel] };
    });
  };

  const deleteMoodPixel = (id: string) => {
    setState(prev => ({ ...prev, moodPixels: prev.moodPixels.filter(p => p.id !== id) }));
  };

  const addDreamBoardItem = (item: Omit<DreamBoardItem, 'id' | 'createdAt'>) => {
    const newItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, dreamBoard: [newItem, ...prev.dreamBoard] }));
  };

  const updateDreamBoardItem = (id: string, updates: Partial<DreamBoardItem>) => {
    setState(prev => ({
      ...prev,
      dreamBoard: prev.dreamBoard.map(d => d.id === id ? { ...d, ...updates } : d)
    }));
  };

  const deleteDreamBoardItem = (id: string) => {
    setState(prev => ({ ...prev, dreamBoard: prev.dreamBoard.filter(d => d.id !== id) }));
  };

  const addBoard = (board: Omit<Board, 'id' | 'createdAt'>) => {
    const newBoard = { ...board, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setState(prev => ({ ...prev, boards: [newBoard, ...prev.boards] }));
    return newBoard.id;
  };

  const updateBoard = (id: string, updates: Partial<Board>) => {
    setState(prev => ({ ...prev, boards: prev.boards.map(b => b.id === id ? { ...b, ...updates } : b) }));
  };

  const deleteBoard = (id: string) => {
    setState(prev => ({ 
      ...prev, 
      boards: prev.boards.filter(b => b.id !== id),
      boardElements: prev.boardElements.filter(e => e.boardId !== id)
    }));
  };

  const addBoardElement = (element: Omit<BoardElement, 'id'>) => {
    const newElement = { ...element, id: crypto.randomUUID() };
    setState(prev => ({ ...prev, boardElements: [...prev.boardElements, newElement] }));
  };

  const updateBoardElement = (id: string, updates: Partial<BoardElement>) => {
    setState(prev => ({ ...prev, boardElements: prev.boardElements.map(e => e.id === id ? { ...e, ...updates } : e) }));
  };

  const deleteBoardElement = (id: string) => {
    setState(prev => ({ 
      ...prev, 
      boardElements: prev.boardElements.filter(e => e.id !== id),
      boardConnections: prev.boardConnections.filter(c => c.fromId !== id && c.toId !== id)
    }));
  };

  const addBoardConnection = (conn: Omit<BoardConnection, 'id'>) => {
    const newConn = { ...conn, id: crypto.randomUUID() };
    setState(prev => ({ ...prev, boardConnections: [...prev.boardConnections, newConn] }));
  };

  const deleteBoardConnection = (id: string) => {
    setState(prev => ({ ...prev, boardConnections: prev.boardConnections.filter(c => c.id !== id) }));
  };

  // ── Memoized Context Value ──────────────────────────────────────────────
  const contextValue = useMemo(() => ({
    state,
    currentProject,
    setCurrentProject,
    currentTab,
    setCurrentTab,
    theme,
    toggleTheme,
    addProject,
    updateProject,
    deleteProject,
    addNote,
    updateNote,
    deleteNote,
    addPrompt,
    updatePrompt,
    deletePrompt,
    addSnippet,
    updateSnippet,
    deleteSnippet,
    addCheatsheetItem,
    updateCheatsheetItem,
    deleteCheatsheetItem,
    addKanbanTask,
    updateKanbanTask,
    deleteKanbanTask,
    addPassword,
    updatePassword,
    deletePassword,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    addDiaryEntry,
    updateDiaryEntry,
    updateDraft,
    updatePomodoroStats,
    addWellnessBreak,
    addGamificationPoints,
    unlockBadge,
    updateFocusDurations,
    searchQuery,
    setSearchQuery,
    addFinancialAccount,
    updateFinancialAccount,
    deleteFinancialAccount,
    addFinancialCategory,
    updateFinancialCategory,
    deleteFinancialCategory,
    addFinancialBudget,
    updateFinancialBudget,
    deleteFinancialBudget,
    addFinancialTransaction,
    updateFinancialTransaction,
    deleteFinancialTransaction,
    setMusicPlayerVolume,
    setMusicPlayerShuffle,
    setMusicPlayerRepeat,
    addContact,
    updateContact,
    deleteContact,
    addContactTag,
    deleteContactTag,
    addChecklist,
    updateChecklist,
    deleteChecklist,
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    updateBillingInfo,
    addServiceCatalogItem,
    updateServiceCatalogItem,
    deleteServiceCatalogItem,
    addBudget,
    updateBudget,
    deleteBudget,
    updatePricingData,
    addStockMaterial,
    updateStockMaterial,
    deleteStockMaterial,
    addTechSheet,
    updateTechSheet,
    deleteTechSheet,
    toggleModule,
    toggleIntegration,
    updateIntegrationConfig,
    addWikiArticle,
    updateWikiArticle,
    deleteWikiArticle,
    addAsset,
    deleteAsset,
    addActivityLog,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen: setIsCommandPaletteOpenState,
    addGoal, updateGoal, deleteGoal,
    addHabit, updateHabit, deleteHabit,
    addHabitLog, updateHabitLog,
    addPlannerDay, updatePlannerDay,
    addWheelOfLifeAssessment, updateWheelOfLifeAssessment, deleteWheelOfLifeAssessment,
    addMoodPixel, deleteMoodPixel,
    addDreamBoardItem, updateDreamBoardItem, deleteDreamBoardItem,
    addBoard, updateBoard, deleteBoard,
    addBoardElement, updateBoardElement, deleteBoardElement,
    addBoardConnection, deleteBoardConnection,
    isLoading
  }), [state, currentProject, currentTab, theme, searchQuery, isCommandPaletteOpen, isLoading]);

  // ── Loading State ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground text-sm">Carregando dados...</div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
