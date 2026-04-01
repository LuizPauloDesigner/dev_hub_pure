import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Plus, Star, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

export const Cheatsheet = () => {
  const { state, currentProject, addCheatsheetItem, updateCheatsheetItem, deleteCheatsheetItem } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: '',
  });

  const projectItems = state.cheatsheet.filter(item => item.projectId === currentProject);
  const categories = ['all', ...new Set(projectItems.map(item => item.category))];

  const filteredItems = projectItems.filter(item => {
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAdd = () => {
    if (!form.title.trim() || !form.content.trim() || !form.category.trim()) {
      toast.error('Todos os campos são obrigatórios');
      return;
    }

    addCheatsheetItem({
      projectId: currentProject,
      ...form,
      isFavorite: false,
    });

    setForm({ title: '', content: '', category: '' });
    setIsDialogOpen(false);
    toast.success('Item adicionado');
  };

  const handleToggleFavorite = (itemId: string) => {
    const item = state.cheatsheet.find(i => i.id === itemId);
    if (item) {
      updateCheatsheetItem(itemId, { isFavorite: !item.isFavorite });
    }
  };

  const handleDelete = (itemId: string) => {
    deleteCheatsheetItem(itemId);
    toast.success('Item deletado');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Item do Cheatsheet</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Título"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <Input
                placeholder="Categoria"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <Textarea
                placeholder="Conteúdo"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="min-h-[150px]"
              />
              <Button onClick={handleAdd} className="w-full">
                Adicionar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar no cheatsheet..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Nenhum item encontrado</p>
            </CardContent>
          </Card>
        ) : (
          filteredItems.map(item => (
            <Card key={item.id} className="group relative">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{item.category}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleToggleFavorite(item.id)}>
                      <Star
                        className={`h-4 w-4 ${
                          item.isFavorite ? 'fill-primary text-primary' : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-lg overflow-x-auto">
                  {item.content}
                </pre>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
