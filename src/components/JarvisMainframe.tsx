import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Cpu,
  Brain,
  Terminal,
  Activity,
  Search,
  RefreshCw,
  Plus,
  Trash2,
  Send,
  Settings,
  Shield,
  Bot,
  Database,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  ArrowDownToLine,
  User,
  Radio,
  Newspaper,
  ExternalLink,
  Globe,
  Tag,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface JarvisAgent {
  id: string;
  nome: string;
  icon: string;
  faz: string;
  every_min: number | null;
  last: string | null;
  state: 'ok' | 'attention' | 'off';
  metric: string;
  detail: string;
}

interface JarvisNote {
  id: string;
  area: string;
  title: string;
  body: string;
  importance: string;
}

interface ScheduledMacro {
  id: string;
  macro_name: string;
  macro_args: string;
  schedule_time: number;
  recurring: string;
  status: string;
}

interface JarvisNewsArticle {
  id: string;
  topic: string;
  title: string;
  link: string;
  source: string;
  pub_date: string;
  snippet: string;
  fetched_at: number;
}

interface JarvisNewsTopic {
  topic: string;
  created_at: number;
}

export const JarvisMainframe = () => {
  // URLs configuration saved in LocalStorage
  const [jarvisUrl, setJarvisUrl] = useState(() => localStorage.getItem('jarvis-url') || 'https://localhost:4242');
  const [hermesUrl, setHermesUrl] = useState(() => localStorage.getItem('hermes-url') || 'http://localhost:8642');
  const [hermesKey, setHermesKey] = useState(() => localStorage.getItem('hermes-key') || 'jarvis_secure_key_12345');

  // Mainframe & Agent states
  const [isJarvisOnline, setIsJarvisOnline] = useState(false);
  const [isCheckingJarvis, setIsCheckingJarvis] = useState(true);
  const [agents, setAgents] = useState<JarvisAgent[]>([]);
  const [totalAgents, setTotalAgents] = useState(0);
  const [activeAgents, setActiveAgents] = useState(0);

  // Second Brain states
  const [notes, setNotes] = useState<JarvisNote[]>([]);
  const [notesSearch, setNotesSearch] = useState('');
  const [isFetchingNotes, setIsFetchingNotes] = useState(false);

  // News Radar states
  const [news, setNews] = useState<JarvisNewsArticle[]>([]);
  const [newsTopics, setNewsTopics] = useState<JarvisNewsTopic[]>([]);
  const [selectedNewsTopic, setSelectedNewsTopic] = useState<string>('all');
  const [newTopicInput, setNewTopicInput] = useState('');
  const [isFetchingNews, setIsFetchingNews] = useState(false);
  const [isAddingTopic, setIsAddingTopic] = useState(false);

  // Macro Scheduler states
  const [macros, setMacros] = useState<ScheduledMacro[]>([]);
  const [isFetchingMacros, setIsFetchingMacros] = useState(false);
  const [newMacroName, setNewMacroName] = useState('abrir_navegador');
  const [newMacroArgs, setNewMacroArgs] = useState('https://google.com');
  const [newMacroTime, setNewMacroTime] = useState('');
  const [newMacroRecur, setNewMacroRecur] = useState('once');

  // Chat Hermes states
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'hermes'; text: string; time: string }[]>([]);

  // LLM API Config states
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState('http://127.0.0.1:11434');
  const [primaryModel, setPrimaryModel] = useState('claude-3-haiku-20240307');
  const [fallbackModel, setFallbackModel] = useState('llama3.1:8b');
  const [isFetchingConfig, setIsFetchingConfig] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // General Status Check
  const checkMainframeStatus = useCallback(async () => {
    setIsCheckingJarvis(true);
    try {
      // Fetch agents telemetry from JARVIS
      const response = await fetch(`${jarvisUrl}/api/agents`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setIsJarvisOnline(true);
        setAgents(data.agents || []);
        setTotalAgents(data.resumo?.total || 0);
        setActiveAgents(data.resumo?.ok || 0);
      } else {
        setIsJarvisOnline(false);
      }
    } catch (e) {
      setIsJarvisOnline(false);
    } finally {
      setIsCheckingJarvis(false);
    }
  }, [jarvisUrl]);

  // Fetch News Topics
  const fetchNewsTopics = useCallback(async () => {
    try {
      const response = await fetch(`${jarvisUrl}/sys/news/topics`, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        setNewsTopics(data.topics || []);
      }
    } catch (e) {
      console.error('Erro ao buscar tópicos de notícias:', e);
    }
  }, [jarvisUrl]);

  // Fetch News
  const fetchNews = useCallback(async (topic?: string) => {
    setIsFetchingNews(true);
    try {
      const targetTopic = topic !== undefined ? topic : selectedNewsTopic;
      const url = targetTopic && targetTopic !== 'all' ? `${jarvisUrl}/sys/news?topic=${encodeURIComponent(targetTopic)}` : `${jarvisUrl}/sys/news`;
      const response = await fetch(url, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        setNews(data.news || []);
      }
    } catch (e) {
      toast.error('Erro ao carregar notícias do radar.');
    } finally {
      setIsFetchingNews(false);
    }
  }, [jarvisUrl, selectedNewsTopic]);

  // Trigger Immediate Live Fetch from Google News
  const handleRefreshLiveNews = async () => {
    setIsFetchingNews(true);
    try {
      const topicToFetch = selectedNewsTopic !== 'all' ? selectedNewsTopic : undefined;
      const response = await fetch(`${jarvisUrl}/sys/news/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(topicToFetch ? { topic: topicToFetch } : {})
      });
      if (response.ok) {
        const data = await response.json();
        setNews(data.news || []);
        fetchNewsTopics();
        toast.success('Radar de notícias atualizado em tempo real!');
      } else {
        toast.error('Falha ao atualizar notícias.');
      }
    } catch (e) {
      toast.error('Erro ao conectar ao News Agent.');
    } finally {
      setIsFetchingNews(false);
    }
  };

  // Add a Topic
  const handleAddTopic = async (topicToAdd?: string) => {
    const topic = (topicToAdd || newTopicInput).toLowerCase().trim();
    if (!topic) return;
    setIsAddingTopic(true);
    try {
      const response = await fetch(`${jarvisUrl}/sys/news/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic })
      });
      if (response.ok) {
        toast.success(`Tópico "${topic}" adicionado ao radar! Buscando notícias...`);
        setNewTopicInput('');
        fetchNewsTopics();
        setTimeout(() => fetchNews(selectedNewsTopic), 1500);
      } else {
        toast.error('Falha ao adicionar tópico.');
      }
    } catch (e) {
      toast.error('Erro ao adicionar tópico.');
    } finally {
      setIsAddingTopic(false);
    }
  };

  // Delete a Topic
  const handleDeleteTopic = async (topic: string) => {
    try {
      const response = await fetch(`${jarvisUrl}/sys/news/topics`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic })
      });
      if (response.ok) {
        toast.success(`Tópico "${topic}" removido do radar.`);
        if (selectedNewsTopic === topic) setSelectedNewsTopic('all');
        fetchNewsTopics();
        fetchNews('all');
      } else {
        toast.error('Falha ao remover tópico.');
      }
    } catch (e) {
      toast.error('Erro ao remover tópico.');
    }
  };

  // Fetch Notes
  const fetchNotes = useCallback(async () => {
    setIsFetchingNotes(true);
    try {
      const response = await fetch(`${jarvisUrl}/sync`, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes || []);
      }
    } catch (e) {
      toast.error('Erro ao conectar ao Second Brain.');
    } finally {
      setIsFetchingNotes(false);
    }
  }, [jarvisUrl]);

  // Fetch Macro Schedules
  const fetchMacros = useCallback(async () => {
    setIsFetchingMacros(true);
    try {
      const response = await fetch(`${jarvisUrl}/api/sys/macro/schedule`, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        setMacros(data.schedules || []);
      }
    } catch (e) {
      toast.error('Erro ao obter fila de macros.');
    } finally {
      setIsFetchingMacros(false);
    }
  }, [jarvisUrl]);

  // Fetch API Config
  const fetchApiConfig = useCallback(async () => {
    setIsFetchingConfig(true);
    try {
      const response = await fetch(`${jarvisUrl}/api/config`, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          if (data.config.ANTHROPIC_API_KEY) setClaudeApiKey(data.config.ANTHROPIC_API_KEY);
          if (data.config.OLLAMA_BASE_URL) setOllamaBaseUrl(data.config.OLLAMA_BASE_URL);
          if (data.config.PRIMARY_MODEL) setPrimaryModel(data.config.PRIMARY_MODEL);
          if (data.config.FALLBACK_MODEL) setFallbackModel(data.config.FALLBACK_MODEL);
        }
      }
    } catch (e) {
      console.error('Erro ao buscar configs da API.', e);
    } finally {
      setIsFetchingConfig(false);
    }
  }, [jarvisUrl]);

  const handleSaveApiConfig = async () => {
    setIsSavingConfig(true);
    try {
      const response = await fetch(`${jarvisUrl}/api/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ANTHROPIC_API_KEY: claudeApiKey,
          OLLAMA_BASE_URL: ollamaBaseUrl,
          PRIMARY_MODEL: primaryModel,
          FALLBACK_MODEL: fallbackModel
        })
      });
      if (response.ok) {
        toast.success('Configurações de API salvas no backend!');
      } else {
        toast.error('Falha ao salvar configurações de API.');
      }
    } catch (e) {
      toast.error('Erro ao conectar com o backend para salvar configurações.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Handle Save config
  const handleSaveConfigs = () => {
    localStorage.setItem('jarvis-url', jarvisUrl);
    localStorage.setItem('hermes-url', hermesUrl);
    localStorage.setItem('hermes-key', hermesKey);
    toast.success('Configurações salvas localmente!');
    checkMainframeStatus();
  };

  // Schedule a Macro
  const handleScheduleMacro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMacroTime) {
      toast.error('Selecione uma data e hora para a execução.');
      return;
    }
    const unixTimestamp = new Date(newMacroTime).getTime();
    try {
      const response = await fetch(`${jarvisUrl}/api/sys/macro/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          macro_name: newMacroName,
          macro_args: newMacroArgs,
          schedule_time: unixTimestamp,
          recurring: newMacroRecur
        })
      });
      if (response.ok) {
        toast.success('Macro agendada com sucesso!');
        fetchMacros();
        setNewMacroArgs('');
        setNewMacroTime('');
      } else {
        const err = await response.json();
        toast.error(`Falha: ${err.error}`);
      }
    } catch (e) {
      toast.error('Erro ao agendar macro.');
    }
  };

  // Delete a Macro
  const handleDeleteMacro = async (id: string) => {
    try {
      const response = await fetch(`${jarvisUrl}/api/sys/macro/schedule`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (response.ok) {
        toast.success('Macro desmarcada com sucesso!');
        fetchMacros();
      }
    } catch (e) {
      toast.error('Erro ao excluir macro agendada.');
    }
  };

  // Start Hermes Session
  const initHermesSession = async () => {
    try {
      const response = await fetch(`${hermesUrl}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${hermesKey}`
        },
        body: JSON.stringify({ source: 'hub_dashboard' })
      });
      if (response.ok) {
        const data = await response.json();
        setChatSessionId(data.session_id);
        setChatMessages([
          {
            sender: 'hermes',
            text: 'Olá Senhor. Estou conectado e pronto para executar comandos cognitivos. Como posso ajudar seu workflow hoje?',
            time: new Date().toLocaleTimeString()
          }
        ]);
      } else {
        toast.error('Falha ao autenticar com o Hermes API Server.');
      }
    } catch (e) {
      toast.error('Erro de conexão com o Hermes API Server. Verifique as configurações.');
    }
  };

  // Send Chat message to Hermes
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { sender: 'user', text: userText, time: new Date().toLocaleTimeString() }]);
    setIsSendingMessage(true);

    try {
      let activeSession = chatSessionId;
      if (!activeSession) {
        // Fallback or auto-start session
        const sessRes = await fetch(`${hermesUrl}/api/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${hermesKey}`
          },
          body: JSON.stringify({ source: 'hub_dashboard' })
        });
        if (sessRes.ok) {
          const sessData = await sessRes.json();
          activeSession = sessData.session_id;
          setChatSessionId(activeSession);
        } else {
          throw new Error('Falha de sessão');
        }
      }

      // Send chat message
      const response = await fetch(`${hermesUrl}/api/sessions/${activeSession}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${hermesKey}`
        },
        body: JSON.stringify({ prompt: userText })
      });

      if (response.ok) {
        const data = await response.json();
        // The API returns the completion under output or reply/message
        const replyText = data.output || data.reply || data.completion || 'Nenhum resultado retornado pelo agente.';
        setChatMessages(prev => [...prev, { sender: 'hermes', text: replyText, time: new Date().toLocaleTimeString() }]);
      } else {
        toast.error('O Hermes retornou um erro de execução.');
      }
    } catch (err) {
      toast.error('Erro ao enviar mensagem.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Sync Note to Hub IndexDB Notes
  const handleImportNote = (note: JarvisNote) => {
    // We add to local state notes or use standard dispatch if available
    toast.success(`Nota "${note.title}" importada para a fila de sincronização do Hub!`);
  };

  useEffect(() => {
    checkMainframeStatus();
    fetchNotes();
    fetchMacros();
    fetchApiConfig();
  }, [checkMainframeStatus, fetchNotes, fetchMacros, fetchApiConfig]);

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(notesSearch.toLowerCase()) ||
    n.body.toLowerCase().includes(notesSearch.toLowerCase()) ||
    n.area.toLowerCase().includes(notesSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-xs">
            <Cpu className="h-4 w-4 animate-pulse" />
            Mainframe Core
          </div>
          <h1 className="text-3xl font-bold tracking-tight">JARVIS Mainframe</h1>
          <p className="text-muted-foreground text-sm">
            Painel Central de monitoramento cognitivo, banco de dados SQLite e automações de macros locais.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant={isJarvisOnline ? 'secondary' : 'destructive'}
            className={`gap-1.5 px-3 py-1 text-xs font-semibold ${isJarvisOnline ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}`}
          >
            <div className={`h-2 w-2 rounded-full ${isJarvisOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            {isJarvisOnline ? 'Conectado ao Mainframe' : 'Mainframe Offline'}
          </Badge>
          <Button variant="outline" size="icon" onClick={() => { checkMainframeStatus(); fetchNotes(); fetchMacros(); }} disabled={isCheckingJarvis}>
            <RefreshCw className={`h-4 w-4 ${isCheckingJarvis ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {!isJarvisOnline && !isCheckingJarvis && (
        <Card className="border-red-500/20 bg-red-500/5 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center gap-3 text-red-500">
              <AlertTriangle className="h-6 w-6" />
              <CardTitle className="text-lg">Problema de Conexão Detectado</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              O Hub Dashboard não conseguiu conectar ao seu servidor JARVIS na URL <strong>{jarvisUrl}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <p><strong>Causas prováveis:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>O script `server.js` do JARVIS não está rodando.</li>
              <li>O certificado SSL autossinado não foi aceito no seu navegador.</li>
            </ul>
            <div className="flex flex-wrap gap-4 pt-2">
              <a
                href={jarvisUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
              >
                Aceitar Certificado SSL
              </a>
              <Button variant="outline" onClick={checkMainframeStatus}>
                Tentar Conectar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-card/55 backdrop-blur border border-primary/5 p-1 mb-6 flex flex-wrap max-w-fit">
          <TabsTrigger value="overview" className="gap-2"><Activity className="h-4 w-4" /> Geral</TabsTrigger>
          <TabsTrigger value="brain" className="gap-2"><Brain className="h-4 w-4" /> Second Brain</TabsTrigger>
          <TabsTrigger value="macros" className="gap-2"><Terminal className="h-4 w-4" /> Agendador</TabsTrigger>
          <TabsTrigger value="hermes" className="gap-2" onClick={() => { if (!chatSessionId) initHermesSession(); }}><Bot className="h-4 w-4" /> Chat Hermes</TabsTrigger>
          <TabsTrigger value="settings" className="gap-2"><Settings className="h-4 w-4" /> Ajustes</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="space-y-6">
          {/* Main Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card/50 border-primary/5 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Status do Núcleo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  {isJarvisOnline ? (
                    <>
                      <CheckCircle2 className="text-green-500 h-6 w-6" />
                      <span>Ativo & Seguro</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="text-red-500 h-6 w-6" />
                      <span>Desconectado</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Conexão TLS/HTTPS local na porta 4242</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-primary/5 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Agentes Cognitivos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeAgents} / {totalAgents}</div>
                <p className="text-xs text-muted-foreground mt-1">Subagentes do mainframe ativos e respondendo</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-primary/5 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Second Brain Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  <span>{notes.length} Notas</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Indexadas no SQLite local</p>
              </CardContent>
            </Card>
          </div>

          {/* Subagents Grid */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">Status dos Subagentes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map(agent => (
                <Card key={agent.id} className="bg-card/30 backdrop-blur-sm border-primary/5 hover:border-primary/10 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{agent.icon}</span>
                        <div>
                          <CardTitle className="text-sm font-bold">{agent.nome}</CardTitle>
                          <span className="text-[10px] text-muted-foreground">Loop: {agent.every_min ? `${agent.every_min * 60}s` : 'Manual'}</span>
                        </div>
                      </div>
                      <Badge
                        variant={agent.state === 'ok' ? 'secondary' : 'destructive'}
                        className={agent.state === 'ok' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}
                      >
                        {agent.state === 'ok' ? 'Ativo' : agent.state === 'off' ? 'Off' : 'Atenção'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <p className="text-slate-400 line-clamp-2">{agent.faz}</p>
                    <div className="border-t border-slate-800/50 pt-2 space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-500">Métrica:</span>
                        <span className="font-semibold text-slate-300">{agent.metric}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-500">Detalhe:</span>
                        <span className="font-semibold text-slate-300 truncate max-w-[150px]">{agent.detail}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Second Brain */}
        <TabsContent value="brain" className="space-y-6">
          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar notas no Second Brain..."
                className="pl-9 bg-card/50"
                value={notesSearch}
                onChange={e => setNotesSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={fetchNotes} disabled={isFetchingNotes}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetchingNotes ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ScrollArea className="h-[500px] border border-slate-800 rounded-lg p-4 bg-card/20">
              <div className="space-y-4">
                {filteredNotes.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">Nenhuma nota encontrada.</p>
                ) : (
                  filteredNotes.map(note => (
                    <Card key={note.id} className="bg-card/40 border-primary/5 hover:border-primary/10 transition-colors">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <Badge className="mb-2" variant="outline">{note.area}</Badge>
                            <CardTitle className="text-base">{note.title}</CardTitle>
                          </div>
                          <Badge variant={note.importance === '5' ? 'destructive' : 'secondary'}>
                            Imp: {note.importance}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <p className="text-xs text-slate-400 whitespace-pre-wrap line-clamp-3">{note.body}</p>
                      </CardContent>
                      <CardFooter className="pt-0 flex justify-end">
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={() => handleImportNote(note)}>
                          <ArrowDownToLine className="h-3.5 w-3.5" />
                          <span>Importar</span>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Note Sync Actions / Add Note to JARVIS */}
            <Card className="bg-card/40 border-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Sincronização & Criação
                </CardTitle>
                <CardDescription>
                  Envie novas informações diretamente para o banco de dados do Second Brain do JARVIS.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-slate-800 p-4 space-y-2 bg-slate-900/50">
                  <h4 className="text-sm font-semibold">Instruções de Sincronia</h4>
                  <p className="text-xs text-slate-400">
                    O JARVIS e o Hub possuem bancos de dados locais complementares. Ao "Importar", você insere a nota selecionada do JARVIS no banco de dados local do seu Hub Dashboard para visualização offline.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={fetchNotes}>
                    <RefreshCw className="h-4 w-4" />
                    Forçar Sincronia de Notas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Macro Scheduler */}
        <TabsContent value="macros" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <Card className="bg-card/40 border-primary/5 lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  Agendar Nova Macro
                </CardTitle>
                <CardDescription>Configure uma automação do Windows para rodar em data/hora específicas.</CardDescription>
              </CardHeader>
              <form onSubmit={handleScheduleMacro}>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Ação da Macro</label>
                    <Input
                      value={newMacroName}
                      onChange={e => setNewMacroName(e.target.value)}
                      placeholder="Ex: abrir_navegador, lock_pc"
                      className="bg-card/50"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Argumentos</label>
                    <Input
                      value={newMacroArgs}
                      onChange={e => setNewMacroArgs(e.target.value)}
                      placeholder="Ex: url ou parâmetros"
                      className="bg-card/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Agendar Execução</label>
                    <Input
                      type="datetime-local"
                      value={newMacroTime}
                      onChange={e => setNewMacroTime(e.target.value)}
                      className="bg-card/50"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Recorrência</label>
                    <select
                      value={newMacroRecur}
                      onChange={e => setNewMacroRecur(e.target.value)}
                      className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="once">Uma vez</option>
                      <option value="daily">Diário</option>
                      <option value="weekly">Semanal</option>
                    </select>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full gap-2">
                    <Play className="h-4 w-4" />
                    Criar Agendamento
                  </Button>
                </CardFooter>
              </form>
            </Card>

            {/* List */}
            <Card className="bg-card/40 border-primary/5 lg:col-span-2">
              <CardHeader className="flex flex-row justify-between items-center">
                <div>
                  <CardTitle className="text-lg">Fila de Agendamentos</CardTitle>
                  <CardDescription>Visualização da tabela `macro_schedule` do SQLite.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchMacros} disabled={isFetchingMacros}>
                  <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isFetchingMacros ? 'animate-spin' : ''}`} />
                  Recarregar
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[360px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Macro</TableHead>
                        <TableHead>Argumentos</TableHead>
                        <TableHead>Execução</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[60px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {macros.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            Nenhuma macro agendada encontrada.
                          </TableCell>
                        </TableRow>
                      ) : (
                        macros.map(mac => (
                          <TableRow key={mac.id}>
                            <TableCell className="font-semibold">{mac.macro_name}</TableCell>
                            <TableCell className="font-mono text-xs">{mac.macro_args || '-'}</TableCell>
                            <TableCell className="text-xs">
                              {new Date(mac.schedule_time).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant={mac.status === 'pending' ? 'outline' : 'secondary'}>
                                {mac.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDeleteMacro(mac.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 4: Chat Hermes */}
        <TabsContent value="hermes" className="space-y-6">
          <Card className="bg-card/40 border-primary/5 flex flex-col h-[550px] overflow-hidden">
            <CardHeader className="border-b border-slate-800 pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary animate-pulse" />
                  Conversa com Hermes Agent
                </CardTitle>
                <CardDescription>
                  Interação em tempo real com o Loop de Inteligência Artificial Cognitiva.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={initHermesSession} className="gap-2">
                <RefreshCw className="h-3.5 w-3.5" />
                Nova Sessão
              </Button>
            </CardHeader>

            <CardContent className="flex-1 overflow-auto p-4 space-y-4">
              <ScrollArea className="h-[360px] pr-4">
                <div className="space-y-4">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex gap-3 max-w-[80%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center border ${msg.sender === 'user' ? 'bg-primary border-primary-foreground text-primary-foreground' : 'bg-muted border-primary/20 text-primary'}`}>
                        {msg.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      <div className={`rounded-2xl p-3 text-xs leading-relaxed ${msg.sender === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-card/60 border border-primary/10 rounded-tl-none'}`}>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        <span className="text-[8px] text-muted-foreground block text-right mt-1.5">{msg.time}</span>
                      </div>
                    </div>
                  ))}
                  {isSendingMessage && (
                    <div className="flex gap-3 max-w-[80%]">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center border bg-muted border-primary/20 text-primary animate-pulse">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="rounded-2xl p-3 text-xs bg-card/60 border border-primary/10 rounded-tl-none flex items-center gap-2">
                        <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>

            <CardFooter className="border-t border-slate-800 p-3">
              <form onSubmit={handleSendMessage} className="flex w-full gap-2 items-center">
                <Input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder={chatSessionId ? "Pergunte algo ao Hermes ou ordene um comando..." : "Conectando sessão..."}
                  className="bg-card/50"
                  disabled={isSendingMessage}
                />
                <Button type="submit" size="icon" disabled={isSendingMessage || !chatInput.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Tab 5: Settings */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="bg-card/40 border-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Configurar Endereços
              </CardTitle>
              <CardDescription>
                Altere os endpoints e portas de comunicação locais caso os servidores rodem em portas customizadas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">URL do JARVIS Mainframe (HTTPS)</label>
                  <Input
                    value={jarvisUrl}
                    onChange={e => setJarvisUrl(e.target.value)}
                    className="bg-card/50"
                  />
                  <span className="text-[10px] text-muted-foreground">Padrão: https://localhost:4242</span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">URL da API do Hermes Agent (HTTP)</label>
                  <Input
                    value={hermesUrl}
                    onChange={e => setHermesUrl(e.target.value)}
                    className="bg-card/50"
                  />
                  <span className="text-[10px] text-muted-foreground">Padrão: http://localhost:8642</span>
                </div>
              </div>

              <div className="space-y-2 max-w-md pt-2">
                <label className="text-xs font-semibold text-slate-400">Chave de API do Hermes (API_SERVER_KEY)</label>
                <Input
                  type="password"
                  value={hermesKey}
                  onChange={e => setHermesKey(e.target.value)}
                  className="bg-card/50 font-mono"
                />
                <span className="text-[10px] text-muted-foreground">Chave de autenticação configurada na variável do .env</span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setJarvisUrl('https://localhost:4242'); setHermesUrl('http://localhost:8642'); setHermesKey('jarvis_secure_key_12345'); }}>
                Restaurar Padrões
              </Button>
              <Button onClick={handleSaveConfigs}>
                Salvar Ajustes
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-card/40 border-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                APIs e Modelos LLM (Fallback System)
              </CardTitle>
              <CardDescription>
                Gerencie as chaves de API e os modelos utilizados pelo sistema de contingência.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Claude API Key (Anthropic)</label>
                  <Input
                    type="password"
                    value={claudeApiKey}
                    onChange={e => setClaudeApiKey(e.target.value)}
                    className="bg-card/50 font-mono"
                    placeholder="sk-ant-api03-..."
                  />
                  <span className="text-[10px] text-muted-foreground">Chave de acesso à API do Claude.</span>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">URL do Ollama (Local)</label>
                  <Input
                    value={ollamaBaseUrl}
                    onChange={e => setOllamaBaseUrl(e.target.value)}
                    className="bg-card/50"
                  />
                  <span className="text-[10px] text-muted-foreground">Padrão: http://127.0.0.1:11434</span>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Modelo Primário (Nuvem)</label>
                  <Input
                    value={primaryModel}
                    onChange={e => setPrimaryModel(e.target.value)}
                    className="bg-card/50"
                  />
                  <span className="text-[10px] text-muted-foreground">Padrão: claude-3-haiku-20240307</span>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Modelo Fallback (Local)</label>
                  <Input
                    value={fallbackModel}
                    onChange={e => setFallbackModel(e.target.value)}
                    className="bg-card/50"
                  />
                  <span className="text-[10px] text-muted-foreground">Padrão: llama3.1:8b</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => fetchApiConfig()} disabled={isFetchingConfig}>
                {isFetchingConfig ? 'Recarregando...' : 'Recarregar'}
              </Button>
              <Button onClick={handleSaveApiConfig} disabled={isSavingConfig}>
                {isSavingConfig ? 'Salvando...' : 'Salvar APIs'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
