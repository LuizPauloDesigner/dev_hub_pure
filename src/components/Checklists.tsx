import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Plus, Trash2, Lock } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import CryptoJS from 'crypto-js';
import { toast } from 'sonner';

export const Checklists = () => {
  const { state, currentProject, addChecklist, updateChecklist, deleteChecklist, addChecklistItem, updateChecklistItem, deleteChecklistItem } = useApp();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [showMasterDialog, setShowMasterDialog] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});
  const [editingTitles, setEditingTitles] = useState<Record<string, string>>({});

  const projectChecklists = state.checklists.filter(c => c.projectId === currentProject);

  const handleUnlock = () => {
    if (!masterPassword) {
      toast.error('Digite a senha mestra');
      return;
    }

    setIsUnlocked(true);
    setShowMasterDialog(false);
    toast.success('Checklists desbloqueadas');
  };

  const handleAddList = () => {
    if (!newListTitle.trim()) {
      toast.error('Digite um título para a lista');
      return;
    }

    addChecklist({
      projectId: currentProject,
      titulo: newListTitle,
      itens: [],
    });

    setNewListTitle('');
    setIsDialogOpen(false);
    toast.success('Lista criada');
  };

  const handleAddItem = (checklistId: string) => {
    const texto = newItemTexts[checklistId]?.trim();
    if (!texto) {
      toast.error('Digite o texto do item');
      return;
    }

    addChecklistItem(checklistId, {
      texto,
      concluido: false,
    });

    setNewItemTexts(prev => ({ ...prev, [checklistId]: '' }));
    toast.success('Item adicionado');
  };

  const handleToggleItem = (checklistId: string, itemId: string, currentValue: boolean) => {
    updateChecklistItem(checklistId, itemId, { concluido: !currentValue });
  };

  const handleUpdateTitle = (checklistId: string) => {
    const newTitle = editingTitles[checklistId]?.trim();
    if (newTitle && newTitle.length > 0) {
      updateChecklist(checklistId, { titulo: newTitle });
      setEditingTitles(prev => {
        const copy = { ...prev };
        delete copy[checklistId];
        return copy;
      });
      toast.success('Título atualizado');
    }
  };

  const handleDeleteList = (checklistId: string) => {
    deleteChecklist(checklistId);
    toast.success('Lista removida');
  };

  const handleDeleteItem = (checklistId: string, itemId: string) => {
    deleteChecklistItem(checklistId, itemId);
    toast.success('Item removido');
  };

  if (!isUnlocked) {
    return (
      <Dialog open={showMasterDialog} onOpenChange={setShowMasterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Digite a Senha Mestra
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Digite sua senha mestra para acessar as Listas Pessoais.
            </p>
            <Input
              type="password"
              placeholder="Senha mestra"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            />
            <Button onClick={handleUnlock} className="w-full">
              Desbloquear
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">✅ Listas Pessoais</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsUnlocked(false)}>
            <Lock className="h-4 w-4 mr-2" />
            Bloquear
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Lista
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Lista</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Título da lista"
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddList()}
            />
            <Button onClick={handleAddList} className="w-full">
              Criar Lista
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projectChecklists.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Nenhuma lista criada</p>
            </CardContent>
          </Card>
        ) : (
          projectChecklists.map(checklist => (
            <Card key={checklist.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  {editingTitles[checklist.id] !== undefined ? (
                    <Input
                      value={editingTitles[checklist.id]}
                      onChange={(e) => setEditingTitles(prev => ({ ...prev, [checklist.id]: e.target.value }))}
                      onBlur={() => handleUpdateTitle(checklist.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateTitle(checklist.id);
                        if (e.key === 'Escape') setEditingTitles(prev => {
                          const copy = { ...prev };
                          delete copy[checklist.id];
                          return copy;
                        });
                      }}
                      className="text-lg font-semibold"
                      autoFocus
                    />
                  ) : (
                    <CardTitle
                      className="text-lg cursor-pointer hover:text-primary"
                      onClick={() => setEditingTitles(prev => ({ ...prev, [checklist.id]: checklist.titulo }))}
                    >
                      {checklist.titulo}
                    </CardTitle>
                  )}
                  <button onClick={() => handleDeleteList(checklist.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col space-y-4">
                <div className="space-y-2 flex-1">
                  {checklist.itens.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum item ainda
                    </p>
                  ) : (
                    checklist.itens.map(item => (
                      <div key={item.id} className="flex items-start gap-2 group">
                        <Checkbox
                          checked={item.concluido}
                          onCheckedChange={() => handleToggleItem(checklist.id, item.id, item.concluido)}
                          className="mt-1"
                        />
                        <span
                          className={`flex-1 text-sm ${
                            item.concluido ? 'line-through text-muted-foreground' : ''
                          }`}
                        >
                          {item.texto}
                        </span>
                        <button
                          onClick={() => handleDeleteItem(checklist.id, item.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Input
                    placeholder="Novo item..."
                    value={newItemTexts[checklist.id] || ''}
                    onChange={(e) => setNewItemTexts(prev => ({ ...prev, [checklist.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem(checklist.id)}
                    className="text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleAddItem(checklist.id)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
