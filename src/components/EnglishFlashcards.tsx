import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp, EnglishFlashcard } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Languages,
  BookOpen,
  Sparkles,
  Volume2,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  RotateCw,
  AlertTriangle,
  Search,
  Filter,
  Star,
  ArrowLeft,
  ArrowRight,
  Shuffle,
  GraduationCap,
  Layers,
  Check,
  HelpCircle,
  BookmarkCheck,
  Eye,
  Copy
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const CATEGORIES = [
  'Todos',
  'Backend',
  'Banco de Dados',
  'Arquitetura',
  'Frontend',
  'Performance',
  'DevOps & Cloud',
  'Geral'
];

export function EnglishFlashcards() {
  const {
    state,
    currentProject,
    addFlashcard,
    updateFlashcard,
    deleteFlashcard,
    markFlashcardReviewed,
    toggleFlashcardFavorite
  } = useApp();

  const flashcards = state.flashcards || [];

  // View Mode: 'study' | 'library'
  const [viewMode, setViewMode] = useState<'study' | 'library'>('study');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'learning' | 'review' | 'mastered' | 'favorite'>('all');

  // Study Session State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyList, setStudyList] = useState<EnglishFlashcard[]>([]);

  // Dialog State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<EnglishFlashcard | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    term: '',
    context: '',
    practicalMeaning: '',
    collocations: '',
    pitfall: '',
    category: 'Backend',
    level: 'intermediate' as 'basic' | 'intermediate' | 'advanced',
  });

  // Filtered Cards for Library
  const filteredCards = useMemo(() => {
    return flashcards.filter(card => {
      const matchesSearch = 
        card.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.context.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.practicalMeaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.collocations.some(c => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (card.pitfall && card.pitfall.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === 'Todos' || card.category === selectedCategory;

      const matchesStatus = 
        selectedStatus === 'all' ? true :
        selectedStatus === 'favorite' ? card.isFavorite :
        card.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [flashcards, searchQuery, selectedCategory, selectedStatus]);

  // Sync Study List
  useEffect(() => {
    if (filteredCards.length > 0) {
      setStudyList(filteredCards);
      setCurrentIndex(0);
      setIsFlipped(false);
    } else {
      setStudyList([]);
    }
  }, [filteredCards]);

  // Statistics
  const stats = useMemo(() => {
    const total = flashcards.length;
    const mastered = flashcards.filter(c => c.status === 'mastered').length;
    const review = flashcards.filter(c => c.status === 'review').length;
    const learning = flashcards.filter(c => c.status === 'learning').length;
    const favorites = flashcards.filter(c => c.isFavorite).length;
    return { total, mastered, review, learning, favorites };
  }, [flashcards]);

  const currentStudyCard = studyList[currentIndex] || null;

  // Speech pronunciation using native Web Speech API
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      toast.error('Seu navegador não suporta reprodução de voz.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleNext = useCallback(() => {
    if (studyList.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % studyList.length);
  }, [studyList.length]);

  const handlePrev = useCallback(() => {
    if (studyList.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + studyList.length) % studyList.length);
  }, [studyList.length]);

  const handleShuffle = () => {
    setIsFlipped(false);
    setStudyList(prev => [...prev].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    toast.info('Cards embaralhados para a sessão!');
  };

  const handleReviewStatus = (status: 'learning' | 'review' | 'mastered') => {
    if (!currentStudyCard) return;
    markFlashcardReviewed(currentStudyCard.id, status);
    
    const labels = {
      learning: 'Marcado como: Ainda aprendendo',
      review: 'Marcado como: Preciso revisar',
      mastered: 'Parabéns! Card dominado!'
    };
    toast.success(labels[status]);
    handleNext();
  };

  // Keyboard navigation for Study Mode
  useEffect(() => {
    if (viewMode !== 'study' || isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === '1') {
        e.preventDefault();
        handleReviewStatus('learning');
      } else if (e.key === '2') {
        e.preventDefault();
        handleReviewStatus('review');
      } else if (e.key === '3') {
        e.preventDefault();
        handleReviewStatus('mastered');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, isModalOpen, handleNext, handlePrev, currentStudyCard]);

  // Modal Open for Create
  const handleOpenCreate = () => {
    setEditingCard(null);
    setFormData({
      term: '',
      context: '',
      practicalMeaning: '',
      collocations: '',
      pitfall: '',
      category: 'Backend',
      level: 'intermediate',
    });
    setIsModalOpen(true);
  };

  // Modal Open for Edit
  const handleOpenEdit = (card: EnglishFlashcard) => {
    setEditingCard(card);
    setFormData({
      term: card.term,
      context: card.context,
      practicalMeaning: card.practicalMeaning,
      collocations: card.collocations.join(', '),
      pitfall: card.pitfall || '',
      category: card.category || 'Backend',
      level: card.level || 'intermediate',
    });
    setIsModalOpen(true);
  };

  // Submit Form (Save / Update)
  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.term.trim()) {
      toast.error('Informe o termo ou expressão em destaque');
      return;
    }
    if (!formData.context.trim()) {
      toast.error('Informe o contexto real da documentação');
      return;
    }
    if (!formData.practicalMeaning.trim()) {
      toast.error('Informe a tradução ou sentido prático');
      return;
    }

    const collocationsArray = formData.collocations
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (editingCard) {
      updateFlashcard(editingCard.id, {
        term: formData.term.trim(),
        context: formData.context.trim(),
        practicalMeaning: formData.practicalMeaning.trim(),
        collocations: collocationsArray,
        pitfall: formData.pitfall.trim() || undefined,
        category: formData.category,
        level: formData.level,
      });
      toast.success('Card atualizado com sucesso!');
    } else {
      addFlashcard({
        projectId: currentProject || 'default',
        term: formData.term.trim(),
        context: formData.context.trim(),
        practicalMeaning: formData.practicalMeaning.trim(),
        collocations: collocationsArray,
        pitfall: formData.pitfall.trim() || undefined,
        category: formData.category,
        level: formData.level,
        status: 'learning',
        isFavorite: false,
      });
      toast.success('Novo card adicionado ao seu repertório!');
    }

    setIsModalOpen(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência!`);
  };

  // Highlight the term inside the context string
  const renderHighlightedContext = (context: string, term: string) => {
    if (!term || !context) return context;
    try {
      const parts = context.split(new RegExp(`(${term})`, 'gi'));
      return parts.map((part, i) => 
        part.toLowerCase() === term.toLowerCase() ? (
          <span 
            key={i} 
            className="px-1.5 py-0.5 rounded-md font-bold bg-primary/20 text-primary border border-primary/30 underline decoration-primary decoration-2 underline-offset-4"
          >
            {part}
          </span>
        ) : (
          part
        )
      );
    } catch (e) {
      return context;
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* ── Header & Banner ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Languages className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Inglês Técnico para Devs</h1>
              <p className="text-sm text-muted-foreground">
                Flashcards contextuais baseados em documentação real, nuances e armadilhas técnicas
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant={viewMode === 'study' ? 'default' : 'outline'}
            onClick={() => setViewMode('study')}
            className="gap-2"
          >
            <GraduationCap className="w-4 h-4" /> Modo Estudo
          </Button>
          <Button
            variant={viewMode === 'library' ? 'default' : 'outline'}
            onClick={() => setViewMode('library')}
            className="gap-2"
          >
            <Layers className="w-4 h-4" /> Biblioteca ({flashcards.length})
          </Button>
          <Button onClick={handleOpenCreate} className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> Novo Card
          </Button>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-card/50 border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total de Cards</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <BookOpen className="w-8 h-8 text-primary/40" />
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Dominados</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.mastered}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-500/40" />
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Em Revisão</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.review}</p>
            </div>
            <RotateCw className="w-8 h-8 text-amber-500/40" />
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Aprendendo</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.learning}</p>
            </div>
            <Sparkles className="w-8 h-8 text-blue-500/40" />
          </CardContent>
        </Card>
      </div>

      {/* ── Filters (Shared) ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/40 p-3 rounded-xl border border-border/40">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            placeholder="Buscar por termo, contexto, tradução ou collocation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-background/80"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-9 px-3 text-xs rounded-md border border-input bg-background font-medium focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="h-9 px-3 text-xs rounded-md border border-input bg-background font-medium focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Todos os Status</option>
            <option value="learning">Aprendendo</option>
            <option value="review">Em Revisão</option>
            <option value="mastered">Dominados</option>
            <option value="favorite">Apenas Favoritos ⭐</option>
          </select>

          {viewMode === 'study' && (
            <Button variant="outline" size="sm" onClick={handleShuffle} title="Embaralhar Cards" className="h-9">
              <Shuffle className="w-3.5 h-3.5 mr-1" /> Embaralhar
            </Button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODE 1: STUDY SESSION (FLASHCARD FLIP)
         ══════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'study' && (
        <div className="max-w-3xl mx-auto space-y-6">
          {studyList.length === 0 ? (
            <Card className="border-dashed p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Nenhum card encontrado</h3>
                <p className="text-sm text-muted-foreground">
                  Altere os filtros de busca ou crie novos cards para iniciar seus estudos de inglês técnico.
                </p>
              </div>
              <Button onClick={handleOpenCreate} className="gap-2">
                <Plus className="w-4 h-4" /> Criar Primeiro Card
              </Button>
            </Card>
          ) : (
            <>
              {/* Progress & Card Index */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                  <span>Card {currentIndex + 1} de {studyList.length}</span>
                  <span>{Math.round(((currentIndex + 1) / studyList.length) * 100)}% concluído</span>
                </div>
                <Progress value={((currentIndex + 1) / studyList.length) * 100} className="h-2" />
              </div>

              {/* Main Interactive Flashcard */}
              <div 
                className="relative min-h-[380px] cursor-pointer select-none perspective group"
                onClick={() => setIsFlipped(prev => !prev)}
              >
                <Card className={`relative overflow-hidden transition-all duration-300 border-2 shadow-xl hover:shadow-2xl ${
                  isFlipped 
                    ? 'border-primary/40 bg-card' 
                    : 'border-primary/20 bg-card hover:border-primary/40'
                }`}>
                  {/* Top Bar inside Card */}
                  <div className="p-5 pb-0 flex items-center justify-between border-b border-border/40 pb-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-semibold text-xs bg-primary/10 text-primary border-primary/20">
                        {currentStudyCard?.category || 'Geral'}
                      </Badge>
                      {currentStudyCard?.level && (
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                          {currentStudyCard.level}
                        </Badge>
                      )}
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] uppercase font-bold ${
                          currentStudyCard?.status === 'mastered' ? 'border-emerald-500/40 text-emerald-500 bg-emerald-500/10' :
                          currentStudyCard?.status === 'review' ? 'border-amber-500/40 text-amber-500 bg-amber-500/10' :
                          'border-blue-500/40 text-blue-500 bg-blue-500/10'
                        }`}
                      >
                        {currentStudyCard?.status === 'mastered' ? 'Dominado' :
                         currentStudyCard?.status === 'review' ? 'Em Revisão' : 'Aprendendo'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => speakText(currentStudyCard?.term || '')}
                        title="Ouvir pronúncia do termo (US)"
                      >
                        <Volume2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${currentStudyCard?.isFavorite ? 'text-amber-500' : 'text-muted-foreground'}`}
                        onClick={() => currentStudyCard && toggleFlashcardFavorite(currentStudyCard.id)}
                        title="Favoritar"
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => currentStudyCard && handleOpenEdit(currentStudyCard)}
                        title="Editar Card"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Card Body (Dynamic Front or Back) */}
                  <CardContent className="p-6 md:p-8 space-y-6">
                    {!isFlipped ? (
                      /* ── FRENTE (CONTEXTO REAL) ── */
                      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="space-y-2">
                          <span className="text-[11px] font-bold tracking-widest text-primary uppercase flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> Termo / Expressão em Destaque
                          </span>
                          <div className="flex items-center gap-3">
                            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground font-mono">
                              {currentStudyCard?.term}
                            </h2>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 gap-1.5 text-xs rounded-full border-primary/20"
                              onClick={(e) => {
                                e.stopPropagation();
                                speakText(currentStudyCard?.term || '');
                              }}
                            >
                              <Volume2 className="w-3.5 h-3.5 text-primary" /> Ouvir
                            </Button>
                          </div>
                        </div>

                        <div className="p-5 rounded-xl bg-muted/50 border border-border/60 relative group-hover:border-primary/30 transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-primary" /> Contexto Real da Documentação / Artigo
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(currentStudyCard?.context || '', 'Contexto');
                              }}
                              title="Copiar frase em inglês"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="text-base md:text-lg text-foreground/90 leading-relaxed font-sans italic">
                            "{renderHighlightedContext(currentStudyCard?.context || '', currentStudyCard?.term || '')}"
                          </p>
                        </div>

                        <div className="pt-4 flex items-center justify-center text-xs text-muted-foreground gap-2">
                          <Eye className="w-4 h-4 text-primary animate-pulse" />
                          <span>Clique no card ou aperte <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono border">Espaço</kbd> para revelar a tradução e nuances</span>
                        </div>
                      </div>
                    ) : (
                      /* ── VERSO (TRADUÇÃO, COLLOCATIONS E ARMADILHAS) ── */
                      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        {/* Sentido Prático */}
                        <div className="space-y-2">
                          <span className="text-[11px] font-bold tracking-widest text-emerald-500 uppercase flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" /> Tradução / Sentido Prático na Documentação
                          </span>
                          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-foreground text-base md:text-lg font-medium leading-relaxed">
                            {currentStudyCard?.practicalMeaning}
                          </div>
                        </div>

                        {/* Collocations / Combinações Comuns */}
                        {currentStudyCard?.collocations && currentStudyCard.collocations.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[11px] font-bold tracking-widest text-primary uppercase flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5" /> Collocations & Combinações Frequentes
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {currentStudyCard.collocations.map((item, idx) => (
                                <Badge 
                                  key={idx} 
                                  variant="secondary" 
                                  className="px-3 py-1 text-xs font-mono bg-background border border-border/70 hover:border-primary/50 transition-colors flex items-center gap-1.5"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    speakText(item);
                                  }}
                                  title="Clique para ouvir"
                                >
                                  <Volume2 className="w-3 h-3 text-muted-foreground hover:text-primary" />
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Armadilha Técnica (Pitfall) */}
                        {currentStudyCard?.pitfall && (
                          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 space-y-1.5">
                            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide text-amber-800 dark:text-amber-200">
                              <AlertTriangle className="w-4 h-4 text-amber-500" />
                              ⚠️ Armadilha / Falso Cognato / Nuance Técnica
                            </div>
                            <p className="text-sm leading-relaxed">
                              {currentStudyCard.pitfall}
                            </p>
                          </div>
                        )}

                        <div className="pt-2 flex items-center justify-center text-xs text-muted-foreground gap-2">
                          <RotateCw className="w-3.5 h-3.5 text-primary" />
                          <span>Clique no card ou aperte <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono border">Espaço</kbd> para voltar à frente</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Study Control Buttons (Rating & Next) */}
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2.5">
                  <Button
                    variant="outline"
                    className="border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-500 flex flex-col sm:flex-row items-center gap-1.5 py-4 h-auto"
                    onClick={() => handleReviewStatus('learning')}
                  >
                    <span className="font-bold">🔴 Ainda Aprendendo</span>
                    <span className="text-[10px] text-muted-foreground opacity-80">(Tecla 1)</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-500 flex flex-col sm:flex-row items-center gap-1.5 py-4 h-auto"
                    onClick={() => handleReviewStatus('review')}
                  >
                    <span className="font-bold">🟡 Preciso Revisar</span>
                    <span className="text-[10px] text-muted-foreground opacity-80">(Tecla 2)</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-500 flex flex-col sm:flex-row items-center gap-1.5 py-4 h-auto"
                    onClick={() => handleReviewStatus('mastered')}
                  >
                    <span className="font-bold">🟢 Dominado!</span>
                    <span className="text-[10px] text-muted-foreground opacity-80">(Tecla 3)</span>
                  </Button>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="ghost" size="sm" onClick={handlePrev} className="gap-1.5">
                    <ArrowLeft className="w-4 h-4" /> Anterior
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => setIsFlipped(prev => !prev)}
                    className="gap-1.5 font-medium"
                  >
                    <RotateCw className="w-4 h-4" /> Virar Card
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleNext} className="gap-1.5">
                    Próximo <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODE 2: LIBRARY / REPOSITORY OF FLASHCARDS
         ══════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'library' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Mostrando {filteredCards.length} de {flashcards.length} cards</span>
            <span>Clique em qualquer card para ouvir pronúncia ou editar</span>
          </div>

          {filteredCards.length === 0 ? (
            <Card className="border-dashed p-12 text-center space-y-3">
              <p className="text-muted-foreground">Nenhum card atende aos critérios de pesquisa.</p>
              <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory('Todos'); setSelectedStatus('all'); }}>
                Limpar Filtros
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCards.map((card) => (
                <Card 
                  key={card.id} 
                  className="group hover:border-primary/40 transition-all flex flex-col justify-between shadow-sm hover:shadow-md"
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-foreground font-mono">{card.term}</h3>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-primary"
                            onClick={() => speakText(card.term)}
                            title="Ouvir pronúncia"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="secondary" className="text-[10px] font-medium bg-primary/10 text-primary">
                            {card.category}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] font-semibold ${
                              card.status === 'mastered' ? 'text-emerald-500 border-emerald-500/30' :
                              card.status === 'review' ? 'text-amber-500 border-amber-500/30' :
                              'text-blue-500 border-blue-500/30'
                            }`}
                          >
                            {card.status === 'mastered' ? 'Dominado' : card.status === 'review' ? 'Revisar' : 'Aprendendo'}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-7 w-7 ${card.isFavorite ? 'text-amber-500' : 'text-muted-foreground'}`}
                          onClick={() => toggleFlashcardFavorite(card.id)}
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                          onClick={() => handleOpenEdit(card)}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            if (confirm(`Excluir o card "${card.term}"?`)) {
                              deleteFlashcard(card.id);
                              toast.success('Card excluído');
                            }
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-2 space-y-3 text-sm flex-1">
                    {/* Contexto Real */}
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 text-xs text-muted-foreground italic font-sans">
                      "{renderHighlightedContext(card.context, card.term)}"
                    </div>

                    {/* Tradução Prática */}
                    <div className="text-xs font-medium text-foreground">
                      <span className="text-muted-foreground font-semibold">Sentido: </span>
                      {card.practicalMeaning}
                    </div>

                    {/* Collocations */}
                    {card.collocations && card.collocations.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {card.collocations.map((col, i) => (
                          <span 
                            key={i} 
                            className="text-[10px] px-2 py-0.5 rounded bg-muted font-mono text-muted-foreground border"
                          >
                            {col}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Armadilha */}
                    {card.pitfall && (
                      <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span><strong>Armadilha:</strong> {card.pitfall}</span>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="p-4 pt-0 border-t border-border/30 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Revisado {card.reviewCount || 0}x</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs text-primary font-medium hover:underline p-0"
                      onClick={() => {
                        const targetIdx = studyList.findIndex(c => c.id === card.id);
                        if (targetIdx !== -1) {
                          setCurrentIndex(targetIdx);
                          setViewMode('study');
                        }
                      }}
                    >
                      Estudar este card →
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: CREATE / EDIT FLASHCARD
         ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveCard}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Languages className="w-5 h-5 text-primary" />
                {editingCard ? 'Editar Flashcard' : 'Novo Card de Inglês Técnico'}
              </DialogTitle>
              <DialogDescription>
                Adicione um termo técnico, o trecho real da documentação e suas nuances para fixação no dia a dia.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Termo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Termo / Expressão em Destaque *
                </label>
                <Input
                  placeholder="Ex: fall back to, graceful degradation, eventual consistency"
                  value={formData.term}
                  onChange={(e) => setFormData(prev => ({ ...prev, term: e.target.value }))}
                  required
                />
              </div>

              {/* Contexto Real (Frente) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Contexto (Frente do Card) - Trecho Real da Documentação *
                </label>
                <Textarea
                  placeholder="Ex: If the downstream service times out, the worker falls back to cached data."
                  value={formData.context}
                  onChange={(e) => setFormData(prev => ({ ...prev, context: e.target.value }))}
                  rows={3}
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Dica: inclua a frase completa em que a expressão aparece no artigo ou doc técnica.
                </p>
              </div>

              {/* Sentido Prático (Verso) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Tradução / Sentido Prático (Verso do Card) *
                </label>
                <Textarea
                  placeholder='Ex: Recorre a um plano/fonte alternativa ("faz fallback para...").'
                  value={formData.practicalMeaning}
                  onChange={(e) => setFormData(prev => ({ ...prev, practicalMeaning: e.target.value }))}
                  rows={2}
                  required
                />
              </div>

              {/* Collocations */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Collocation / Uso Comum (separados por vírgula)
                </label>
                <Input
                  placeholder="Ex: fall back to, fallback mechanism, graceful degradation"
                  value={formData.collocations}
                  onChange={(e) => setFormData(prev => ({ ...prev, collocations: e.target.value }))}
                />
                <p className="text-[11px] text-muted-foreground">
                  Combinações frequentes daquele termo que costumam aparecer juntas na área.
                </p>
              </div>

              {/* Armadilha (Pitfall) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  Armadilha / Falsos Cognatos / Nuances Técnicas (Opcional)
                </label>
                <Textarea
                  placeholder='Ex: Time out como verbo/expressão aqui significa estourar o tempo limite, não "dar um tempo" de descanso.'
                  value={formData.pitfall}
                  onChange={(e) => setFormData(prev => ({ ...prev, pitfall: e.target.value }))}
                  rows={2}
                />
              </div>

              {/* Categoria e Nível */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Categoria
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {CATEGORIES.filter(c => c !== 'Todos').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Nível de Dificuldade
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value as any }))}
                    className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="basic">Iniciante / Básico</option>
                    <option value="intermediate">Intermediário</option>
                    <option value="advanced">Avançado / Arquitetura</option>
                  </select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingCard ? 'Salvar Alterações' : 'Criar Flashcard'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
