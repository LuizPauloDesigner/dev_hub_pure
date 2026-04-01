import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Star, Trash2, Copy, Users, Lock, Code2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';

const languages = [
  'javascript',
  'typescript',
  'python',
  'java',
  'go',
  'rust',
  'html',
  'css',
  'sql',
  'bash',
  'other',
];

export const Snippets = () => {
  const { state, currentProject, addSnippet, updateSnippet, deleteSnippet } = useApp();
  const { user } = useAuth();
  const [selectedSnippet, setSelectedSnippet] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    code: '',
    language: 'javascript',
    tags: '',
    accessLevel: 'private' as 'private' | 'shared',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'private' | 'shared'>('all');

  const projectSnippets = state.snippets.filter(s => {
    const isProject = s.projectId === currentProject;
    if (filter === 'all') return isProject;
    return isProject && s.accessLevel === filter;
  });

  const currentSnippet = selectedSnippet ? state.snippets.find(s => s.id === selectedSnippet) : null;
  const canEdit = !selectedSnippet || currentSnippet?.userId === user?.id || (currentSnippet?.accessLevel === 'shared' && (user?.sub_role === 'org_admin' || user?.sub_role === 'manager'));

  const handleNew = () => {
    setSelectedSnippet(null);
    setForm({ title: '', code: '', language: 'javascript', tags: '', accessLevel: 'private' });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.code.trim()) {
      toast.error('Título e código são obrigatórios');
      return;
    }

    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);

    if (selectedSnippet) {
      updateSnippet(selectedSnippet, { ...form, tags });
      toast.success('Snippet atualizado');
    } else {
      addSnippet({
        projectId: currentProject,
        ...form,
        tags,
        isFavorite: false,
        userId: user?.id
      });
      toast.success('Snippet criado');
    }
    setIsEditing(false);
  };

  const handleSelect = (snippetId: string) => {
    const snippet = state.snippets.find(s => s.id === snippetId);
    if (snippet) {
      setSelectedSnippet(snippetId);
      setForm({
        title: snippet.title,
        code: snippet.code,
        language: snippet.language,
        tags: snippet.tags.join(', '),
        accessLevel: snippet.accessLevel || 'private',
      });
      setIsEditing(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado');
  };

  const handleDelete = (snippetId: string) => {
    const snippet = state.snippets.find(s => s.id === snippetId);
    const isOwner = snippet?.userId === user?.id;
    const isAdmin = user?.sub_role === 'org_admin' || user?.sub_role === 'manager';

    if (!isOwner && !isAdmin) {
      toast.error('Sem permissão para excluir este snippet');
      return;
    }

    deleteSnippet(snippetId);
    setSelectedSnippet(null);
    toast.success('Snippet deletado');
  };

  return (
    <div className="grid gap-4 md:grid-cols-[300px_1fr]">
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Code Snippets</CardTitle>
              <Button size="icon" variant="outline" onClick={handleNew} className="h-8 w-8 text-primary border-primary/20 hover:bg-primary/10">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Tabs defaultValue="all" className="w-full mt-2" onValueChange={(v) => setFilter(v as any)}>
              <TabsList className="grid w-full grid-cols-3 h-8 p-1">
                <TabsTrigger value="all" className="text-[10px] py-1">Tudo</TabsTrigger>
                <TabsTrigger value="private" className="text-[10px] py-1">Privado</TabsTrigger>
                <TabsTrigger value="shared" className="text-[10px] py-1">Time</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {projectSnippets.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-muted-foreground italic">Nenhum snippet encontrado</p>
              </div>
            ) : (
              projectSnippets.map(snippet => (
                <div
                  key={snippet.id}
                  className={cn(
                    "group relative rounded-lg border p-3 cursor-pointer transition-all duration-200",
                    selectedSnippet === snippet.id ? "bg-primary/10 border-primary" : "hover:bg-muted border-transparent bg-muted/30"
                  )}
                  onClick={() => handleSelect(snippet.id)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-medium text-sm truncate">{snippet.title}</h4>
                        {snippet.accessLevel === 'shared' && <Users className="h-3 w-3 text-primary" />}
                      </div>
                      <Badge variant="secondary" className="text-[10px] mt-1 h-4 px-1">
                        {snippet.language}
                      </Badge>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateSnippet(snippet.id, { isFavorite: !snippet.isFavorite });
                      }}
                      className="shrink-0"
                    >
                      <Star
                        className={cn(
                          "h-4 w-4 transition-all",
                          snippet.isFavorite ? "fill-primary text-primary" : "text-muted-foreground opacity-30 hover:opacity-100"
                        )}
                      />
                    </button>
                  </div>
                  <div className="absolute top-2 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(snippet.id); }}
                      className="p-1 hover:bg-destructive/10 rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {(isEditing || selectedSnippet) && (
          <Card className="border-primary/10 overflow-hidden">
            <div className="bg-muted px-4 py-2 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={form.accessLevel === 'shared' ? "default" : "outline"} className="gap-1 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">
                  {form.accessLevel === 'shared' ? <Users className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  {form.accessLevel === 'shared' ? 'Time' : 'Privado'}
                </Badge>
                {currentSnippet?.userId !== user?.id && currentSnippet?.userId && (
                  <span className="text-[10px] text-muted-foreground italic">
                    &bull; Snippet compartilhado
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {!isEditing && currentSnippet && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => handleCopy(currentSnippet.code)} className="h-7 text-xs">
                      <Copy className="h-3 w-3 mr-1" /> Copiar
                    </Button>
                    {canEdit && (
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="h-7 text-xs">
                        Editar
                      </Button>
                    )}
                  </>
                )}
                {isEditing && (
                  <Button size="sm" onClick={handleSave} className="h-7 text-xs bg-primary">
                    Salvar
                  </Button>
                )}
              </div>
            </div>
            <CardContent className="p-4 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 space-y-4">
                  <Input
                    placeholder="Título do snippet"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    disabled={!isEditing}
                    className="text-lg font-bold border-none px-0 focus-visible:ring-0 bg-transparent h-auto"
                  />
                  <div className="flex gap-2">
                    <Select
                      value={form.language}
                      onValueChange={(value) => setForm({ ...form, language: value })}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="w-[150px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map(lang => (
                          <SelectItem key={lang} value={lang}>
                            {lang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {isEditing && user?.organization_id && (
                      <div className="flex items-center gap-1 border rounded-md px-1 bg-muted/50 h-8">
                        <Button
                          variant={form.accessLevel === 'private' ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => setForm({ ...form, accessLevel: 'private' })}
                          className="h-6 text-[10px] gap-1 px-2"
                        >
                          <Lock className="h-3 w-3" /> Privado
                        </Button>
                        <Button
                          variant={form.accessLevel === 'shared' ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => setForm({ ...form, accessLevel: 'shared' })}
                          className="h-6 text-[10px] gap-1 px-2"
                        >
                          <Users className="h-3 w-3" /> Equipe
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Textarea
                placeholder="Cole seu código aqui..."
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="min-h-[400px] font-mono text-sm leading-relaxed bg-muted/20 border-primary/5 focus-visible:ring-primary/20"
                disabled={!isEditing}
              />
              <Input
                placeholder="Tags vinculadas (ex: react, auth, hook)"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                disabled={!isEditing}
                className="h-8 text-xs bg-muted/10 border-transparent focus-visible:ring-0 transition-all hover:bg-muted/30"
              />
            </CardContent>
          </Card>
        )}

        {!isEditing && !selectedSnippet && (
          <div className="flex flex-col items-center justify-center min-h-[500px] border-2 border-dashed rounded-xl bg-muted/20">
            <div className="text-center space-y-4">
              <div className="bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <Code2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Snippet Library</h3>
                <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">Armazene e compartilhe fragmentos de código com sua equipe.</p>
              </div>
              <Button onClick={handleNew} className="shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4 mr-2" />
                Criar Snippet
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
