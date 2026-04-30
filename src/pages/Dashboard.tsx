import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PackageSearch, Clock, CheckCircle, Package, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

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
    <div className="space-y-8 max-w-6xl">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Bem-vindo, {profile?.name}</h2>
        <p className="text-muted-foreground font-medium">Acompanhe o resumo dos seus pedidos e financeiro.</p>
      </div>

      {/* Financial Metrics */}
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="rounded-xl border border-border shadow-sm bg-card transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-[12px] text-muted-foreground font-bold uppercase tracking-widest">Total Faturado</div>
              <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="text-3xl font-extrabold mt-2 text-foreground">
              {loading ? '-' : `R$ ${stats.revenue.toFixed(2)}`}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-border shadow-sm bg-card transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-[12px] text-muted-foreground font-bold uppercase tracking-widest">Total de Custos</div>
              <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="text-3xl font-extrabold mt-2 text-foreground">
              {loading ? '-' : `R$ ${stats.cost.toFixed(2)}`}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-border shadow-sm bg-primary text-primary-foreground transition-colors hidden-border-dark">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-[12px] font-bold uppercase tracking-widest opacity-80">Lucro Total</div>
              <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
            <div className="text-3xl font-extrabold mt-2 text-primary-foreground">
              {loading ? '-' : `R$ ${stats.profit.toFixed(2)}`}
            </div>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-xl font-extrabold tracking-tight text-foreground pt-2">Pedidos</h3>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl border border-border shadow-sm bg-card transition-colors">
          <CardContent className="p-5">
            <div className="text-[12px] text-muted-foreground font-semibold uppercase tracking-wide">Total de Pedidos</div>
            <div className="text-3xl font-extrabold mt-1 text-foreground">{loading ? '-' : stats.total}</div>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl border border-border shadow-sm bg-card transition-colors">
          <CardContent className="p-5">
            <div className="text-[12px] text-muted-foreground font-semibold uppercase tracking-wide">Novos Pedidos</div>
            <div className="text-3xl font-extrabold mt-1 text-primary">{loading ? '-' : stats.newOrders}</div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-border shadow-sm bg-card transition-colors">
          <CardContent className="p-5">
            <div className="text-[12px] text-muted-foreground font-semibold uppercase tracking-wide">Em Andamento</div>
            <div className="text-3xl font-extrabold mt-1 text-amber-600 dark:text-amber-500">{loading ? '-' : stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-border shadow-sm bg-card transition-colors">
          <CardContent className="p-5">
            <div className="text-[12px] text-muted-foreground font-semibold uppercase tracking-wide">Status do Plano</div>
            <div className="text-3xl font-extrabold mt-1 text-foreground">
              {profile?.role === 'admin' ? 'Admin' : profile?.status === 'trial' ? 'Trial' : profile?.status === 'active' ? 'Ativo' : 'Inativo'}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
