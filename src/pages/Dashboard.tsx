import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
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
  ChevronRight,
  Trophy,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

type TopProduct = { name: string; count: number; revenue: number };

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
  topProducts: TopProduct[];
}

type TimeFilter = 'hoje' | 'semana' | 'mes' | 'todos';

const DynamicSparkline = ({ data, color, id }: { data: number[], color: string, id: string }) => {
  if (!data || data.length < 2) return <div className="w-20 h-10 border-b border-dashed border-muted-foreground/20 opacity-30" />;
  const max = Math.max(...data) || 1;
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((val, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: 38 - ((val - min) / range) * 34
  }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L 100 40 L 0 40 Z`;

  return (
    <div className="relative h-12 w-24">
      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path d={areaPath} fill={`url(#gradient-${id})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
        <motion.path d={linePath} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5 }} />
      </svg>
    </div>
  );
};

export default function Dashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate(); 
  const [stats, setStats] = useState<OrderContext>({ 
    total: 0, newOrders: 0, inProgress: 0, ready: 0, completed: 0, revenue: 0, cost: 0, profit: 0,
    trends: { revenue: [], cost: [], profit: [] },
    topProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('mes');
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  const storeDisplayName = user?.user_metadata?.full_name || profile?.name || 'Maker';

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
          .select('status, final_price, cost_total, created_at, product_name')
          .eq('user_id', profile.id)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true });

        if (error) throw error;

        const dailyData: Record<string, { rev: number, cst: number }> = {};
        const productMap: Record<string, { count: number, rev: number }> = {};
        
        const newStats = orders.reduce((acc, order) => {
          acc.total++;
          const dateKey = new Date(order.created_at).toLocaleDateString();
          if (!dailyData[dateKey]) dailyData[dateKey] = { rev: 0, cst: 0 };

          // Inteligência de Produtos
          if (order.product_name) {
            if (!productMap[order.product_name]) productMap[order.product_name] = { count: 0, rev: 0 };
            productMap[order.product_name].count += 1;
            productMap[order.product_name].rev += Number(order.final_price) || 0;
          }

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
        }, { total: 0, newOrders: 0, inProgress: 0, ready: 0, completed: 0, revenue: 0, cost: 0, profit: 0, trends: { revenue: [], cost: [], profit: [] }, topProducts: [] } as OrderContext);

        // Processar Top 5 Produtos
        newStats.topProducts = Object.entries(productMap)
          .map(([name, data]) => ({ name, count: data.count, revenue: data.rev }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

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
      
      {/* HEADER DINÂMICO */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-blue-500 font-bold text-[10px] uppercase tracking-[0.2em]"><BarChart3 className="w-4 h-4" /> Inteligência de Negócio</div>
          <h2 className="text-4xl font-black tracking-tight text-foreground italic uppercase">Status <span className="text-blue-500">Live</span></h2>
        </div>
        <div className="flex items-center bg-muted/50 p-1.5 rounded-2xl border border-border">
           {(['hoje', 'semana', 'mes', 'todos'] as const).map((filter) => (
             <Button key={filter} variant="ghost" onClick={() => setTimeFilter(filter)} className={`h-9 px-4 rounded-xl text-xs font-black transition-all relative ${timeFilter === filter ? 'text-foreground' : 'text-muted-foreground'}`}>
               {timeFilter === filter && <motion.div layoutId="activeFilter" className="absolute inset-0 bg-background shadow-sm rounded-xl" />}
               <span className="relative z-10 capitalize">{filter === 'mes' ? 'Mês' : filter === 'todos' ? 'Geral' : filter}</span>
             </Button>
           ))}
        </div>
      </div>

      {/* FINANCEIRO E PERFORMANCE */}
      <div className="grid gap-6 md:grid-cols-3">
        {[
          { id: 'rev', label: 'Faturamento', val: stats.revenue, trend: stats.trends.revenue, color: '#3b82f6' },
          { id: 'prf', label: 'Lucro Líquido', val: stats.profit, trend: stats.trends.profit, color: '#10b981' },
          { id: 'cst', label: 'Custos Totais', val: stats.cost, trend: stats.trends.cost, color: '#ef4444' }
        ].map((m, i) => (
          <Card key={i} className="border border-border bg-card/50 backdrop-blur-xl overflow-hidden group hover:border-blue-500/20 transition-all">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{m.label}</span>
                <DynamicSparkline data={m.trend} color={m.color} id={m.id} />
              </div>
              <div className={`text-3xl font-black tracking-tighter ${m.id === 'prf' ? 'text-emerald-500' : 'text-foreground'}`}>
                {loading ? '...' : `R$ ${m.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* GRÁFICO PROFISSIONAL: TOP PRODUTOS */}
        <Card className="border-border bg-card/40 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-500"><Trophy className="w-6 h-6" /></div>
            <div>
              <h3 className="text-lg font-black uppercase italic tracking-tighter">Ranking de Vendas</h3>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Os 5 itens mais pedidos</p>
            </div>
          </div>
          
          <div className="space-y-6">
            {stats.topProducts.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground italic text-sm">Aguardando as primeiras vendas...</div>
            ) : (
              stats.topProducts.map((prod, i) => {
                const percentage = (prod.count / stats.topProducts[0].count) * 100;
                return (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-black uppercase text-foreground/80">{prod.name}</span>
                      <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">{prod.count} Vendas</span>
                    </div>
                    <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${percentage}%` }} 
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className="h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* PROXIMAS AÇÕES INTEGRADO */}
        <div className="space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 flex items-center gap-2 px-2"><ListChecks className="w-4 h-4" /> Gestão Imediata</h3>
          <div className="space-y-4">
            {stats.newOrders > 0 && (
              <div onClick={() => navigate('/app/orders')} className="flex items-center justify-between p-6 bg-blue-600/5 border border-blue-600/20 rounded-[2rem] group hover:bg-blue-600/10 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-600/20"><Clock className="w-6 h-6" /></div>
                  <div>
                    <p className="text-base font-black uppercase italic tracking-tighter">{stats.newOrders} Novos Pedidos</p>
                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Toque para confirmar produção</p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-blue-600 group-hover:translate-x-2 transition-transform" />
              </div>
            )}
            {stats.ready > 0 && (
              <div onClick={() => navigate('/app/orders')} className="flex items-center justify-between p-6 bg-emerald-600/5 border border-emerald-600/20 rounded-[2rem] group hover:bg-emerald-600/10 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-emerald-600 rounded-3xl text-white shadow-xl shadow-emerald-600/20"><CheckCircle2 className="w-6 h-6" /></div>
                  <div>
                    <p className="text-base font-black uppercase italic tracking-tighter">{stats.ready} Peças Prontas</p>
                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Toque para organizar entrega</p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-emerald-600 group-hover:translate-x-2 transition-transform" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FLUXO DE OPERAÇÃO */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Fluxo Total', val: stats.total, icon: Package, color: 'muted' },
          { label: 'Novos', val: stats.newOrders, icon: Clock, color: 'blue' },
          { label: 'Em Produção', val: stats.inProgress, icon: PackageSearch, color: 'amber' }, 
          { label: 'Prontos', val: stats.ready, icon: CheckCircle2, color: 'emerald' }
        ].map((item, i) => (
          <Card key={i} className={`border-border bg-card/30 rounded-[1.5rem] transition-all hover:scale-[1.02] ${item.color === 'emerald' ? 'border-emerald-500/20 bg-emerald-500/5' : ''}`}>
            <CardContent className="p-6">
              <item.icon className={`w-5 h-5 mb-4 text-${item.color === 'muted' ? 'muted-foreground/30' : `${item.color}-500/50`}`} />
              <div className={`text-3xl font-black ${item.color !== 'muted' ? `text-${item.color}-600` : ''}`}>{loading ? '...' : item.val}</div>
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mt-1">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
