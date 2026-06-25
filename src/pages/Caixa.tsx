import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Wallet, Plus, ArrowUpCircle, ArrowDownCircle, Trash2, Search, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Caixa() {
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Estados do formulário
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('income');

  const fetchTransactions = async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from('cashbook')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [profile]);

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      const { error } = await supabase.from('cashbook').insert({
        user_id: profile.id,
        amount: parseFloat(amount.replace(',', '.')) || 0,
        description,
        type
      });

      if (error) throw error;
      
      toast.success('Transação registrada!');
      setIsDialogOpen(false);
      setAmount('');
      setDescription('');
      fetchTransactions();
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + err.message);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!confirm('Deseja excluir este registro?')) return;
    try {
      const { error } = await supabase.from('cashbook').delete().eq('id', id);
      if (error) throw error;
      toast.success('Registro excluído.');
      fetchTransactions();
    } catch (err: any) {
      toast.error('Erro ao excluir: ' + err.message);
    }
  };

  // Cálculos do Resumo
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const balance = totalIncome - totalExpense;

  const filteredTransactions = transactions.filter(t => t.description.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Wallet className="w-6 h-6 text-blue-500" /> Fluxo de Caixa
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Controle de entradas e despesas extras da oficina.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="h-11 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20">
          <Plus className="w-5 h-5 mr-2" /> Novo Registro
        </Button>
      </div>

      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border bg-card/40 rounded-3xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Saldo Atual</p>
                <h3 className={`text-3xl font-black tracking-tighter ${balance >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                  R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl"><DollarSign className="w-5 h-5 text-blue-500" /></div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border bg-card/40 rounded-3xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 mb-2">Total Entradas</p>
                <h3 className="text-3xl font-black tracking-tighter text-emerald-500">
                  R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl"><ArrowUpCircle className="w-5 h-5 text-emerald-500" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/40 rounded-3xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500/70 mb-2">Total Saídas</p>
                <h3 className="text-3xl font-black tracking-tighter text-red-500">
                  R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="p-3 bg-red-500/10 rounded-xl"><ArrowDownCircle className="w-5 h-5 text-red-500" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* LISTA DE TRANSAÇÕES */}
      <Card className="border-border bg-card/40 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-border/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <h3 className="font-bold text-foreground">Histórico de Movimentações</h3>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar transação..." className="h-10 pl-9 rounded-xl bg-background" />
          </div>
        </div>
        
        <div className="p-0">
          {loading ? (
            <p className="p-8 text-center text-muted-foreground animate-pulse font-bold">Carregando dados...</p>
          ) : filteredTransactions.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground font-bold">Nenhum registro encontrado.</p>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredTransactions.map((t) => (
                <div key={t.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-muted/20 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {t.type === 'income' ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{t.description}</p>
                      <p className="text-xs font-medium text-muted-foreground">{new Date(t.created_at).toLocaleDateString('pt-BR')} às {new Date(t.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className={`text-lg font-black tracking-tighter ${t.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {t.type === 'income' ? '+' : '-'} R$ {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <button onClick={() => deleteTransaction(t.id)} className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* MODAL DE ADICIONAR */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl bg-card border-border shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b border-border/50 bg-muted/20">
            <DialogTitle className="text-xl font-black">Adicionar Registro</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveTransaction} className="p-6 space-y-6">
            
            <div className="flex p-1 bg-muted/40 rounded-xl">
              <button type="button" onClick={() => setType('income')} className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${type === 'income' ? 'bg-emerald-500 text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>
                Entrada
              </button>
              <button type="button" onClick={() => setType('expense')} className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${type === 'expense' ? 'bg-red-500 text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>
                Saída
              </button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground">Valor da Transação (R$)</Label>
              <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required className="h-14 text-2xl font-black bg-background border-border rounded-xl px-4" placeholder="0.00" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground">Descrição do Lançamento</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} required className="h-12 bg-background border-border rounded-xl" placeholder="Ex: Compra de bicos, Venda extra..." />
            </div>

            <Button type="submit" className="w-full h-14 font-black bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xl shadow-blue-500/20 text-lg transition-all">
              SALVAR REGISTRO
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
