import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Plus, Trash2, Edit2, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface BudgetItemForm {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

export const Budgets = () => {
  const { 
    state, 
    currentProject,
    addBudget,
    updateBudget,
    deleteBudget,
  } = useApp();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [clientId, setClientId] = useState('');
  const [items, setItems] = useState<BudgetItemForm[]>([]);
  const [discount, setDiscount] = useState('0');
  const [terms, setTerms] = useState('');
  const [status, setStatus] = useState<'draft' | 'sent' | 'approved'>('draft');
  const [viewBudgetId, setViewBudgetId] = useState<string | null>(null);

  const projectBudgets = state.budgets.filter(b => b.projectId === currentProject);
  const projectContacts = state.contacts.filter(c => c.projectId === currentProject);

  const handleNewBudget = () => {
    setEditingBudget(null);
    setClientId('');
    setItems([]);
    setDiscount('0');
    setTerms('Prazo de pagamento: 30 dias\nValidade da proposta: 15 dias\nForma de pagamento: A combinar');
    setStatus('draft');
    setIsEditorOpen(true);
  };

  const handleEditBudget = (budgetId: string) => {
    const budget = projectBudgets.find(b => b.id === budgetId);
    if (budget) {
      setEditingBudget(budgetId);
      setClientId(budget.clientId);
      setItems(budget.items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
      })));
      setDiscount(budget.discount.toString());
      setTerms(budget.terms);
      setStatus(budget.status);
      setIsEditorOpen(true);
    }
  };

  const addItem = () => {
    setItems([...items, {
      id: Date.now().toString(),
      description: '',
      quantity: '1',
      unitPrice: '0',
    }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof BudgetItemForm, value: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const selectCatalogItem = (itemId: string, catalogItemId: string) => {
    const catalogItem = state.serviceCatalog.find(i => i.id === catalogItemId);
    if (catalogItem) {
      const price = catalogItem.useIdealHourlyRate 
        ? state.pricingData.idealHourlyRate 
        : catalogItem.unitPrice;
      
      setItems(items.map(item =>
        item.id === itemId
          ? { ...item, description: catalogItem.description, unitPrice: price.toString() }
          : item
      ));
    }
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      return sum + (quantity * unitPrice);
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = parseFloat(discount) || 0;
    return subtotal - discountAmount;
  };

  const handleSave = () => {
    if (!clientId) {
      toast.error('Selecione um cliente');
      return;
    }

    if (items.length === 0) {
      toast.error('Adicione pelo menos um item');
      return;
    }

    const budgetData = {
      projectId: currentProject,
      clientId,
      items: items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: parseFloat(item.quantity) || 0,
        unitPrice: parseFloat(item.unitPrice) || 0,
        total: (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0),
      })),
      subtotal: calculateSubtotal(),
      discount: parseFloat(discount) || 0,
      total: calculateTotal(),
      terms,
      status,
    };

    if (editingBudget) {
      updateBudget(editingBudget, budgetData);
      toast.success('Orçamento atualizado');
    } else {
      addBudget(budgetData);
      toast.success('Orçamento criado');
    }

    setIsEditorOpen(false);
  };

  const handleDelete = (budgetId: string) => {
    if (confirm('Deseja deletar este orçamento?')) {
      deleteBudget(budgetId);
      toast.success('Orçamento deletado');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      draft: 'outline',
      sent: 'secondary',
      approved: 'default',
    };
    const labels = {
      draft: 'Rascunho',
      sent: 'Enviado',
      approved: 'Aprovado',
    };
    return <Badge variant={variants[status]}>{labels[status as keyof typeof labels]}</Badge>;
  };

  const BudgetPreview = ({ budgetId }: { budgetId: string }) => {
    const budget = projectBudgets.find(b => b.id === budgetId);
    const client = projectContacts.find(c => c.id === budget?.clientId);

    if (!budget || !client) return null;

    return (
      <Dialog open={viewBudgetId === budgetId} onOpenChange={(open) => !open && setViewBudgetId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="print:p-8" id="budget-print">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h1 className="text-3xl font-bold">Orçamento</h1>
                  <p className="text-muted-foreground">Nº {budget.id}</p>
                  <p className="text-sm text-muted-foreground">
                    Emitido em: {new Date(budget.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                {state.billingInfo.logoUrl && (
                  <img src={state.billingInfo.logoUrl} alt="Logo" className="h-16" />
                )}
              </div>

              {/* Company and Client Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">De:</h3>
                  <p className="font-medium">{state.billingInfo.companyName}</p>
                  <p className="text-sm text-muted-foreground">{state.billingInfo.address}</p>
                  <p className="text-sm text-muted-foreground">{state.billingInfo.taxId}</p>
                  <p className="text-sm text-muted-foreground">{state.billingInfo.email}</p>
                  <p className="text-sm text-muted-foreground">{state.billingInfo.phone}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Para:</h3>
                  <p className="font-medium">{client.nomeCompleto}</p>
                  {client.empresa && <p className="text-sm text-muted-foreground">{client.empresa}</p>}
                  {client.emails[0] && <p className="text-sm text-muted-foreground">{client.emails[0]}</p>}
                  {client.telefones[0] && <p className="text-sm text-muted-foreground">{client.telefones[0]}</p>}
                </div>
              </div>

              {/* Items Table */}
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead className="text-right">Valor Unitário</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budget.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">R$ {item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right">R$ {item.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>R$ {budget.subtotal.toFixed(2)}</span>
                  </div>
                  {budget.discount > 0 && (
                    <div className="flex justify-between text-destructive">
                      <span>Desconto:</span>
                      <span>- R$ {budget.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>R$ {budget.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Terms */}
              {budget.terms && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Termos e Condições:</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{budget.terms}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 print:hidden">
            <Button variant="outline" onClick={() => window.print()}>
              Imprimir
            </Button>
            <Button onClick={() => setViewBudgetId(null)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gerador de Orçamentos</h2>
        <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewBudget}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Orçamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBudget ? 'Editar' : 'Novo'} Orçamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Cliente *</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectContacts.map(contact => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.nomeCompleto} {contact.empresa && `(${contact.empresa})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="sent">Enviado</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Itens *</Label>
                  <Button size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Item
                  </Button>
                </div>
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <Card key={item.id}>
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Label className="text-xs">Descrição</Label>
                            <Input
                              value={item.description}
                              onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                              placeholder="Ex: Desenvolvimento de website"
                            />
                          </div>
                          <div className="w-48">
                            <Label className="text-xs">Do Catálogo</Label>
                            <Select onValueChange={(v) => selectCatalogItem(item.id, v)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecionar" />
                              </SelectTrigger>
                              <SelectContent>
                                {state.serviceCatalog.map(catalogItem => (
                                  <SelectItem key={catalogItem.id} value={catalogItem.id}>
                                    {catalogItem.description}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">Quantidade</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Valor Unitário (R$)</Label>
                            <Input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Total</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                value={`R$ ${((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)).toFixed(2)}`}
                                disabled
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => removeItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Desconto (R$)</Label>
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="flex items-end">
                  <div className="w-full">
                    <Label>Total</Label>
                    <Input
                      value={`R$ ${calculateTotal().toFixed(2)}`}
                      disabled
                      className="font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Termos e Condições</Label>
                <Textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  rows={4}
                  placeholder="Prazo de pagamento, validade, etc."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditorOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  Salvar Orçamento
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {projectBudgets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Nenhum orçamento criado</p>
            <p className="text-sm text-muted-foreground mb-4">
              Crie seu primeiro orçamento para começar
            </p>
            <Button onClick={handleNewBudget}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Orçamento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Orçamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectBudgets.map(budget => {
                  const client = projectContacts.find(c => c.id === budget.clientId);
                  return (
                    <TableRow key={budget.id}>
                      <TableCell className="font-mono text-sm">{budget.id}</TableCell>
                      <TableCell>{client?.nomeCompleto || 'Cliente não encontrado'}</TableCell>
                      <TableCell>{new Date(budget.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-right font-medium">
                        R$ {budget.total.toFixed(2)}
                      </TableCell>
                      <TableCell>{getStatusBadge(budget.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setViewBudgetId(budget.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEditBudget(budget.id)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(budget.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Preview dialogs */}
      {projectBudgets.map(budget => (
        <BudgetPreview key={budget.id} budgetId={budget.id} />
      ))}
    </div>
  );
};
