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
  BarChart3
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
  topProducts: { name: string; count: number }[]; // Nova métrica inteligente
}

type TimeFilter = 'hoje' | 'semana' | 'mes' | 'todos';

const DynamicSparkline = ({ data, color, id }: { data: number[], color: string, id: string }) => {
  if (!data || data.length < 2) return <div className="w-20 h-10 border-b border-dashed border-muted-foreground/20 opacity-30" />;
  const max = Math.max(...data) || 1;
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 38 - ((val - min) / range) * 34; 
    return { x, y };
  });
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
        <motion.path d={areaPath} fill={`url(#gradient-${id})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} />
        <motion.path d={linePath} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeInOut" }} />
      </svg>
    </div>
  );
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
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

        // BUSCA ATUALIZADA: Incluindo nome do produto para o ranking
        const { data: orders, error } = await supabase
          .from('orders')
          .select('status, final_price, cost_total, created_at, product_name')
          .eq('user_id', profile.id)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true });

        if (error) throw error;

        const dailyData: Record<string, { rev: number, cst: number }> = {};
        const productCounts: Record<string, number> = {};
        
        const newStats = orders.reduce((acc, order) => {
          acc.total++;
          const dateKey = new Date(order.created_at).toLocaleDateString();
          if (!dailyData[dateKey]) dailyData[dateKey] = { rev: 0, cst: 0 };

          // Contagem de produtos
          if (order.product_name) {
            productCounts[order.product_name] = (productCounts[order.product_name] || 0) + 1;
          }

          if (['Aguardando contato', 'Confirmado', 'Pendente'].includes(order.status)) acc.newOrders++;
          else if (['Preparação', 'Imprimindo', 'Em Andamento'].includes(order.status)) acc.inProgress++;
          else if (['Pronto', 'Aguardando Retirada'].includes(order.status)) acc.ready++;
          
          acc.revenue += Number(order.final_price) || 0;
          acc.cost += Number(order.cost_total) || 0;
          dailyData[dateKey].rev += Number(order.final_price) || 0;
          dailyData[dateKey].cst += Number(order.cost_total) || 0;
          
          return acc;
        }, { total: 0, newOrders: 0, inProgress: 0, ready: 0, completed: 0, revenue: 0, cost: 0, profit: 0, trends: { revenue: [], cost: [], profit: [] }, topProducts: [] } as OrderContext);

        // Processamento do Ranking de Produtos
        newStats.topProducts = Object.entries(productCounts)
          .map(([name, count]) => ({ name, count }))
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
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-10 pb-10">
      
      {/* HEADER E FILTROS */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-[0.2em]"><LayoutDashboard className="w-4 h-4" />BI & Performance</div>
          <h2 className="text-4xl font-black tracking-tight text-foreground uppercase italic">Dashboard <span className="text-blue-500">3D</span></h2>
        </div>
        <div className="flex items-center bg-muted/50 p-1.5 rounded-2xl border border-border overflow-x-auto hide-scrollbar">
           {(['hoje', 'semana', 'mes', 'todos'] as const).map((filter) => (
             <Button key={filter} variant="ghost" onClick={() => setTimeFilter(filter)} className={`h-9 px-4 rounded-xl text-xs font-bold transition-all relative ${timeFilter === filter ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
               {timeFilter === filter && <motion.div layoutId="activeFilter" className="absolute inset-0 bg-background shadow-sm rounded-xl" />}
               <span className="relative z-10 capitalize">{filter === 'mes' ? 'Mês' : filter === 'semana' ? 'Semana' : filter === 'todos' ? 'Total' : 'Hoje'}</span>
             </Button>
           ))}
        </div>
      </motion.div>

      {/* FINANCEIRO */}
      <motion.div variants={containerVariants} className="grid gap-6 md:grid-cols-3">
        {[
          { id: 'rev', label: 'Faturado', val: stats.revenue, trend: stats.trends.revenue, color: '#3b82f6' },
          { id: 'cst', label: 'Custos', val: stats.cost, trend: stats.trends.cost, color: '#ef4444' },
          { id: 'prf', label: 'Lucro Líquido', val: stats.profit, trend: stats.trends.profit, color: '#10b981', isZap: true }
        ].map((m, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card className="relative overflow-hidden border border-border bg-card/50 backdrop-blur-sm group transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{m.label}</span>
                  <DynamicSparkline data={m.trend} color={m.color} id={m.id} />
                </div>
                <div className={`text-4xl font-black tracking-tighter ${m.label === 'Lucro Líquido' ? 'text-emerald-500' : 'text-foreground'}`}>
                  {loading ? '...' : `R$ ${m.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* GRÁFICO PROFISSIONAL: PRODUTOS MAIS VENDIDOS */}
      <motion.div variants={itemVariants}>
        <Card className="border border-border bg-card/30 backdrop-blur-md overflow-hidden rounded-[2.5rem]">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-blue-500/10 rounded-lg"><BarChart3 className="w-5 h-5 text-blue-500" /></div>
              <div>
                <h3 className="font-black uppercase italic tracking-tight text-lg">Ranking de Demanda</h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Os produtos que mais saem da sua impressora</p>
              </div>
            </div>

            <div className="space-y-6">
              {stats.topProducts.length > 0 ? (
                stats.topProducts.map((product, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-black uppercase text-foreground/80">{product.name}</span>
                      <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">{product.count} vendidos</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(product.count / stats.total) * 100}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center opacity-40 italic font-medium">Aguardando as primeiras vendas para gerar o ranking...</div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AÇÕES RÁPIDAS */}
      {(stats.newOrders > 0 || stats.ready > 0) && (
        <motion.div variants={itemVariants} className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 flex items-center gap-2"><ListChecks className="w-4 h-4" /> Próximas Ações</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {stats.newOrders > 0 && (
              <div onClick={() => navigate('/app/orders')} className="flex items-center justify-between p-5 bg-blue-600/5 border border-blue-600/20 rounded-3xl group hover:bg-blue-600/10 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-600/20"><Clock className="w-5 h-5" /></div>
                  <div className="text-sm font-black uppercase tracking-tight">{stats.newOrders} novos pedidos</div>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
              </div>
            )}
            {stats.ready > 0 && (
              <div onClick={() => navigate('/app/orders')} className="flex items-center justify-between p-5 bg-emerald-600/5 border border-emerald-600/20 rounded-3xl group hover:bg-emerald-600/10 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-600/20"><CheckCircle2 className="w-5 h-5" /></div>
                  <div className="text-sm font-black uppercase tracking-tight">{stats.ready} peças prontas</div>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* FLUXO DE PRODUÇÃO */}
      <motion.div variants={itemVariants} className="space-y-6 pb-20">
        <h3 className="text-xl font-black tracking-tight flex items-center gap-3">Operacional <div className="h-[1px] flex-1 bg-border" /></h3>
        <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total', val: stats.total, icon: Package, color: 'muted' },
            { label: 'Novos', val: stats.newOrders, icon: Clock, color: 'blue' },
            { label: 'Em Produção', val: stats.inProgress, icon: PackageSearch, color: 'amber' }, 
            { label: 'Prontos', val: stats.ready, icon: CheckCircle2, color: 'emerald' }
          ].map((item, i) => (
            <motion.div key={i} variants={itemVariants} whileHover={{ y: -5 }}>
              <Card className={`border-border bg-card/30 transition-all duration-200 ${item.color === 'emerald' ? 'border-emerald-500/20 bg-emerald-500/5' : ''}`}>
                <CardContent className="p-6 text-center">
                  <item.icon className={`w-5 h-5 mx-auto mb-4 ${item.color === 'muted' ? 'text-muted-foreground/30' : `text-${item.color}-500/50`}`} />
                  <div className={`text-3xl font-black ${item.color !== 'muted' ? `text-${item.color}-600 dark:text-${item.color}-400` : ''}`}>{loading ? '-' : item.val}</div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">{item.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
