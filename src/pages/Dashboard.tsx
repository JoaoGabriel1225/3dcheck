import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Para o redirecionamento
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { 
  PackageSearch, 
  Clock, 
  Package, 
  DollarSign, 
  TrendingDown,
  LayoutDashboard,
  Zap,
  ArrowUpRight,
  Download,
  Smartphone,
  X,
  Calendar,
  CheckCircle2,
  ListChecks,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

type OrderContext = {
  total: number;
  newOrders: number;
  inProgress: number;
  ready: number;
  completed: number;
  revenue: number;
  cost: number;
  profit: number;
  trends: { revenue: number[]; cost: number[]; profit: number[] };
}

type TimeFilter = 'hoje' | 'semana' | 'mes' | 'todos';

// Lógica para gerar o gráfico funcional baseado em dados Reais
const DynamicSparkline = ({ data, color }: { data: number[], color: string }) => {
  if (data.length < 2) return <div className="w-16 h-8 border-b border-dashed border-muted-foreground/20" />;
  
  const max = Math.max(...data) || 1;
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 35 - ((val - min) / range) * 30; // Normaliza para o espaço do SVG (35 baseline, 30 altura)
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg className="w-16 h-8 overflow-visible" viewBox="0 0 100 40">
      <motion.polyline
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.6 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
    </svg>
  );
};

export default function Dashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate(); // Hook de navegação
  const [stats, setStats] = useState<OrderContext>({ 
    total: 0, newOrders: 0, inProgress: 0, ready: 0, completed: 0, 
    revenue: 0, cost: 0, profit: 0, 
    trends: { revenue: [], cost: [], profit: [] } 
  });
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('mes');
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  const storeDisplayName = user?.user_metadata?.full_name || profile?.name || 'Empreendedor';

  useEffect(() => {
    if (!profile) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        let startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        if (timeFilter === 'semana') startDate.setDate(startDate.getDate() - 7);
        else if (timeFilter === 'mes') startDate.setDate(1);
        else if (timeFilter === 'todos') startDate = new Date('2020-01-01');

        const { data: orders, error } = await supabase
          .from('orders')
          .select('status, final_price, cost_total, created_at')
          .eq('user_id', profile.id)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Processamento para os Gráficos
        const dailyData: Record<string, { rev: number, cst: number }> = {};
        
        const newStats = orders.reduce((acc, order) => {
          acc.total++;
          const dateKey = new Date(order.created_at).toLocaleDateString();
          if (!dailyData[dateKey]) dailyData[dateKey] = { rev: 0, cst: 0 };

          if (['Aguardando contato', 'Confirmado', 'Pendente'].includes(order.status)) acc.newOrders++;
          else if (['Preparação', 'Imprimindo', 'Em Andamento'].includes(order.status)) acc.inProgress++;
          else if (['Pronto', 'Aguardando Retirada'].includes(order.status)) acc.ready++;
          
          const rev = Number(order.final_price) || 0;
          const cst = Number(order.cost_total) || 0;
          
          acc.revenue += rev;
          acc.cost += cst;
          dailyData[dateKey].rev += rev;
          dailyData[dateKey].cst += cst;
          
          return acc;
        }, { total: 0, newOrders: 0, inProgress: 0, ready: 0, completed: 0, revenue: 0, cost: 0, profit: 0, trends: { revenue: [], cost: [], profit: [] } } as OrderContext);

        // Converte o mapa de datas em arrays para os Sparklines
        const sortedDates = Object.keys(dailyData);
        newStats.trends.revenue = sortedDates.map(d => dailyData[d].rev);
        newStats.trends.cost = sortedDates.map(d => dailyData[d].cst);
        newStats.trends.profit = sortedDates.map(d => dailyData[d].rev - dailyData[d].cst);
        
        newStats.profit = newStats.revenue - newStats.cost;
        setStats(newStats);
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    fetchStats();
  }, [profile, timeFilter]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-[0.2em]"><LayoutDashboard className="w-4 h-4" />Painel de Controle</div>
          <h2 className="text-4xl font-black tracking-tight text-foreground">Olá, {storeDisplayName} <span className="text-blue-500">.</span></h2>
        </div>
        
        <div className="flex items-center bg-muted/50 p-1.5 rounded-2xl border border-border">
           {(['hoje', 'semana', 'mes', 'todos'] as const).map((filter) => (
             <Button key={filter} variant="ghost" onClick={() => setTimeFilter(filter)} className={`h-9 px-4 rounded-xl text-xs font-bold transition-all relative ${timeFilter === filter ? 'text-foreground' : 'text-muted-foreground'}`}>
               {timeFilter === filter && <motion.div layoutId="activeFilter" className="absolute inset-0 bg-background shadow-sm rounded-xl" />}
               <span className="relative z-10 capitalize">{filter === 'mes' ? 'Mês' : filter === 'semana' ? 'Semana' : filter === 'todos' ? 'Total' : 'Hoje'}</span>
             </Button>
           ))}
        </div>
      </div>

      {/* FINANCEIRO COM GRÁFICOS FUNCIONAIS */}
      <div className="grid gap-6 md:grid-cols-3">
        {[
          { label: 'Faturado', val: stats.revenue, trend: stats.trends.revenue, color: '#3b82f6' },
          { label: 'Custos', val: stats.cost, trend: stats.trends.cost, color: '#ef4444' },
          { label: 'Lucro Líquido', val: stats.profit, trend: stats.trends.profit, color: '#10b981' }
        ].map((m, i) => (
          <Card key={i} className="border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{m.label}</span>
                <DynamicSparkline data={m.trend} color={m.color} />
              </div>
              <div className={`text-4xl font-black tracking-tighter ${m.label === 'Lucro Líquido' ? 'text-emerald-500' : ''}`}>
                R$ {m.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* PRÓXIMAS AÇÕES COM REDIRECIONAMENTO */}
      {(stats.newOrders > 0 || stats.ready > 0) && (
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 flex items-center gap-2"><ListChecks className="w-4 h-4" /> Próximas Ações</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {stats.newOrders > 0 && (
              <button 
                onClick={() => navigate('/app/orders')} // Redireciona para pedidos
                className="flex items-center justify-between p-5 bg-blue-500/5 border border-blue-500/20 rounded-3xl group hover:border-blue-500 transition-all text-left w-full"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500 rounded-2xl text-white"><Clock className="w-5 h-5" /></div>
                  <div>
                    <p className="font-black uppercase text-xs tracking-tight">{stats.newOrders} novos pedidos</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Confirmar e iniciar produção</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-500 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
            {stats.ready > 0 && (
              <button 
                onClick={() => navigate('/app/orders')} // Redireciona para pedidos
                className="flex items-center justify-between p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl group hover:border-emerald-500 transition-all text-left w-full"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500 rounded-2xl text-white"><CheckCircle2 className="w-5 h-5" /></div>
                  <div>
                    <p className="font-black uppercase text-xs tracking-tight">{stats.ready} peças prontas</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Notificar cliente / Entregar</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-500 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* FLUXO DE PRODUÇÃO COM NOMENCLATURA ATUALIZADA */}
      <div className="space-y-6">
        <h3 className="text-xl font-black tracking-tight flex items-center gap-3">Produção <div className="h-[1px] flex-1 bg-border" /></h3>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total', val: stats.total, icon: Package, color: 'muted' },
            { label: 'Novos', val: stats.newOrders, icon: Clock, color: 'blue' },
            { label: 'Em Produção', val: stats.inProgress, icon: PackageSearch, color: 'amber' }, // Nome Atualizado
            { label: 'Prontos', val: stats.ready, icon: CheckCircle2, color: 'emerald' }
          ].map((item, i) => (
            <Card key={i} className={`border-border bg-card/30 transition-all ${item.color === 'emerald' ? 'border-emerald-500/20' : ''}`}>
              <CardContent className="p-6">
                <item.icon className={`w-5 h-5 mb-4 text-${item.color === 'muted' ? 'muted-foreground/30' : `${item.color}-500/50`}`} />
                <div className={`text-3xl font-black ${item.color !== 'muted' ? `text-${item.color}-500` : ''}`}>{loading ? '...' : item.val}</div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
