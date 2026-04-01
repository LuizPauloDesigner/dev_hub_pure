import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Plus, Star, Trash2, Save, Bold, Italic, List, CheckSquare, Code, Link as LinkIcon, Image as ImageIcon, Table, Users, Lock, ShieldCheck, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';

export const Notes = () => {
  const { state, currentProject, addNote, updateNote, deleteNote } = useApp();
  const { user } = useAuth();
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [accessLevel, setAccessLevel] = useState<'private' | 'shared'>('private');
  const [isEditing, setIsEditing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'private' | 'shared'>('all');

  const projectNotes = state.notes.filter(note => {
    const isProject = note.projectId === currentProject;
    if (filter === 'all') return isProject;
    return isProject && note.accessLevel === filter;
  });

  const currentNote = selectedNote ? state.notes.find(n => n.id === selectedNote) : null;
  const canEdit = !selectedNote || currentNote?.userId === user?.id || (currentNote?.accessLevel === 'shared' && (user?.sub_role === 'org_admin' || user?.sub_role === 'manager'));

  const handleNew = () => {
    setSelectedNote(null);
    setTitle('');
    setContent('');
    setAccessLevel('private');
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('O título é obrigatório');
      return;
    }

    if (selectedNote) {
      updateNote(selectedNote, { title, content, accessLevel });
      toast.success('Nota atualizada');
    } else {
      addNote({
        projectId: currentProject,
        title,
        content,
        isFavorite: false,
        accessLevel,
        userId: user?.id
      });
      toast.success('Nota criada');
    }
    setIsEditing(false);
  };

  const handleSelect = (noteId: string) => {
    const note = state.notes.find(n => n.id === noteId);
    if (note) {
      setSelectedNote(noteId);
      setTitle(note.title);
      setContent(note.content);
      setAccessLevel(note.accessLevel || 'private');
      setIsEditing(false);
    }
  };

  const handleToggleFavorite = (noteId: string) => {
    const note = state.notes.find(n => n.id === noteId);
    if (note) {
      updateNote(noteId, { isFavorite: !note.isFavorite });
    }
  };

  const handleDelete = (noteId: string) => {
    const note = state.notes.find(n => n.id === noteId);
    const isOwner = note?.userId === user?.id;
    const isAdmin = user?.sub_role === 'org_admin' || user?.sub_role === 'manager';

    if (!isOwner && !isAdmin) {
      toast.error('Sem permissão para excluir esta nota');
      return;
    }

    deleteNote(noteId);
    if (selectedNote === noteId) {
      setSelectedNote(null);
      setTitle('');
      setContent('');
    }
    toast.success('Nota deletada');
  };

  const insertMarkdown = (syntax: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    let newText = '';
    let cursorOffset = 0;

    switch (syntax) {
      case 'bold':
        newText = `**${selectedText || 'texto'}**`;
        cursorOffset = selectedText ? newText.length : 2;
        break;
      case 'italic':
        newText = `*${selectedText || 'texto'}*`;
        cursorOffset = selectedText ? newText.length : 1;
        break;
      case 'list':
        newText = `\n- ${selectedText || 'item'}`;
        cursorOffset = newText.length;
        break;
      case 'checklist':
        newText = `\n- [ ] ${selectedText || 'tarefa'}`;
        cursorOffset = newText.length;
        break;
      case 'code':
        newText = `\`\`\`\n${selectedText || 'código'}\n\`\`\``;
        cursorOffset = selectedText ? newText.length : 4;
        break;
      case 'link':
        newText = `[${selectedText || 'texto'}](url)`;
        cursorOffset = selectedText ? newText.length - 4 : 1;
        break;
      case 'image':
        newText = `![${selectedText || 'alt'}](url)`;
        cursorOffset = newText.length - 4;
        break;
      case 'table':
        newText = `\n| Coluna 1 | Coluna 2 |\n|----------|----------|\n| Célula 1 | Célula 2 |\n`;
        cursorOffset = newText.length;
        break;
      default:
        return;
    }

    const newContent = content.substring(0, start) + newText + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 0);
  };

  return (
    <div className="grid gap-4 md:grid-cols-[300px_1fr]">
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notas</CardTitle>
              <Button size="icon" variant="outline" onClick={handleNew} className="h-8 w-8 text-primary border-primary/20 hover:bg-primary/10">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Tabs defaultValue="all" className="w-full mt-2" onValueChange={(v) => setFilter(v as any)}>
              <TabsList className="grid w-full grid-cols-3 h-8 p-1">
                <TabsTrigger value="all" className="text-[10px] py-1">Todas</TabsTrigger>
                <TabsTrigger value="private" className="text-[10px] py-1">Privadas</TabsTrigger>
                <TabsTrigger value="shared" className="text-[10px] py-1">Time</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {projectNotes.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-muted-foreground italic">Nenhuma nota encontrada</p>
              </div>
            ) : (
              projectNotes.map(note => (
                <div
                  key={note.id}
                  className={cn(
                    "group relative flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer transition-all duration-200",
                    selectedNote === note.id ? "bg-primary/10 border-primary" : "hover:bg-muted border-transparent bg-muted/30"
                  )}
                  onClick={() => handleSelect(note.id)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(note.id);
                    }}
                    className="shrink-0 z-10"
                  >
                    <Star
                      className={cn(
                        "h-4 w-4 transition-all",
                        note.isFavorite ? "fill-primary text-primary scale-110" : "text-muted-foreground opacity-30 hover:opacity-100"
                      )}
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-sm truncate">{note.title}</p>
                      {note.accessLevel === 'shared' && <Users className="h-3 w-3 text-primary" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(note.id);
                    }}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {(isEditing || selectedNote) && (
          <>
            <Card className="border-primary/10 overflow-hidden">
              <div className="bg-muted px-4 py-2 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={accessLevel === 'shared' ? "default" : "outline"} className="gap-1 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">
                    {accessLevel === 'shared' ? <Users className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                    {accessLevel === 'shared' ? 'Equipe' : 'Privada'}
                  </Badge>
                  {currentNote?.userId !== user?.id && currentNote?.userId && (
                    <span className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                      &bull; Criado por outro membro
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {canEdit && (
                    <Button onClick={handleSave} size="sm" className="h-7 px-3 bg-primary hover:bg-primary/90">
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                      Salvar
                    </Button>
                  )}
                  {!isEditing && canEdit && (
                    <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="h-7 px-3">
                      Editar
                    </Button>
                  )}
                </div>
              </div>
              <CardContent className="p-4 space-y-4">
                <div className="flex flex-col gap-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Título da nota"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={!isEditing}
                      className="text-lg font-bold border-none px-0 focus-visible:ring-0 bg-transparent h-auto"
                    />

                    {isEditing && user?.organizationId && (
                      <div className="flex items-center gap-1 border rounded-md px-1 bg-muted/50 h-9">
                        <Button
                          variant={accessLevel === 'private' ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => setAccessLevel('private')}
                          className="h-7 text-[10px] gap-1"
                        >
                          <Lock className="h-3 w-3" /> Privado
                        </Button>
                        <Button
                          variant={accessLevel === 'shared' ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => setAccessLevel('shared')}
                          className="h-7 text-[10px] gap-1"
                        >
                          <Users className="h-3 w-3" /> Equipe
                        </Button>
                      </div>
                    )}
                  </div>

                  {isEditing && (
                    <div className="flex flex-wrap gap-1 p-1 bg-muted/30 rounded-md border border-dashed">
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertMarkdown('bold')} className="h-7 w-7 p-0" title="Negrito"><Bold className="h-4 w-4" /></Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertMarkdown('italic')} className="h-7 w-7 p-0" title="Itálico"><Italic className="h-4 w-4" /></Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertMarkdown('list')} className="h-7 w-7 p-0" title="Lista"><List className="h-4 w-4" /></Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertMarkdown('checklist')} className="h-7 w-7 p-0" title="Checklist"><CheckSquare className="h-4 w-4" /></Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertMarkdown('code')} className="h-7 w-7 p-0" title="Código"><Code className="h-4 w-4" /></Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertMarkdown('link')} className="h-7 w-7 p-0" title="Link"><LinkIcon className="h-4 w-4" /></Button>
                    </div>
                  )}

                  <Textarea
                    placeholder="Escreva sua nota em Markdown..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[400px] font-mono border-none px-0 focus-visible:ring-0 bg-transparent resize-none leading-relaxed"
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            </Card>

            {content && (
              <Card className="border-dashed">
                <CardHeader className="py-3 bg-primary/5">
                  <CardTitle className="text-xs uppercase tracking-widest flex items-center gap-2 opacity-60">
                    <ShieldCheck className="h-3 w-3" /> Preview Renderizado
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="prose dark:prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        input: ({ node, ...props }) => {
                          if (props.type === 'checkbox') {
                            return <input {...props} className="mr-2" />;
                          }
                          return <input {...props} />;
                        }
                      }}
                    >
                      {content}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {!isEditing && !selectedNote && (
          <div className="flex flex-col items-center justify-center min-h-[500px] border-2 border-dashed rounded-xl bg-muted/20">
            <div className="text-center space-y-4">
              <div className="bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Gerenciador de Notas</h3>
                <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">Colabore com seu time ou mantenha suas ideias em segurança.</p>
              </div>
              <Button onClick={handleNew} className="shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4 mr-2" />
                Criar Nova Nota
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
