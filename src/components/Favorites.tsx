import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Plus, ExternalLink, Trash2, Edit2, Star, Globe } from 'lucide-react';
import { toast } from 'sonner';

export const Favorites = () => {
  const { state, currentProject, addBookmark, updateBookmark, deleteBookmark } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [form, setForm] = useState({
    title: '',
    url: '',
    description: '',
    category: '',
  });

  const projectBookmarks = (state.bookmarks || []).filter(b => b.projectId === currentProject);
  const categories = ['all', ...new Set(projectBookmarks.map(b => b.category))];

  const filteredBookmarks = projectBookmarks.filter(
    b => filterCategory === 'all' || b.category === filterCategory
  );

  const handleOpenDialog = (bookmark?: typeof projectBookmarks[0]) => {
    if (bookmark) {
      setEditingId(bookmark.id);
      setForm({
        title: bookmark.title,
        url: bookmark.url,
        description: bookmark.description,
        category: bookmark.category,
      });
    } else {
      setEditingId(null);
      setForm({ title: '', url: '', description: '', category: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.url.trim()) {
      toast.error('Título e URL são obrigatórios');
      return;
    }

    // Validate URL
    try {
      new URL(form.url.startsWith('http') ? form.url : `https://${form.url}`);
    } catch {
      toast.error('URL inválida');
      return;
    }

    const url = form.url.startsWith('http') ? form.url : `https://${form.url}`;
    const favicon = `https://www.google.com/s2/favicons?domain=${url}&sz=64`;

    if (editingId) {
      updateBookmark(editingId, { ...form, url, favicon });
      toast.success('Site atualizado');
    } else {
      addBookmark({
        projectId: currentProject,
        ...form,
        url,
        favicon,
      });
      toast.success('Site adicionado aos favoritos');
    }

    setForm({ title: '', url: '', description: '', category: '' });
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteBookmark(id);
    toast.success('Site removido');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-6 w-6 text-primary fill-primary" />
          <h2 className="text-2xl font-bold">Meus Sites Favoritos</h2>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Site
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar' : 'Novo'} Site Favorito</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Título do site"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <Input
                placeholder="URL (ex: github.com ou https://github.com)"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
              <Textarea
                placeholder="Descrição (opcional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="min-h-[80px]"
              />
              <Input
                placeholder="Categoria (ex: Dev Tools, Learning, etc)"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <Button onClick={handleSave} className="w-full">
                {editingId ? 'Atualizar' : 'Adicionar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <Button
            key={cat}
            variant={filterCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory(cat)}
          >
            {cat === 'all' ? 'Todos' : cat}
          </Button>
        ))}
      </div>

      {filteredBookmarks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {projectBookmarks.length === 0
                ? 'Nenhum site favorito ainda'
                : 'Nenhum site nesta categoria'}
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Site
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBookmarks.map(bookmark => (
            <Card key={bookmark.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-3">
                  {bookmark.favicon ? (
                    <img
                      src={bookmark.favicon}
                      alt={bookmark.title}
                      className="h-8 w-8 rounded"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/32?text=🌐';
                      }}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{bookmark.title}</CardTitle>
                    {bookmark.category && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        {bookmark.category}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {bookmark.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {bookmark.description}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Visitar
                    </Button>
                  </a>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenDialog(bookmark)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(bookmark.id)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground truncate">{bookmark.url}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
