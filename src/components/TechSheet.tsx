import { useState } from 'react';
import { useApp, TechSheetItem } from '@/contexts/AppContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { FileText, Plus, Pencil, Trash2, Save, Image as ImageIcon, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

export const TechSheet = () => {
  const { state, currentProject, addTechSheet, updateTechSheet, deleteTechSheet } = useApp();
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [nomeProduto, setNomeProduto] = useState('');
  const [rendimento, setRendimento] = useState('1 unidade');
  const [tempoProducao, setTempoProducao] = useState('0');
  const [imagemProduto, setImagemProduto] = useState('');
  const [itens, setItens] = useState<TechSheetItem[]>([]);
  
  // Add item dialog states
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [quantidadeUsada, setQuantidadeUsada] = useState('');

  const projectSheets = state.techSheets.filter(s => s.projectId === currentProject);
  const selectedSheet = selectedSheetId ? projectSheets.find(s => s.id === selectedSheetId) : null;

  const handleNewSheet = () => {
    setSelectedSheetId(null);
    setIsEditing(true);
    setNomeProduto('');
    setRendimento('1 unidade');
    setTempoProducao('0');
    setImagemProduto('');
    setItens([]);
  };

  const handleEditSheet = (sheetId: string) => {
    const sheet = projectSheets.find(s => s.id === sheetId);
    if (sheet) {
      setSelectedSheetId(sheet.id);
      setIsEditing(true);
      setNomeProduto(sheet.nomeProduto);
      setRendimento(sheet.rendimento);
      setTempoProducao(sheet.tempoProducao?.toString() || '0');
      setImagemProduto(sheet.imagemProduto || '');
      setItens(sheet.itens);
    }
  };

  const handleSaveSheet = () => {
    if (!nomeProduto) {
      toast.error('Digite o nome do produto');
      return;
    }

    const custoTotalMateriais = itens.reduce((sum, item) => sum + item.custoTotalItem, 0);
    const minutosProducao = parseFloat(tempoProducao) || 0;
    const custoMaoDeObra = (minutosProducao / 60) * (state.pricingData?.idealHourlyRate || 0);
    const custoTotalProduto = custoTotalMateriais + custoMaoDeObra;
    
    const rendimentoNum = parseFloat(rendimento.split(' ')[0]) || 1;
    const custoPorUnidade = custoTotalProduto / rendimentoNum;

    const sheetData = {
      projectId: currentProject,
      nomeProduto,
      rendimento,
      tempoProducao: minutosProducao,
      imagemProduto,
      itens,
      custoTotalProduto,
      custoPorUnidade,
    };

    if (selectedSheetId) {
      updateTechSheet(selectedSheetId, sheetData);
      toast.success('Ficha Técnica atualizada!');
    } else {
      addTechSheet(sheetData);
      toast.success('Ficha Técnica criada!');
    }

    setIsEditing(false);
  };

  const handleDeleteSheet = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta Ficha Técnica?')) {
      deleteTechSheet(id);
      if (selectedSheetId === id) {
        setSelectedSheetId(null);
      }
      toast.success('Ficha Técnica excluída');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error('A imagem deve ter no máximo 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagemProduto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddItem = () => {
    if (!selectedMaterialId || !quantidadeUsada) {
      toast.error('Selecione um material e digite a quantidade');
      return;
    }

    const material = state.stockMaterials.find(m => m.id === selectedMaterialId);
    if (!material) return;

    const qtdUsada = parseFloat(quantidadeUsada);
    const custoTotalItem = material.custoUnitario * qtdUsada;

    const newItem: TechSheetItem = {
      id: Date.now().toString(),
      materialId: material.id,
      materialName: material.nomeMaterial,
      quantidadeUsada: qtdUsada,
      unidade: material.unidadeEmbalagem,
      custoUnitario: material.custoUnitario,
      custoTotalItem,
    };

    setItens([...itens, newItem]);
    setIsAddItemDialogOpen(false);
    setSelectedMaterialId('');
    setQuantidadeUsada('');
    toast.success('Item adicionado à ficha');
  };

  const handleRemoveItem = (itemId: string) => {
    setItens(itens.filter(item => item.id !== itemId));
  };

  const custoTotalMateriais = itens.reduce((sum, item) => sum + item.custoTotalItem, 0);
  const minutosProducao = parseFloat(tempoProducao) || 0;
  const custoMaoDeObra = (minutosProducao / 60) * (state.pricingData?.idealHourlyRate || 0);
  const custoTotalProduto = custoTotalMateriais + custoMaoDeObra;
  
  const rendimentoNum = parseFloat(rendimento.split(' ')[0]) || 1;
  const custoPorUnidade = custoTotalProduto / rendimentoNum;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8" />
          Fichas Técnicas
        </h1>
        <Button onClick={handleNewSheet}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Ficha
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        {/* Sidebar - Lista de Fichas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Fichas/Produtos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-16rem)]">
              <div className="space-y-1 p-4 pt-0">
                {projectSheets.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">
                    Nenhuma ficha criada
                  </p>
                ) : (
                  projectSheets.map((sheet) => (
                    <div
                      key={sheet.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-center gap-3 ${
                        selectedSheetId === sheet.id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => {
                        setSelectedSheetId(sheet.id);
                        setIsEditing(false);
                      }}
                    >
                      {sheet.imagemProduto ? (
                        <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 border bg-muted">
                          <img src={sheet.imagemProduto} alt={sheet.nomeProduto} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0 border">
                          <ImageIcon className="h-5 w-5 text-muted-foreground opacity-50" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{sheet.nomeProduto}</p>
                        <p className="text-xs opacity-70 mt-1 truncate">
                          R$ {sheet.custoPorUnidade.toFixed(2)} / unidade
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Área Principal - Editor/Visualizador */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {isEditing ? (selectedSheetId ? 'Editar Ficha' : 'Nova Ficha') : 'Visualizar Ficha'}
              </CardTitle>
              {selectedSheet && !isEditing && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditSheet(selectedSheet.id)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteSheet(selectedSheet.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              )}
              {isEditing && (
                <Button onClick={handleSaveSheet}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Ficha
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!isEditing && !selectedSheet ? (
              <div className="text-center py-16 text-muted-foreground">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>Selecione uma ficha ou crie uma nova</p>
              </div>
            ) : isEditing ? (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <Label className="mb-2 block">Imagem do Produto</Label>
                    <div className="w-32 h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center bg-muted/30 relative overflow-hidden group">
                      {imagemProduto ? (
                        <>
                          <img src={imagemProduto} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Button variant="ghost" size="icon" className="text-white hover:text-white" onClick={() => setImagemProduto('')}>
                              <X className="h-5 w-5" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                          <span className="text-xs text-muted-foreground text-center px-2">Clique para upload<br/>(Max 2MB)</span>
                          <Input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleImageUpload} />
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label>Nome do Produto *</Label>
                        <Input
                          value={nomeProduto}
                          onChange={(e) => setNomeProduto(e.target.value)}
                          placeholder="Ex: Boneco Amigurumi P"
                        />
                      </div>
                      <div>
                        <Label>Rendimento *</Label>
                        <Input
                          value={rendimento}
                          onChange={(e) => setRendimento(e.target.value)}
                          placeholder="Ex: 1 unidade, 10 porções"
                        />
                      </div>
                      <div>
                        <Label>Tempo Produção (Minutos)</Label>
                        <Input
                          type="number"
                          value={tempoProducao}
                          onChange={(e) => setTempoProducao(e.target.value)}
                          placeholder="Ex: 10, 30, 120"
                          min="0"
                          step="1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Custo Mão de Obra: R$ {custoMaoDeObra.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label>Materiais Utilizados</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddItemDialogOpen(true)}
                      disabled={state.stockMaterials.length === 0}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Item
                    </Button>
                  </div>

                  {state.stockMaterials.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg">
                      <p>Nenhum material no estoque</p>
                      <p className="mt-2">Adicione materiais no módulo "📦 Estoque" primeiro</p>
                    </div>
                  ) : itens.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg">
                      Nenhum item adicionado ainda
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Material</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead>Custo Unit.</TableHead>
                          <TableHead>Custo Total</TableHead>
                          <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {itens.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.materialName}</TableCell>
                            <TableCell>
                              {item.quantidadeUsada} {item.unidade}
                            </TableCell>
                            <TableCell>R$ {item.custoUnitario.toFixed(4)}</TableCell>
                            <TableCell className="font-bold">R$ {item.custoTotalItem.toFixed(2)}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Custo Total do Produto</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-primary">
                        R$ {custoTotalProduto.toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">
                        Custo por {rendimento}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-primary">
                        R$ {custoPorUnidade.toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : selectedSheet ? (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {selectedSheet.imagemProduto && (
                    <div className="flex-shrink-0">
                      <div className="w-32 h-32 rounded-lg overflow-hidden border bg-muted">
                        <img src={selectedSheet.imagemProduto} alt={selectedSheet.nomeProduto} className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label className="text-muted-foreground">Produto</Label>
                      <p className="text-lg font-semibold">{selectedSheet.nomeProduto}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Rendimento</Label>
                      <p className="text-lg font-semibold">{selectedSheet.rendimento}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Tempo Produção</Label>
                      <p className="text-lg font-semibold">{selectedSheet.tempoProducao || 0} min <span className="text-sm font-normal text-muted-foreground block">(Mão de Obra: R$ {(((selectedSheet.tempoProducao || 0) / 60) * (state.pricingData?.idealHourlyRate || 0)).toFixed(2)})</span></p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground mb-2 block">Materiais Utilizados</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Custo Unit.</TableHead>
                        <TableHead>Custo Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSheet.itens.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.materialName}</TableCell>
                          <TableCell>
                            {item.quantidadeUsada} {item.unidade}
                          </TableCell>
                          <TableCell>R$ {item.custoUnitario.toFixed(4)}</TableCell>
                          <TableCell className="font-bold">R$ {item.custoTotalItem.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Custo Total do Produto</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-primary">
                        R$ {selectedSheet.custoTotalProduto.toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">
                        Custo por {selectedSheet.rendimento}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-primary">
                        R$ {selectedSheet.custoPorUnidade.toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Dialog para Adicionar Item */}
      <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Material à Ficha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Material *</Label>
              <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um material..." />
                </SelectTrigger>
                <SelectContent>
                  {state.stockMaterials.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.nomeMaterial} (R$ {material.custoUnitario.toFixed(4)}/{material.unidadeEmbalagem})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantidade Usada *</Label>
              <Input
                type="number"
                value={quantidadeUsada}
                onChange={(e) => setQuantidadeUsada(e.target.value)}
                placeholder="Ex: 50"
                min="0"
                step="0.01"
              />
              {selectedMaterialId && (
                <p className="text-xs text-muted-foreground mt-1">
                  Unidade: {state.stockMaterials.find(m => m.id === selectedMaterialId)?.unidadeEmbalagem}
                </p>
              )}
            </div>
            {selectedMaterialId && quantidadeUsada && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium">Custo Total do Item:</p>
                <p className="text-2xl font-bold text-primary">
                  R$ {(
                    (state.stockMaterials.find(m => m.id === selectedMaterialId)?.custoUnitario || 0) *
                    parseFloat(quantidadeUsada)
                  ).toFixed(2)}
                </p>
              </div>
            )}
            <Button onClick={handleAddItem} className="w-full">
              Adicionar Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-card rounded-lg border p-6">
        <p className="text-sm text-muted-foreground text-center">
          ⚠️ <strong>Módulo Sensível:</strong> Os dados das Fichas Técnicas são protegidos pela Senha Mestra.
        </p>
      </div>
    </div>
  );
};