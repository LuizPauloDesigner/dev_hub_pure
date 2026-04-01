import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Package, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export const Stock = () => {
  const { state, addStockMaterial, updateStockMaterial, deleteStockMaterial } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [nomeMaterial, setNomeMaterial] = useState('');
  const [qtdEmbalagem, setQtdEmbalagem] = useState('');
  const [unidadeEmbalagem, setUnidadeEmbalagem] = useState('g');
  const [precoPago, setPrecoPago] = useState('');

  const handleSubmit = () => {
    if (!nomeMaterial || !qtdEmbalagem || !precoPago) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const materialData = {
      nomeMaterial,
      qtdEmbalagem: parseFloat(qtdEmbalagem),
      unidadeEmbalagem,
      precoPago: parseFloat(precoPago),
    };

    if (editingId) {
      const custoUnitario = materialData.precoPago / materialData.qtdEmbalagem;
      updateStockMaterial(editingId, { ...materialData, custoUnitario });
      toast.success('Material atualizado com sucesso!');
    } else {
      addStockMaterial(materialData);
      toast.success('Material adicionado ao estoque!');
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (id: string) => {
    const material = state.stockMaterials.find(m => m.id === id);
    if (material) {
      setEditingId(id);
      setNomeMaterial(material.nomeMaterial);
      setQtdEmbalagem(material.qtdEmbalagem.toString());
      setUnidadeEmbalagem(material.unidadeEmbalagem);
      setPrecoPago(material.precoPago.toString());
      setIsDialogOpen(true);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este material?')) {
      deleteStockMaterial(id);
      toast.success('Material excluído do estoque');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setNomeMaterial('');
    setQtdEmbalagem('');
    setUnidadeEmbalagem('g');
    setPrecoPago('');
  };

  const handleNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Package className="h-8 w-8" />
          Estoque de Materiais
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Material
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Editar Material' : 'Novo Material'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome do Material *</Label>
                <Input
                  value={nomeMaterial}
                  onChange={(e) => setNomeMaterial(e.target.value)}
                  placeholder="Ex: Linha Amigurumi Círculo"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantidade na Embalagem *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={qtdEmbalagem}
                    onChange={(e) => setQtdEmbalagem(e.target.value)}
                    placeholder="Ex: 100"
                  />
                </div>
                <div>
                  <Label>Unidade *</Label>
                  <Input
                    value={unidadeEmbalagem}
                    onChange={(e) => setUnidadeEmbalagem(e.target.value)}
                    placeholder="Ex: g, ml, un"
                  />
                </div>
              </div>
              <div>
                <Label>Preço Pago (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={precoPago}
                  onChange={(e) => setPrecoPago(e.target.value)}
                  placeholder="Ex: 15.00"
                />
              </div>
              {qtdEmbalagem && precoPago && (
                <div className="p-3 bg-muted rounded">
                  <p className="text-sm font-medium">
                    Custo Unitário: R$ {(parseFloat(precoPago) / parseFloat(qtdEmbalagem)).toFixed(4)} / {unidadeEmbalagem}
                  </p>
                </div>
              )}
              <Button onClick={handleSubmit} className="w-full">
                {editingId ? 'Atualizar' : 'Adicionar'} Material
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Materiais Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {state.stockMaterials.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum material cadastrado ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Qtd. Embalagem</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Preço Pago</TableHead>
                  <TableHead>Custo Unitário</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.stockMaterials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">{material.nomeMaterial}</TableCell>
                    <TableCell>{material.qtdEmbalagem}</TableCell>
                    <TableCell>{material.unidadeEmbalagem}</TableCell>
                    <TableCell>R$ {material.precoPago.toFixed(2)}</TableCell>
                    <TableCell>R$ {material.custoUnitario.toFixed(4)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(material.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(material.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="p-4 border rounded bg-muted/50">
        <p className="text-sm text-muted-foreground">
          ⚠️ <strong>Dados Sensíveis:</strong> Informações de custos são criptografadas e protegidas pela Senha Mestra. 
          Para fazer backup, use <strong>Backup do Sistema</strong> em Configurações.
        </p>
      </div>
    </div>
  );
};
