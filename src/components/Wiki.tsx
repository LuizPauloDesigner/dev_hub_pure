import React, { useState, useMemo } from 'react';
import { useApp, WikiArticle } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Book,
    Search,
    Plus,
    FileText,
    Hash,
    Clock,
    Settings2,
    ChevronRight,
    Edit3,
    Trash2,
    Save,
    ArrowLeft,
    Layers,
    Info,
    CheckCircle,
    ShieldCheck,
    Lock
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';

export const Wiki = () => {
    const { state, addWikiArticle, updateWikiArticle, deleteWikiArticle } = useApp();
    const articles = state.wikiArticles || [];

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<WikiArticle>>({});

    const categories = useMemo(() => {
        const cats = Array.from(new Set(articles.map(a => a.category)));
        return cats.length > 0 ? cats : ['Geral', 'Processos', 'Style Guide', 'Onboarding'];
    }, [articles]);

    const filteredArticles = useMemo(() => {
        return articles.filter(a =>
            a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [articles, searchQuery]);

    const selectedArticle = useMemo(() => {
        return articles.find(a => a.id === selectedArticleId) || null;
    }, [articles, selectedArticleId]);

    const handleCreateNew = () => {
        const newArticle: Partial<WikiArticle> = {
            title: 'Nova Documentação',
            content: '# Novo Artigo\nEscreva sua documentação aqui utilizando markdown.',
            category: 'Geral',
            tags: [],
            isInternal: true
        };
        setEditData(newArticle);
        setIsEditing(true);
        setSelectedArticleId(null);
    };

    const handleEdit = (article: WikiArticle) => {
        setEditData(article);
        setIsEditing(true);
    };

    const handleSave = () => {
        if (!editData.title || !editData.content) {
            toast.error('Título e conteúdo são obrigatórios.');
            return;
        }

        if (editData.id) {
            updateWikiArticle(editData as WikiArticle);
            toast.success('Documentação atualizada!');
        } else {
            addWikiArticle(editData as Omit<WikiArticle, 'id' | 'lastUpdated'>);
            toast.success('Novo artigo criado!');
        }
        setIsEditing(false);
        setEditData({});
    };

    const handleDelete = (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta documentação?')) {
            deleteWikiArticle(id);
            toast.info('Artigo removido.');
            if (selectedArticleId === id) setSelectedArticleId(null);
        }
    };

    return (
        <div className="flex h-[calc(100vh-120px)] gap-6 animate-in fade-in duration-700">
            {/* Sidebar */}
            <div className="w-80 flex flex-col gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                        <Book className="h-6 w-6 text-primary" />
                        Company Wiki
                    </h2>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest px-1">Base de Conhecimento</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar documentos..."
                        className="pl-9 bg-card/50 border-primary/10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <Button onClick={handleCreateNew} className="w-full font-bold gap-2">
                    <Plus className="h-4 w-4" /> Novo Documento
                </Button>

                <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-6">
                        {categories.map(category => (
                            <div key={category} className="space-y-2">
                                <h3 className="text-xs font-black text-primary/50 uppercase tracking-tighter px-2 flex items-center gap-2">
                                    <Layers className="h-3 w-3" />
                                    {category}
                                </h3>
                                <div className="space-y-1">
                                    {filteredArticles.filter(a => a.category === category).map(article => (
                                        <button
                                            key={article.id}
                                            onClick={() => { setSelectedArticleId(article.id); setIsEditing(false); }}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-sm transition-all duration-300",
                                                selectedArticleId === article.id
                                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                                                    : "hover:bg-primary/10 text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <FileText className="h-4 w-4 shrink-0" />
                                            <span className="truncate font-semibold">{article.title}</span>
                                        </button>
                                    ))}
                                    {filteredArticles.filter(a => a.category === category).length === 0 && (
                                        <p className="text-[10px] text-muted-foreground italic px-3 opacity-50">Nenhum artigo nesta pasta</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-card/50 backdrop-blur rounded-3xl border border-primary/5 shadow-2xl overflow-hidden flex flex-col">
                {isEditing ? (
                    <div className="flex flex-col h-full bg-card">
                        <div className="p-6 border-b border-primary/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <h2 className="text-xl font-bold">{editData.id ? 'Editar Artigo' : 'Novo Artigo'}</h2>
                            </div>
                            <Button onClick={handleSave} className="gap-2 font-bold px-6">
                                <Save className="h-4 w-4" /> Salvar Artigo
                            </Button>
                        </div>
                        <div className="p-8 space-y-6 flex-1 overflow-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Título do Documento</label>
                                    <Input
                                        value={editData.title || ''}
                                        onChange={e => setEditData({ ...editData, title: e.target.value })}
                                        className="h-12 text-lg font-bold border-primary/10"
                                        placeholder="Ex: Guia de Estilo Visual 2026"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Categoria / Pasta</label>
                                    <Input
                                        value={editData.category || ''}
                                        onChange={e => setEditData({ ...editData, category: e.target.value })}
                                        className="h-12 border-primary/10"
                                        placeholder="Ex: Style Guide"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 flex-1 flex flex-col">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Conteúdo (Markdown)</label>
                                <textarea
                                    className="flex-1 w-full min-h-[400px] bg-muted/30 rounded-2xl p-6 font-mono text-sm border-primary/5 focus:border-primary/20 outline-none transition-colors overflow-auto resize-none"
                                    value={editData.content || ''}
                                    onChange={e => setEditData({ ...editData, content: e.target.value })}
                                    placeholder="# Use Markdown para formatar seu texto..."
                                />
                            </div>
                        </div>
                    </div>
                ) : selectedArticle ? (
                    <div className="flex flex-col h-full">
                        {/* Article Header */}
                        <div className="p-8 pb-4 space-y-6">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-primary/20 text-primary border-none hover:bg-primary/30 transition-colors uppercase tracking-widest text-[10px] font-black">
                                            {selectedArticle.category}
                                        </Badge>
                                        {selectedArticle.isInternal && (
                                            <Badge variant="outline" className="text-[10px] gap-1 border-primary/20">
                                                <Lock className="h-3 w-3" /> Interno
                                            </Badge>
                                        )}
                                    </div>
                                    <h1 className="text-4xl font-black py-2 tracking-tight">{selectedArticle.title}</h1>
                                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            Atualizado em {new Date(selectedArticle.lastUpdated).toLocaleDateString('pt-BR')}
                                        </span>
                                        <span className="flex items-center gap-2 text-primary font-bold">
                                            <CheckCircle className="h-4 w-4" /> Revisado
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="icon" onClick={() => handleEdit(selectedArticle)} className="rounded-xl border-primary/10 hover:border-primary/30">
                                        <Edit3 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => handleDelete(selectedArticle.id)} className="rounded-xl text-destructive border-destructive/10 hover:bg-destructive/10">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Article Content */}
                        <ScrollArea className="flex-1">
                            <article className="p-8 pt-4 prose prose-slate dark:prose-invert max-w-none prose-headings:font-black prose-h1:text-4xl prose-p:leading-relaxed prose-pre:bg-muted/50 prose-pre:rounded-2xl prose-pre:p-6 prose-code:text-primary">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {selectedArticle.content}
                                </ReactMarkdown>
                            </article>
                        </ScrollArea>

                        {/* Footer Info */}
                        <div className="p-6 bg-primary/5 border-t border-primary/10 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <ShieldCheck className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-primary">Status Confidencial</p>
                                    <p className="text-[10px] text-muted-foreground">Este documento é propriedade da empresa Intelix Dash.</p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" className="font-bold border-primary/20 hover:bg-primary/10">
                                Baixar PDF
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gradient-to-b from-card to-background">
                        <div className="h-24 w-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 border border-primary/10 animate-pulse">
                            <Book className="h-12 w-12 text-primary" />
                        </div>
                        <h2 className="text-3xl font-black mb-4 tracking-tight">Sua Base de Conhecimento</h2>
                        <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                            Selecione um documento na barra lateral ou crie uma nova documentação para começar a estruturar o conhecimento da sua equipe.
                        </p>
                        <div className="grid grid-cols-2 gap-4 mt-12 w-full max-w-2xl">
                            <Card className="bg-card/30 border-primary/5 p-6 hover:shadow-xl transition-all cursor-pointer group" onClick={handleCreateNew}>
                                <FileText className="h-8 w-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                                <h3 className="font-bold mb-2">Processos Operacionais</h3>
                                <p className="text-[10px] text-muted-foreground">Crie manuais passo-a-passo para garantir qualidade no delivery.</p>
                            </Card>
                            <Card className="bg-card/30 border-primary/5 p-6 hover:shadow-xl transition-all cursor-pointer group" onClick={handleCreateNew}>
                                <Settings2 className="h-8 w-8 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
                                <h3 className="font-bold mb-2">Guias de Estilo</h3>
                                <p className="text-[10px] text-muted-foreground">Documente as regras de branding para o modo White-Label.</p>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
