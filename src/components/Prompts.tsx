import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Plus, Star, Trash2, Copy, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

export const Prompts = () => {
  const { state, currentProject, addPrompt, updatePrompt, deletePrompt } = useApp();
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    notes: '',
    tags: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  const projectPrompts = state.prompts.filter(p => p.projectId === currentProject);
  const currentPrompt = selectedPrompt ? state.prompts.find(p => p.id === selectedPrompt) : null;

  const handleNew = () => {
    setSelectedPrompt(null);
    setForm({ title: '', content: '', notes: '', tags: '' });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Título e prompt são obrigatórios');
      return;
    }

    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);

    if (selectedPrompt) {
      updatePrompt(selectedPrompt, { ...form, tags });
      toast.success('Prompt atualizado');
    } else {
      addPrompt({ projectId: currentProject, ...form, tags, isFavorite: false });
      toast.success('Prompt criado');
    }
    setIsEditing(false);
  };

  const handleSelect = (promptId: string) => {
    const prompt = state.prompts.find(p => p.id === promptId);
    if (prompt) {
      setSelectedPrompt(promptId);
      setForm({
        title: prompt.title,
        content: prompt.content,
        notes: prompt.notes,
        tags: prompt.tags.join(', '),
      });
      setIsEditing(false);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Prompt copiado');
  };

  const handleExport = () => {
    const data = JSON.stringify(projectPrompts, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prompts.json';
    a.click();
    toast.success('Prompts exportados');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const prompts = JSON.parse(event.target?.result as string);
        prompts.forEach((p: any) => {
          addPrompt({
            projectId: currentProject,
            title: p.title,
            content: p.content,
            notes: p.notes || '',
            tags: p.tags || [],
            isFavorite: false,
          });
        });
        toast.success('Prompts importados');
      } catch (error) {
        toast.error('Erro ao importar');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="grid gap-4 md:grid-cols-[350px_1fr]">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Prompts de IA</CardTitle>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={handleNew}>
                <Plus className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={handleExport}>
                <Download className="h-4 w-4" />
              </Button>
              <label className="cursor-pointer">
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Upload className="h-4 w-4" />
                </div>
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {projectPrompts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum prompt</p>
          ) : (
            projectPrompts.map(prompt => (
              <div
                key={prompt.id}
                className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                  selectedPrompt === prompt.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                }`}
                onClick={() => handleSelect(prompt.id)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-medium">{prompt.title}</h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updatePrompt(prompt.id, { isFavorite: !prompt.isFavorite });
                    }}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        prompt.isFavorite ? 'fill-primary text-primary' : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {prompt.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {(isEditing || selectedPrompt) && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Editor de Prompt</CardTitle>
                <div className="flex gap-2">
                  {!isEditing && currentPrompt && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleCopy(currentPrompt.content)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          deletePrompt(currentPrompt.id);
                          setSelectedPrompt(null);
                          toast.success('Prompt deletado');
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {isEditing && (
                    <Button size="sm" onClick={handleSave}>
                      Salvar
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Título do prompt"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                disabled={!isEditing}
              />
              <Textarea
                placeholder="Escreva seu prompt aqui..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="min-h-[200px]"
                disabled={!isEditing}
              />
              <Textarea
                placeholder="Notas/Contexto (opcional)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="min-h-[100px]"
                disabled={!isEditing}
              />
              <Input
                placeholder="Tags (separadas por vírgula)"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                disabled={!isEditing}
              />
            </CardContent>
          </Card>
        )}

        {!isEditing && !selectedPrompt && (
          <Card>
            <CardContent className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">Selecione ou crie um prompt</p>
                <Button onClick={handleNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Prompt
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
