import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { 
  PackageSearch, 
  Clock, 
  CheckCircle, 
  Package, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  LayoutDashboard,
  ShieldCheck,
  Zap,
  ArrowUpRight
} from 'lucide-react';

type OrderContext = {
  total: number;
  newOrders: number;
  inProgress: number;
  completed: number;
  revenue: number;
  cost: number;
  profit: number;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<OrderContext>({ total: 0, newOrders: 0, inProgress: 0, completed: 0, revenue: 0, cost: 0, profit: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const fetchStats = async () => {
      try {
        const { data: orders, error } = await supabase
          .from('orders')
          .select('status, final_price, cost_total')
          .eq('user_id', profile.id);

        if (error) throw error;

        const newStats = orders.reduce((acc, order) => {
          acc.total++;
          if (order.status === 'Aguardando contato' || order.status === 'Confirmado') acc.newOrders++;
          else if (order.status === 'Preparação' || order.status === 'Pronto') acc.inProgress++;
          else if (order.status === 'Enviado') acc.completed++;
          
          const finalPrice = Number(order.final_price) || 0;
          const costTotal = Number(order.cost_total) || 0;
          
          acc.revenue += finalPrice;
          acc.cost += costTotal;
          
          return acc;
        }, { total: 0, newOrders: 0, inProgress: 0, completed: 0, revenue: 0, cost: 0, profit: 0 } as OrderContext);

        newStats.profit = newStats.revenue - newStats.cost;

        setStats(newStats);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [profile]);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* HEADER DO DASHBOARD */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-[0.2em]">
          <LayoutDashboard className="w-4 h-4" />
          Visão Geral
        </div>
        <h2 className="text-4xl font-black tracking-tight text-foreground">
          Olá, {profile?.name?.split(' ')[0]} <span className="text-blue-500">.</span>
        </h2>
        <p className="text-muted-foreground font-medium max-w-2xl">
          Acompanhe o desempenho da sua produção 3D e o resumo financeiro atualizado.
        </p>
      </div>

      {/* MÉTRICAS FINANCEIRAS PADRONIZADAS */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* FATURAMENTO */}
        <Card className="relative overflow-hidden border border-border bg-card/50 backdrop-blur-sm group hover:border-blue-500/50 transition-all duration-300">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50" />
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Faturado</span>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <DollarSign className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <div className="text-4xl font-black tracking-tighter text-foreground">
              {loading ? <div className="h-10 w-32 bg-muted animate-pulse rounded" /> : `R$ ${stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Receita bruta total</p>
          </CardContent>
        </Card>

        {/* CUSTOS */}
        <Card className="relative overflow-hidden border border-border bg-card/50 backdrop-blur-sm group hover:border-red-500/50 transition-all duration-300">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50" />
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Custos Operacionais</span>
              <div className="p-2 rounded-lg bg-red-500/10">
                <TrendingDown className="h-5 w-5 text-red-500" />
              </div>
            </div>
            <div className="text-4xl font-black tracking-tighter text-foreground">
              {loading ? <div className="h-10 w-32 bg-muted animate-pulse rounded" /> : `R$ ${stats.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Investimento em insumos</p>
          </CardContent>
        </Card>

        {/* LUCRO LÍQUIDO (AGORA PADRONIZADO E VERDE) */}
        <Card className="relative overflow-hidden border border-border bg-card/50 backdrop-blur-sm group hover:border-emerald-500/50 transition-all duration-300 shadow-lg shadow-emerald-500/5">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Lucro Líquido</span>
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <ArrowUpRight className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
            <div className="text-4xl font-black tracking-tighter text-emerald-500 dark:text-emerald-400">
              {loading ? <div className="h-10 w-32 bg-muted animate-pulse rounded" /> : `R$ ${stats.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-emerald-600 dark:text-emerald-400/80 text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3 h-3 fill-current" />
              Performance Máxima
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEÇÃO DE PEDIDOS */}
      <div className="space-y-6">
        <h3 className="text-xl font-black tracking-tight text-foreground flex items-center gap-3">
          Fluxo de Produção
          <div className="h-[1px] flex-1 bg-border" />
        </h3>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border bg-card/30 hover:bg-card transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Package className="w-5 h-5 text-muted-foreground/50" />
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Total</span>
              </div>
              <div className="text-3xl font-black">{loading ? '-' : stats.total}</div>
            </CardContent>
          </Card>
          
          <Card className="border-border bg-card/30 hover:bg-card transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Clock className="w-5 h-5 text-blue-500/50" />
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Novos</span>
              </div>
              <div className="text-3xl font-black text-blue-500">{loading ? '-' : stats.newOrders}</div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/30 hover:bg-card transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <PackageSearch className="w-5 h-5 text-amber-500/50" />
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Em Andamento</span>
              </div>
              <div className="text-3xl font-black text-amber-500">{loading ? '-' : stats.inProgress}</div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/30 hover:bg-card transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <ShieldCheck className="w-5 h-5 text-emerald-500/50" />
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Plano</span>
              </div>
              <div className="text-lg font-black uppercase tracking-tight truncate">
                {profile?.role === 'admin' ? 'Administrador' : profile?.status || 'Usuário'}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
