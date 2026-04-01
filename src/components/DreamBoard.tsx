import React, { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, MapPin, Briefcase, Car, Star, Heart, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { id: 'Viagens', icon: MapPin },
  { id: 'Carreira', icon: Briefcase },
  { id: 'Bens Materiais', icon: Car },
  { id: 'Experiências', icon: Star },
  { id: 'Saúde', icon: Heart }
];

export const DreamBoard = () => {
  const { state: { dreamBoard = [] }, addDreamBoardItem, deleteDreamBoardItem } = useApp();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState('Todas');
  
  const [newItem, setNewItem] = useState({
    title: '',
    category: 'Viagens',
    imageUrl: ''
  });

  const filteredItems = useMemo(() => {
    return dreamBoard.filter(item => filter === 'Todas' || item.category === filter);
  }, [dreamBoard, filter]);

  const handleAdd = () => {
    if (!newItem.title || !newItem.imageUrl) {
      toast.error('O título e a imagem são obrigatórios.');
      return;
    }

    addDreamBoardItem({
      title: newItem.title,
      category: newItem.category,
      imageUrl: newItem.imageUrl,
    });

    toast.success('Sonho adicionado ao seu mural!');
    setNewItem({ title: '', category: 'Viagens', imageUrl: '' });
    setIsDialogOpen(false);
  };

  const getFallbackImage = (category: string) => {
    // Unsplash placeholders as fallback depending on category
    const map: Record<string, string> = {
      'Viagens': 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05',
      'Carreira': 'https://images.unsplash.com/photo-1497215728101-856f4ea42174',
      'Bens Materiais': 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2',
      'Experiências': 'https://images.unsplash.com/photo-1533174000282-536c2e361288',
      'Saúde': 'https://images.unsplash.com/photo-1511688878353-3a2f5be9411e'
    };
    return map[category] || map['Experiências'];
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      
      {/* Header and Filter */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
            Quadro dos Sonhos
          </h2>
          <p className="text-muted-foreground mt-1 text-lg">
            Visualize o seu futuro. O que você quer conquistar esse ano?
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" />
              Manifestar Novo Sonho
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar ao Quadro</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>O que você quer conquistar?</Label>
                <Input 
                  placeholder="Ex: Viagem para o Japão" 
                  value={newItem.title}
                  onChange={e => setNewItem({...newItem, title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={newItem.category} onValueChange={v => setNewItem({...newItem, category: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <c.icon className="w-4 h-4 text-muted-foreground" />
                          {c.id}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  URL da Imagem
                </Label>
                <Input 
                  placeholder="Cole o link de uma imagem inspiradora..." 
                  value={newItem.imageUrl}
                  onChange={e => setNewItem({...newItem, imageUrl: e.target.value})}
                />
                {!newItem.imageUrl && (
                  <p className="text-xs text-muted-foreground inline-block mt-1">
                    Dica: Use imagens do Pinterest, Google ou Unsplash.
                  </p>
                )}
              </div>

              {newItem.imageUrl && (
                <div className="mt-4 rounded-xl overflow-hidden h-32 w-full bg-muted border flex items-center justify-center">
                  <img src={newItem.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => {
                    (e.target as HTMLImageElement).src = getFallbackImage(newItem.category);
                  }} />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setIsDialogOpen(false)} variant="outline">Cancelar</Button>
              <Button onClick={handleAdd}>Visualizar Meta</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Button 
          variant={filter === 'Todas' ? 'default' : 'outline'}
          size="sm"
          className="rounded-full"
          onClick={() => setFilter('Todas')}
        >
          Todas
        </Button>
        {CATEGORIES.map(c => {
          const Icon = c.icon;
          return (
            <Button
              key={c.id}
              variant={filter === c.id ? 'default' : 'secondary'}
              size="sm"
              className="rounded-full border gap-1.5"
              onClick={() => setFilter(c.id)}
            >
              <Icon className="w-3.5 h-3.5" />
              {c.id}
            </Button>
          )
        })}
      </div>

      {filteredItems.length === 0 ? (
        <Card className="border-dashed bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <Star className="w-16 h-16 text-primary/20 mb-4" />
            <h3 className="text-2xl font-bold mb-2">Um quadro em branco</h3>
            <p className="text-muted-foreground w-full max-w-sm mb-6">
              O primeiro passo para alcançar um sonho é visualizá-lo diariamente. Comece a criar o seu mural de inspirações.
            </p>
            <Button variant="outline" onClick={() => setIsDialogOpen(true)} className="border-primary/20 hover:bg-primary/5 text-primary">
              Preencher o Mural
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {filteredItems.map(item => (
            <div 
              key={item.id} 
              className="break-inside-avoid relative group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-primary/10"
            >
              <div className="block bg-muted aspecto-[3/4] max-h-[60vh]">
                <img 
                  src={item.imageUrl} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getFallbackImage(item.category);
                  }}
                />
              </div>
              
              {/* Overlay with info */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 transition-opacity" />
              
              <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col justify-end">
                <span className="text-xs font-bold uppercase tracking-widest text-primary/90 mb-1 drop-shadow-md">
                  {item.category}
                </span>
                <h3 className="text-xl font-bold text-white drop-shadow-md leading-tight">
                  {item.title}
                </h3>
              </div>

              {/* Action Buttons */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <Button 
                  size="icon" 
                  variant="destructive" 
                  className="w-8 h-8 rounded-full shadow-lg backdrop-blur-md bg-destructive/90"
                  onClick={() => {
                    if (confirm('Deseja retirar esse sonho do seu quadro?')) {
                      deleteDreamBoardItem(item.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
