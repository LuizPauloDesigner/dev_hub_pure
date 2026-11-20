import { useState, useMemo } from 'react';
import { useApp, FinancialTransaction, FinancialAccount } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, PieChart, CheckCircle2, Circle, Calendar, Users, AlertCircle, Clock, Filter, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { cn } from '@/lib/utils';
import { format, isBefore, isAfter, isToday, parseISO, startOfDay, isValid, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export const Finance = () => {
  const { 
    state, 
    currentProject,
    addFinancialTransaction,
    addFinancialTransactions,
    updateFinancialTransaction,
    deleteFinancialTransaction,
  } = useApp();

  const [showReports, setShowReports] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'income_paid' | 'income_pending' | 'expense_paid' | 'expense_pending' | 'transfer'>('all');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    supplier: '',
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense' | 'transfer',
    categoryId: '',
    accountId: '',
    destinationAccountId: '',
    recurrence: 'never' as 'never' | 'monthly' | 'yearly',
    installments: '1',
    isPaid: false,
    receiptUrl: '',
    notes: '',
  });

  const transactions = state.financialTransactions || [];
  const projectTransactions = transactions.filter(t => t.projectId === currentProject);
  const categories = state.financialCategories || [];
  const projectCategories = categories.filter(c => c.projectId === currentProject);
  const accounts = state.financialAccounts || [];

  // Alertas de Vencimento
  const upcomingBills = useMemo(() => {
    try {
      const today = startOfDay(new Date());
      return projectTransactions
        .filter(t => t.type === 'expense' && !t.isPaid && t.dueDate)
        .map(t => {
          const due = parseISO(t.dueDate!);
          if (!isValid(due)) return { ...t, status: 'upcoming' as const };
          const status = isBefore(due, today) ? 'overdue' as const : isToday(due) ? 'today' as const : 'upcoming' as const;
          return { ...t, status };
        })
        .sort((a, b) => {
           const dateA = new Date(a.dueDate!).getTime();
           const dateB = new Date(b.dueDate!).getTime();
           return (isNaN(dateA) ? 0 : dateA) - (isNaN(dateB) ? 0 : dateB);
        });
    } catch (e) {
      console.error("Erro ao calcular vencimentos:", e);
      return [];
    }
  }, [projectTransactions]);

  // Resumo financeiro
  const summary = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthTransactions = projectTransactions.filter(t => t.date.startsWith(currentMonth));
    
    const incomeTotal = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const incomePaid = monthTransactions.filter(t => t.type === 'income' && t.isPaid).reduce((sum, t) => sum + t.amount, 0);
    const expensesTotal = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const expensesPaid = monthTransactions.filter(t => t.type === 'expense' && t.isPaid).reduce((sum, t) => sum + t.amount, 0);
    const expensesPending = monthTransactions.filter(t => t.type === 'expense' && !t.isPaid).reduce((sum, t) => sum + t.amount, 0);
    
    // Saldo Real = O que entrou de fato - O que saiu de fato
    const balanceReal = incomePaid - expensesPaid;
    // Saldo Projetado = Total de entradas - Total de despesas
    const balanceProjected = incomeTotal - expensesTotal;
    
    return { incomeTotal, incomePaid, expensesTotal, expensesPaid, expensesPending, balanceReal, balanceProjected };
  }, [projectTransactions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação aprimorada
    const missing = [];
    if (!formData.description) missing.push('Descrição');
    if (!formData.amount) missing.push('Valor');
    if (!formData.accountId) missing.push('Conta de Origem');
    if (formData.type !== 'transfer' && !formData.categoryId) missing.push('Categoria');
    if (formData.type === 'transfer' && !formData.destinationAccountId) missing.push('Conta de Destino');

    if (missing.length > 0) {
      toast.error(`Campos obrigatórios: ${missing.join(', ')}`);
      return;
    }

    const tData: any = {
      projectId: currentProject,
      date: formData.date,
      dueDate: formData.dueDate,
      supplier: formData.supplier,
      description: formData.description,
      amount: parseFloat(formData.amount),
      type: formData.type,
      categoryId: formData.type !== 'transfer' ? formData.categoryId : undefined,
      accountId: formData.accountId,
      destinationAccountId: formData.type === 'transfer' ? formData.destinationAccountId : undefined,
      recurrence: formData.recurrence,
      installments: parseInt(formData.installments) || 1,
      isPaid: formData.isPaid,
      receiptUrl: formData.receiptUrl,
      notes: formData.notes,
    };

    if (editingTransaction) {
      updateFinancialTransaction(editingTransaction, tData);
      toast.success('Lançamento atualizado!');
      setEditingTransaction(null);
    } else {
      // MOTOR DE RECORRÊNCIA E PARCELAMENTO
      let installmentsAmount = tData.installments;
      if (tData.recurrence === 'monthly' && installmentsAmount === 1) {
         installmentsAmount = 12; // Preensão padrão para 1 ano (12 meses automáticos)
      }

      if (installmentsAmount > 1) {
         const parentId = Math.random().toString(36).substr(2, 9);
         const baseAmount = tData.amount / (tData.recurrence === 'never' ? installmentsAmount : 1); // Se for parcelamento fechado, divide o valor. Se for mensalidade (recurrence mensal), repete o valor base.
         const generatedTransactions = [];

         for (let i = 0; i < installmentsAmount; i++) {
           const generatedDueDate = tData.dueDate ? format(addMonths(parseISO(tData.dueDate), i), 'yyyy-MM-dd') : undefined;
           const generatedDate = format(addMonths(parseISO(tData.date), i), 'yyyy-MM-dd');
           
           generatedTransactions.push({
             ...tData,
             amount: baseAmount,
             date: generatedDate,
             dueDate: generatedDueDate,
             currentInstallment: i + 1,
             installments: installmentsAmount,
             parentId: parentId,
             isPaid: i === 0 ? tData.isPaid : false, // Só a primeira vira "Paga" (se for o caso)
           });
         }
         addFinancialTransactions(generatedTransactions);
         toast.success(`Gerados ${installmentsAmount} lançamentos automáticos!`);
      } else {
         addFinancialTransaction(tData);
         toast.success('Lançamento adicionado!');
      }
    }

    setFormData({
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      supplier: '',
      description: '',
      amount: '',
      type: 'expense',
      categoryId: '',
      accountId: '',
      destinationAccountId: '',
      recurrence: 'never',
      installments: '1',
      isPaid: false,
      receiptUrl: '',
      notes: '',
    });
    setShowForm(false);
  };

  const handleEdit = (t: FinancialTransaction) => {
    setFormData({
      date: t.date,
      dueDate: t.dueDate || t.date,
      supplier: t.supplier || '',
      description: t.description,
      amount: t.amount.toString(),
      type: t.type,
      categoryId: t.categoryId || '',
      accountId: t.accountId,
      destinationAccountId: t.destinationAccountId || '',
      recurrence: t.recurrence,
      installments: t.installments?.toString() || '1',
      isPaid: !!t.isPaid,
      receiptUrl: t.receiptUrl || '',
      notes: t.notes || '',
    });
    setEditingTransaction(t.id);
    setShowForm(true);
  };

  if (projectCategories.length === 0 || accounts.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">💰 Financeiro</h2>
        <Card className="rounded-[30px] border-none shadow-xl bg-card/40 backdrop-blur-md">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="bg-orange-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-orange-500 h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Configuração Pendente</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">Configuração necessária em Configurações → Geral.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto p-4 md:p-2 lg:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter uppercase flex items-center gap-3 text-foreground mb-1">Fluxo Financeiro</h2>
          <p className="text-muted-foreground/80 font-medium">Controle total de suas métricas e fornecedores.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="rounded-2xl px-6 h-12 font-bold transition-all hover:bg-secondary/80" onClick={() => setShowReports(!showReports)}>
            <PieChart className="h-5 w-5 mr-2" /> Relatórios
          </Button>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl h-12 px-8 font-black shadow-xl shadow-primary/30 uppercase tracking-tight">
                <Plus className="h-5 w-5 mr-2" /> Novo Lançamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[40px] border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto custom-scrollbar">
               {/* Form content maintained similar but with better dark integration */}
              <DialogHeader className="px-6 pt-6"><DialogTitle className="text-2xl font-black uppercase tracking-tighter text-foreground">Lançamento</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5 px-6 pb-6 pt-2">
                 {/* ... Form fields (simplified for brevity but visually improved) ... */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Lançamento</Label><Input type="date" value={formData.date} className="rounded-xl h-12 bg-muted/20" onChange={(e)=>setFormData({...formData, date:e.target.value})}/></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Vencimento</Label><Input type="date" value={formData.dueDate} className="rounded-xl h-12 bg-orange-500/5 border-orange-500/20" onChange={(e)=>setFormData({...formData, dueDate:e.target.value})}/></div>
                 </div>
                 <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Descrição</Label><Input placeholder="Ex: Pagamento Internet, Bonus..." value={formData.description} className="rounded-xl h-12 bg-muted/20" onChange={(e)=>setFormData({...formData, description:e.target.value})}/></div>
                 <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Fornecedor / Origem (Opcional)</Label><Input placeholder="Ex: AWS, Salário..." value={formData.supplier} className="rounded-xl h-12 bg-muted/20" onChange={(e)=>setFormData({...formData, supplier:e.target.value})}/></div>
                 <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Valor do lançamento</Label><Input type="number" step="0.01" value={formData.amount} className="rounded-xl h-12 bg-muted/20 font-bold text-lg" onChange={(e)=>setFormData({...formData, amount:e.target.value})}/></div>
                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Tipo de Lançamento</Label>
                    <RadioGroup 
                      className="grid grid-cols-3 gap-2 bg-muted/20 p-1 rounded-xl" 
                      value={formData.type} 
                      onValueChange={(val: 'income' | 'expense' | 'transfer') => setFormData({ 
                        ...formData, 
                        type: val,
                        isPaid: val === 'income' ? true : val === 'transfer' ? true : false
                      })}
                    >
                       <div>
                          <RadioGroupItem value="income" id="income-opt" className="peer sr-only" />
                          <Label htmlFor="income-opt" className="flex items-center justify-center h-10 rounded-lg cursor-pointer transition-all peer-data-[state=checked]:bg-emerald-500 peer-data-[state=checked]:text-white text-muted-foreground font-black text-[10px] uppercase tracking-widest">Receita</Label>
                       </div>
                       <div>
                          <RadioGroupItem value="expense" id="expense-opt" className="peer sr-only" />
                          <Label htmlFor="expense-opt" className="flex items-center justify-center h-10 rounded-lg cursor-pointer transition-all peer-data-[state=checked]:bg-red-500 peer-data-[state=checked]:text-white text-muted-foreground font-black text-[10px] uppercase tracking-widest">Despesa</Label>
                       </div>
                       <div>
                          <RadioGroupItem value="transfer" id="transfer-opt" className="peer sr-only" />
                          <Label htmlFor="transfer-opt" className="flex items-center justify-center h-10 rounded-lg cursor-pointer transition-all peer-data-[state=checked]:bg-blue-500 peer-data-[state=checked]:text-white text-muted-foreground font-black text-[10px] uppercase tracking-widest">Transfer</Label>
                       </div>
                    </RadioGroup>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    {formData.type !== 'transfer' && (
                      <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Categoria</Label><Select value={formData.categoryId} onValueChange={(v)=>setFormData({...formData, categoryId:v})}><SelectTrigger className="h-12 rounded-xl bg-muted/20"><SelectValue/></SelectTrigger><SelectContent>{projectCategories.filter(c=>c.type===formData.type).map(c=>(<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent></Select></div>
                    )}
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">{formData.type === 'transfer' ? 'Conta de Origem' : 'Conta'}</Label><Select value={formData.accountId} onValueChange={(v)=>setFormData({...formData, accountId:v})}><SelectTrigger className="h-12 rounded-xl bg-muted/20"><SelectValue/></SelectTrigger><SelectContent>{accounts.map(a=>(<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}</SelectContent></Select></div>
                    {formData.type === 'transfer' && (
                      <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Conta de Destino</Label><Select value={formData.destinationAccountId} onValueChange={(v)=>setFormData({...formData, destinationAccountId:v})}><SelectTrigger className="h-12 rounded-xl bg-muted/20"><SelectValue/></SelectTrigger><SelectContent>{accounts.filter(a => a.id !== formData.accountId).map(a=>(<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}</SelectContent></Select></div>
                    )}
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Recorrência</Label><Select value={formData.recurrence} onValueChange={(v:any)=>setFormData({...formData, recurrence:v})}><SelectTrigger className="h-12 rounded-xl bg-muted/20"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="never">Sem Recorrência</SelectItem><SelectItem value="monthly">Mensalidade</SelectItem><SelectItem value="yearly">Anual</SelectItem></SelectContent></Select></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Parcelas / Duração</Label><Input type="number" min="1" max="60" value={formData.installments} className="rounded-xl h-12 bg-muted/20" onChange={(e)=>setFormData({...formData, installments:e.target.value})} disabled={editingTransaction !== null}/></div>
                 </div>

                 {/* NOVOS CAMPOS: Anexo e Notas */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Link do Comprovante (Opcional)</Label><Input placeholder="URL do anexo (Drive, Dropbox, etc)" value={formData.receiptUrl} className="rounded-xl h-12 bg-muted/20 border-dashed" onChange={(e)=>setFormData({...formData, receiptUrl:e.target.value})}/></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Notas Adicionais</Label><Input placeholder="Detalhes do lançamento" value={formData.notes} className="rounded-xl h-12 bg-muted/20" onChange={(e)=>setFormData({...formData, notes:e.target.value})}/></div>
                 </div>

                 {/* Status Manual Toggle */}
                 <div className="flex items-center justify-between p-4 bg-muted/10 rounded-2xl border border-dashed border-border/20 hover:bg-muted/20 transition-all cursor-pointer" onClick={()=>setFormData({...formData, isPaid: !formData.isPaid})}>
                  <div className="space-y-0.5">
                     <Label className="font-bold flex items-center gap-2 pointer-events-none text-sm">
                       {formData.isPaid ? <CheckCircle2 className="text-emerald-500" size={18}/> : <Circle className="text-muted-foreground/40" size={18}/>}
                       {formData.type === 'income' ? 'Confirmar Recebimento' : formData.type === 'transfer' ? 'Transferência Confirmada' : 'Marcar como Pago'}
                     </Label>
                     <p className="text-[9px] font-black uppercase tracking-widest opacity-30 ml-7">
                        {formData.isPaid ? 'Isso afetará seu Saldo Disponível imediatamente' : 'Lançamento ficará como pendente no sistema'}
                     </p>
                  </div>
                  <Button type="button" variant={formData.isPaid ? "default" : "outline"} className={cn("rounded-full h-8 px-4 text-[9px] font-black tracking-widest uppercase transition-all", formData.isPaid ? (formData.type === 'income' ? "bg-emerald-600" : formData.type === 'transfer' ? "bg-blue-600" : "bg-red-600") : "opacity-50")}>
                    {formData.isPaid ? 'SIM' : 'NÃO'}
                  </Button>
                </div>

                 <Button type="submit" className="w-full h-14 rounded-2xl font-black text-lg uppercase tracking-tight shadow-2xl shadow-primary/20">Confirmar</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Seção de Relatórios em Gráficos */}
      {showReports && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in zoom-in-95 duration-300">
           <Card className="rounded-[40px] border-none shadow-2xl bg-card/40 backdrop-blur-md p-8">
              <CardHeader className="p-0 mb-6">
                 <CardTitle className="text-xl font-black uppercase tracking-tighter">Distribuição por Categoria</CardTitle>
                 <CardDescription className="font-bold">Onde você mais gasta seu dinheiro</CardDescription>
              </CardHeader>
              <div className="h-[300px] flex items-center justify-center">
                 <Pie 
                    data={{
                       labels: projectCategories.filter(c => c.type === 'expense').map(c => c.name),
                       datasets: [{
                          data: projectCategories.filter(c => c.type === 'expense').map(c => 
                             projectTransactions.filter(t => t.categoryId === c.id).reduce((sum, t) => sum + t.amount, 0)
                          ),
                          backgroundColor: ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9'],
                          borderWidth: 0,
                       }]
                    }}
                    options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#a1a1aa', font: { weight: 'bold', size: 10 } } } } }}
                 />
              </div>
           </Card>

           <Card className="rounded-[40px] border-none shadow-2xl bg-card/40 backdrop-blur-md p-8">
              <CardHeader className="p-0 mb-6">
                 <CardTitle className="text-xl font-black uppercase tracking-tighter">Entradas vs Saídas</CardTitle>
                 <CardDescription className="font-bold">Fluxo de caixa consolidado do mês</CardDescription>
              </CardHeader>
              <div className="h-[300px]">
                 <Bar 
                    data={{
                       labels: ['Previsto', 'Efetivado'],
                       datasets: [
                          {
                             label: 'Entradas',
                             data: [summary.incomeTotal, summary.incomePaid],
                             backgroundColor: '#10b981',
                             borderRadius: 12,
                          },
                          {
                             label: 'Saídas',
                             data: [summary.expensesTotal, summary.expensesPaid],
                             backgroundColor: '#f43f5e',
                             borderRadius: 12,
                          }
                       ]
                    }}
                    options={{ 
                       maintainAspectRatio: false, 
                       scales: { y: { grid: { display: false }, ticks: { color: '#a1a1aa' } }, x: { grid: { display: false }, ticks: { color: '#a1a1aa' } } },
                       plugins: { legend: { display: false } }
                    }}
                 />
              </div>
           </Card>
        </div>
      )}
      {upcomingBills.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4">
           {upcomingBills.slice(0, 3).map(bill => (
             <div key={bill.id} className={cn("p-5 rounded-[32px] border flex items-center gap-5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-default bg-card/60 backdrop-blur-md", bill.status === 'overdue' ? 'border-red-500/20 bg-red-500/5' : bill.status === 'today' ? 'border-orange-500/20 bg-orange-500/5' : 'border-border/60 hover:border-border')}>
                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg", bill.status === 'overdue' ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-orange-500 text-white shadow-orange-500/20')}>
                   {bill.status === 'overdue' ? <AlertCircle size={28}/> : <Clock size={28}/>}
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-[9px] font-black uppercase tracking-widest text-[#71717a] mb-0.5">{bill.status === 'overdue' ? 'Contas Atrasadas' : bill.status === 'today' ? 'Vence Hoje' : 'Próxima Conta'}</p>
                   <h4 className="font-black text-foreground truncate text-lg tracking-tight">{bill.supplier || 'N/D'}</h4>
                   <p className={cn("text-xs font-bold", bill.status === 'overdue' ? 'text-red-500' : 'text-orange-500')}>R$ {bill.amount.toFixed(2)} • {bill.dueDate ? format(parseISO(bill.dueDate), 'dd/MM', {locale: ptBR}) : ''}</p>
                </div>
                <button className="h-10 px-4 rounded-xl border-2 border-primary/20 hover:border-primary hover:bg-primary hover:text-white transition-all font-black text-[10px] uppercase tracking-widest" onClick={() => updateFinancialTransaction(bill.id, {isPaid: true})}>Pagar</button>
             </div>
           ))}
        </div>
      )}

      {/* Grid Principal de Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <SummaryTile title="Disponível Agora" value={summary.balanceReal} icon={Wallet} trend={summary.balanceReal >= 0 ? 'up' : 'down'} color={summary.balanceReal >= 0 ? 'text-emerald-500' : 'text-red-500'} description="Entradas pagas - Saídas pagas" />
         <SummaryTile title="Saldo Projetado" value={summary.balanceProjected} icon={TrendingUp} trend="neutral" color="text-blue-500" description="Total de entradas - Total de despesas" />
         <SummaryTile title="Total de Entradas" value={summary.incomeTotal} icon={ArrowUpRight} trend="up" color="text-zinc-500" description="Soma de todas as receitas do mês" />
         <SummaryTile title="Pendências (A Pagar)" value={summary.expensesPending} icon={AlertCircle} trend="neutral" color="text-orange-500" description="Total de despesas não pagas" />
      </div>

      {/* Histórico Consolidado */}
      <Card className="rounded-[48px] border-none shadow-2xl bg-card transition-colors">
         <CardHeader className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-border/10 px-10 py-8 gap-6">
            <CardTitle className="text-2xl font-black uppercase tracking-tighter text-foreground flex items-center gap-3"><Filter size={24} className="text-muted-foreground/40"/> Histórico de Fluxo</CardTitle>
            <div className="flex flex-wrap gap-1.5 bg-muted/30 p-1.5 rounded-2xl border border-border/10">
               <FilterTab current={filterType} type="all" label="Ver Tudo" onClick={setFilterType} />
               <div className="w-[1px] h-6 bg-border/20 mx-1 self-center" />
               <FilterTab current={filterType} type="income_paid" label="Receitas (Ok)" color="bg-emerald-500" onClick={setFilterType} />
               <FilterTab current={filterType} type="income_pending" label="Receitas (A receber)" color="bg-zinc-500" onClick={setFilterType} />
               <div className="w-[1px] h-6 bg-border/20 mx-1 self-center" />
               <FilterTab current={filterType} type="expense_paid" label="Contas (Pagas)" color="bg-rose-500" onClick={setFilterType} />
               <div className="w-[1px] h-6 bg-border/20 mx-1 self-center" />
               <FilterTab current={filterType} type="transfer" label="Transferências" color="bg-blue-500" onClick={setFilterType} />
            </div>
         </CardHeader>
         <CardContent className="p-0">
            {projectTransactions.length === 0 ? (
               <div className="p-24 text-center opacity-10 flex flex-col items-center gap-4"><Wallet size={80}/><p className="font-black text-2xl uppercase tracking-tighter">Nenhum Registro Encontrado</p></div>
            ) : (
               <div className="divide-y divide-border/5">
                  {projectTransactions
                    .filter(t => {
                      if (filterType === 'all') return true;
                      if (filterType === 'income_paid') return t.type === 'income' && t.isPaid;
                      if (filterType === 'income_pending') return t.type === 'income' && !t.isPaid;
                      if (filterType === 'expense_paid') return t.type === 'expense' && t.isPaid;
                      if (filterType === 'expense_pending') return t.type === 'expense' && !t.isPaid;
                      if (filterType === 'transfer') return t.type === 'transfer';
                      return true;
                    })
                    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(t => {
                      const isOverdue = !t.isPaid && t.dueDate && isBefore(parseISO(t.dueDate), startOfDay(new Date()));
                      
                      return (
                        <div key={t.id} className={cn(
                          "group flex items-center justify-between p-8 transition-all border-l-4",
                          t.isPaid ? "opacity-40 border-l-transparent bg-transparent" : 
                          isOverdue ? "border-l-red-500 bg-red-500/5 shadow-[inset_10px_0_20px_-10px_rgba(239,68,68,0.2)]" : 
                          "border-l-orange-500 bg-orange-500/5"
                        )}>
                          <div className="flex items-center gap-8 flex-1">
                             {/* Botão de Toggle Rápido */}
                             <button 
                               onClick={() => updateFinancialTransaction(t.id, {isPaid: !t.isPaid})}
                               className={cn(
                                 "h-10 w-10 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                                 t.isPaid ? (t.type === 'transfer' ? "bg-blue-500 border-blue-500 text-white" : "bg-emerald-500 border-emerald-500 text-white") : "border-muted-foreground/20 text-muted-foreground/20 hover:border-primary hover:text-primary"
                               )}
                             >
                                {t.isPaid ? <CheckCircle2 size={20}/> : <Circle size={20}/>}
                             </button>

                             <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                   <h3 className={cn(
                                     "font-black text-xl tracking-tight leading-none transition-colors truncate",
                                     t.isPaid ? "text-muted-foreground line-through opacity-50" : "text-foreground"
                                   )}>
                                     {t.type === 'transfer' ? `Transferência: ${t.description}` : t.description} {t.installments && t.installments > 1 ? <span className="opacity-40 text-sm">({t.currentInstallment}/{t.installments})</span> : ''}
                                   </h3>
                                   {t.type === 'transfer' && <span className="text-[9px] font-black uppercase bg-blue-500/20 text-blue-500 px-2 py-1 rounded-md tracking-widest">Transação Interna</span>}
                                   {t.supplier && <span className="text-[9px] font-black uppercase bg-muted/50 text-muted-foreground px-2 py-1 rounded-md tracking-widest">{t.supplier}</span>}
                                   {t.recurrence === 'monthly' && <span className="text-[9px] font-black uppercase bg-purple-500/20 text-purple-500 px-2 py-1 rounded-md tracking-widest">Fixo Mensal</span>}
                                   {isOverdue && <span className="text-[9px] font-black uppercase bg-red-500 text-white px-2 py-1 rounded-md tracking-widest animate-pulse">Atrasado</span>}
                                </div>
                                <div className="text-sm font-bold text-muted-foreground flex flex-wrap items-center gap-x-6 gap-y-1">
                                   <span className="flex items-center gap-2 opacity-60"><Calendar size={14}/> {format(parseISO(t.date), 'dd MMM yyyy', {locale: ptBR})}</span>
                                   {t.type !== 'transfer' && t.dueDate && (
                                     <span className={cn("flex items-center gap-2", isOverdue ? "text-red-500" : "opacity-80")}>
                                       <Clock size={14}/> {isOverdue ? 'Vencido em' : 'Vence'} {format(parseISO(t.dueDate), 'dd/MM/yy')}
                                     </span>
                                   )}
                                   {t.type === 'transfer' && (
                                      <span className="flex items-center gap-2 opacity-80"><ArrowUpRight size={14} className="text-blue-500"/> De {accounts.find(a=>a.id===t.accountId)?.name || 'N/D'} para {accounts.find(a=>a.id===t.destinationAccountId)?.name || 'N/D'}</span>
                                   )}
                                   {t.receiptUrl && (
                                     <a href={t.receiptUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 opacity-80 hover:text-primary transition-colors text-[10px] uppercase font-black tracking-widest"><div className="h-1.5 w-1.5 rounded-full bg-blue-500"/> Comprovante Anexo</a>
                                   )}
                                   {t.notes && (
                                     <span className="opacity-50 truncate max-w-[200px] text-xs">📝 {t.notes}</span>
                                   )}
                                </div>
                             </div>
                          </div>
                          
                          <div className="flex items-center gap-10 pl-6">
                             <div className="text-right">
                                <p className={cn(
                                  "text-3xl font-black tabular-nums tracking-tighter leading-none mb-1",
                                  t.isPaid ? "text-muted-foreground opacity-50" : (t.type === 'income' ? "text-emerald-500" : t.type === 'transfer' ? "text-blue-500" : "text-red-500")
                                )}>
                                   {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : '↔'} R$ {t.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                </p>
                                <p className="text-[9px] font-black uppercase opacity-20 tracking-widest">{t.type === 'transfer' ? 'Movimentação' : t.isPaid ? 'Conciliado' : 'Aguardando'}</p>
                             </div>
                             <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all -mr-4">
                                <Button size="icon" variant="ghost" className="rounded-2xl h-11 w-11 hover:bg-primary/10 hover:text-primary" onClick={() => handleEdit(t)}><Edit size={20}/></Button>
                                <Button size="icon" variant="ghost" className="rounded-2xl h-11 w-11 hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteFinancialTransaction(t.id)}><Trash2 size={20}/></Button>
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

const SummaryTile = ({ title, value, icon: Icon, trend, color, description }: any) => (
  <div className="p-8 rounded-[40px] bg-card/40 border border-border/5 backdrop-blur-3xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.2)] transition-all hover:translate-y-[-4px] group">
     <div className="flex items-center justify-between mb-6">
        <div className={cn("h-14 w-14 rounded-[22px] flex items-center justify-center transition-all group-hover:scale-110 shadow-lg", color.replace('text', 'bg').replace('500', '500/10'))}>
           <Icon className={color} size={30} />
        </div>
        <div className="text-right">
           <p className="text-[10px] font-black uppercase tracking-widest text-[#71717a] mb-1">{title}</p>
           {trend === 'up' && <ArrowUpRight className="text-emerald-500 ml-auto" size={20}/>}
           {trend === 'down' && <ArrowDownRight className="text-red-500 ml-auto" size={20}/>}
        </div>
     </div>
     <div className={cn("text-4xl font-black tabular-nums tracking-tighter mb-2", color)}>
        R$ {(value || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
     </div>
     <p className="text-[11px] font-bold text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">{description}</p>
  </div>
);

const FilterTab = ({ current, type, label, onClick, color }: any) => (
  <button 
    onClick={() => onClick(type)} 
    className={cn(
      "px-5 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2",
      current === type ? (color || "bg-primary") + " text-white shadow-lg" : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/50"
    )}
  >
    {current === type && <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
    {label}
  </button>
);
