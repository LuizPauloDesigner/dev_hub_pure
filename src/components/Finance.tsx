import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import { toast } from 'sonner';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export const Finance = () => {
  const { 
    state, 
    currentProject,
    addFinancialTransaction,
    updateFinancialTransaction,
    deleteFinancialTransaction,
  } = useApp();

  const [showReports, setShowReports] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    categoryId: '',
    accountId: '',
    recurrence: 'never' as 'never' | 'monthly' | 'yearly',
  });

  const transactions = (state.financialTransactions || []).filter(t => t.projectId === currentProject);
  const categories = (state.financialCategories || []).filter(c => c.projectId === currentProject);
  const accounts = (state.financialAccounts || []).filter(a => a.projectId === currentProject);
  const budgets = (state.financialBudgets || []).filter(b => b.projectId === currentProject);

  // Cálculos do resumo
  const summary = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));
    
    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expenses;
    
    return { income, expenses, balance };
  }, [transactions]);

  // Dados para gráfico de pizza (despesas por categoria)
  const pieData = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthExpenses = transactions.filter(t => 
      t.type === 'expense' && t.date.startsWith(currentMonth)
    );

    const categoryTotals: Record<string, number> = {};
    monthExpenses.forEach(t => {
      const category = categories.find(c => c.id === t.categoryId);
      const name = category?.name || 'Sem Categoria';
      categoryTotals[name] = (categoryTotals[name] || 0) + t.amount;
    });

    return {
      labels: Object.keys(categoryTotals),
      datasets: [{
        data: Object.values(categoryTotals),
        backgroundColor: [
          '#dc3545', '#28a745', '#ffc107', '#17a2b8', '#6f42c1',
          '#fd7e14', '#20c997', '#e83e8c', '#6c757d', '#007bff',
        ],
      }],
    };
  }, [transactions, categories]);

  // Dados para gráfico de barras (últimos 6 meses)
  const barData = useMemo(() => {
    const months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(date.toISOString().slice(0, 7));
    }

    const incomeData = months.map(month => {
      return transactions
        .filter(t => t.type === 'income' && t.date.startsWith(month))
        .reduce((sum, t) => sum + t.amount, 0);
    });

    const expenseData = months.map(month => {
      return transactions
        .filter(t => t.type === 'expense' && t.date.startsWith(month))
        .reduce((sum, t) => sum + t.amount, 0);
    });

    return {
      labels: months.map(m => {
        const [year, month] = m.split('-');
        return `${month}/${year}`;
      }),
      datasets: [
        {
          label: 'Receitas',
          data: incomeData,
          backgroundColor: '#28a745',
        },
        {
          label: 'Despesas',
          data: expenseData,
          backgroundColor: '#dc3545',
        },
      ],
    };
  }, [transactions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount || !formData.categoryId || !formData.accountId) {
      toast.error('Preencha todos os campos');
      return;
    }

    const transactionData = {
      projectId: currentProject,
      date: formData.date,
      description: formData.description,
      amount: parseFloat(formData.amount),
      type: formData.type,
      categoryId: formData.categoryId,
      accountId: formData.accountId,
      recurrence: formData.recurrence,
      lastRecurrence: formData.recurrence !== 'never' ? new Date().toISOString() : undefined,
    };

    if (editingTransaction) {
      updateFinancialTransaction(editingTransaction, transactionData);
      toast.success('Lançamento atualizado!');
      setEditingTransaction(null);
    } else {
      addFinancialTransaction(transactionData);
      toast.success('Lançamento adicionado!');
    }

    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '',
      type: 'expense',
      categoryId: '',
      accountId: '',
      recurrence: 'never',
    });
    setShowForm(false);
  };

  const handleEdit = (transaction: any) => {
    setFormData({
      date: transaction.date,
      description: transaction.description,
      amount: transaction.amount.toString(),
      type: transaction.type,
      categoryId: transaction.categoryId,
      accountId: transaction.accountId,
      recurrence: transaction.recurrence,
    });
    setEditingTransaction(transaction.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja remover este lançamento?')) {
      deleteFinancialTransaction(id);
      toast.success('Lançamento removido!');
    }
  };

  if (categories.length === 0 || accounts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">💰 Financeiro</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              Antes de começar, você precisa configurar pelo menos uma conta e uma categoria.
            </p>
            <p className="text-sm text-muted-foreground">
              Vá para <strong>Configurações → Financeiro</strong> para adicionar contas e categorias.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">💰 Financeiro</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowReports(!showReports)}>
            <PieChart className="h-4 w-4 mr-2" />
            Relatórios
          </Button>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Lançamento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTransaction ? 'Editar' : 'Novo'} Lançamento</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Salário, Aluguel, Supermercado"
                  />
                </div>
                <div>
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <RadioGroup
                    value={formData.type}
                    onValueChange={(value: 'income' | 'expense') => setFormData({ ...formData, type: value })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="income" id="income" />
                      <Label htmlFor="income">Receita</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="expense" id="expense" />
                      <Label htmlFor="expense">Despesa</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter(c => c.type === formData.type)
                        .map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Conta</Label>
                  <Select
                    value={formData.accountId}
                    onValueChange={(value) => setFormData({ ...formData, accountId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Recorrência</Label>
                  <Select
                    value={formData.recurrence}
                    onValueChange={(value: 'never' | 'monthly' | 'yearly') => 
                      setFormData({ ...formData, recurrence: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Nunca</SelectItem>
                      <SelectItem value="monthly">Mensalmente</SelectItem>
                      <SelectItem value="yearly">Anualmente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingTransaction ? 'Atualizar' : 'Adicionar'}
                  </Button>
                  {editingTransaction && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingTransaction(null);
                        setShowForm(false);
                      }}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {showReports && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Despesas por Categoria (Mês Atual)</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.labels.length > 0 ? (
                <Pie data={pieData} />
              ) : (
                <p className="text-muted-foreground text-center py-8">Nenhuma despesa registrada este mês</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Receitas vs Despesas (Últimos 6 Meses)</CardTitle>
            </CardHeader>
            <CardContent>
              <Bar data={barData} />
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {summary.balance.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {summary.income.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {summary.expenses.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos Lançamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum lançamento ainda</p>
          ) : (
            <div className="space-y-2">
              {transactions
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)
                .map(transaction => {
                  const category = categories.find(c => c.id === transaction.categoryId);
                  const account = accounts.find(a => a.id === transaction.accountId);
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{transaction.description}</span>
                          {transaction.recurrence !== 'never' && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              {transaction.recurrence === 'monthly' ? 'Mensal' : 'Anual'}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString('pt-BR')} • {category?.name} • {account?.name}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-semibold ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'} R$ {transaction.amount.toFixed(2)}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(transaction)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(transaction.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
