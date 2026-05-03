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
  Trophy // Ícone para o Top Produtos
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
  topProducts: { name: string; count: number; percentage: number }[]; // Novo campo para inteligência
}

type TimeFilter = 'hoje' | 'semana' | 'mes' | 'todos';

/**
 * Componente de Gráfico de Área Profissional para os Cards Financeiros
 */
const DynamicSparkline = ({ data, color, id }: { data: number[], color: string, id: string }) => {
  if (!data || data.length < 2) {
    return <div className="w-20 h-10 border-b border-dashed border-muted-foreground/20 opacity-30" />;
  }
  
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
          <filter id={`glow-${id}`}>
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <motion.path d={areaPath} fill={`url(#gradient-${id})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} />
        <motion.path d={linePath} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter={`url(#glow-${id})`} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeInOut" }} />
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
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallBtn(false);
    setDeferredPrompt(null);
  };

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

        // Adicionado 'product_name' no select para o gráfico inteligente
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

          // Contagem para Top Produtos
          const pName = order.product_name || 'Produto s/ Nome';
          productCounts[pName] = (productCounts[pName] || 0) + 1;

          if (['Aguardando contato', 'Confirmado', 'Pendente'].includes(order.status)) acc.newOrders++;
          else if (['Preparação', 'Imprimindo', 'Em Andamento'].includes(order.status)) acc.inProgress++;
          else if (['Pronto', 'Aguardando Retirada'].includes(order.status)) acc.ready++;
          else if (['Enviado', 'Concluído'].includes(order.status)) acc.completed++;
          
          const rev = Number(order.final_price) || 0;
          const cst = Number(order.cost_total) || 0;
          
          acc.revenue += rev;
          acc.cost += cst;
          dailyData[dateKey].rev += rev;
          dailyData[dateKey].cst += cst;
          
          return acc;
        }, { total: 0, newOrders: 0, inProgress: 0, ready: 0, completed: 0, revenue: 0, cost: 0, profit: 0, trends: { revenue: [], cost: [], profit: [] }, topProducts: [] } as OrderContext);

        // Processa os 4 produtos mais vendidos
        const sortedProducts = Object.entries(productCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 4)
          .map(([name, count]) => ({
            name,
            count,
            percentage: Math.round((count / newStats.total) * 100)
          }));

        newStats.topProducts = sortedProducts;

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
      
      {/* HEADER E FILTROS (MANTIDOS) */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-[0.2em]"><LayoutDashboard className="w-4 h-4" />Visão Geral</div>
          <h2 className="text-4xl font-black tracking-tight text-foreground">Olá, {storeDisplayName} <span className="text-blue-500">.</span></h2>
          <p className="text-muted-foreground font-medium max-w-xl">Inteligência de produção e análise financeira em tempo real.</p>
        </div>
        <div className="flex items-center bg-muted/50 p-1.5 rounded-2xl border border-border overflow-x-auto hide-scrollbar">
           {(['hoje', 'semana', 'mes', 'todos'] as const).map((filter) => (
             <Button key={filter} variant="ghost" onClick={() => setTimeFilter(filter)} className={`h-9 px-4 rounded-xl text-xs font-bold transition-all relative ${timeFilter === filter ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
               {timeFilter === filter && <motion.div layoutId="activeFilter" className="absolute inset-0 bg-background shadow-sm rounded-xl" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
               <span className="relative z-10 capitalize">{filter === 'mes' ? 'Mês' : filter === 'semana' ? 'Semana' : filter === 'todos' ? 'Total' : 'Hoje'}</span>
             </Button>
           ))}
        </div>
      </motion.div>

      {/* FINANCEIRO (MANTIDO) */}
      <motion.div variants={containerVariants} className="grid gap-6 md:grid-cols-3">
        {[
          { id: 'rev', label: 'Faturado', val: stats.revenue, trend: stats.trends.revenue, color: '#3b82f6', sub: 'Receita bruta' },
          { id: 'cst', label: 'Custos', val: stats.cost, trend: stats.trends.cost, color: '#ef4444', sub: 'Em insumos' },
          { id: 'prf', label: 'Lucro Líquido', val: stats.profit, trend: stats.trends.profit, color: '#10b981', sub: 'Performance Máxima', isZap: true }
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

      {/* GRÁFICO PROFISSIONAL: MAIS VENDIDOS */}
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-card/40 border-border p-8 rounded-[2.5rem]">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/20">
               <Trophy className="text-white w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black uppercase text-xs tracking-widest">Inteligência de Vendas</h3>
              <p className="text-muted-foreground text-[10px] font-bold uppercase">Produtos mais requisitados</p>
            </div>
          </div>

          <div className="space-y-6">
            {stats.topProducts.length > 0 ? stats.topProducts.map((p, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black uppercase tracking-tight text-foreground truncate max-w-[200px]">{p.name}</span>
                  <span className="text-[10px] font-black text-blue-500">{p.count} vendas ({p.percentage}%)</span>
                </div>
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${p.percentage}%` }} 
                    transition={{ duration: 1, delay: i * 0.1 }}
                    className="h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                  />
                </div>
              </div>
            )) : (
              <div className="py-10 text-center text-muted-foreground italic text-xs">Sem dados suficientes no período.</div>
            )}
          </div>
        </Card>

        {/* PRÓXIMAS AÇÕES (CONECTADO AO GRÁFICO) */}
        <div className="space-y-4">
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 flex items-center gap-2">
            <ListChecks className="w-4 h-4" /> Fluxo Prioritário
          </h3>
          <div className="grid gap-4">
            {stats.newOrders > 0 && (
              <div onClick={() => navigate('/app/orders')} className="flex items-center justify-between p-5 bg-blue-600/5 border border-blue-600/20 rounded-3xl group hover:bg-blue-600/10 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg"><Clock className="w-5 h-5" /></div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-tight">{stats.newOrders} Novos Pedidos</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black">Aguardando aprovação</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
              </div>
            )}
            {stats.ready > 0 && (
              <div onClick={() => navigate('/app/orders')} className="flex items-center justify-between p-5 bg-emerald-600/5 border border-emerald-600/20 rounded-3xl group hover:bg-emerald-600/10 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-lg"><CheckCircle2 className="w-5 h-5" /></div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-tight">{stats.ready} Peças Prontas</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black">Prontas para entrega</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* FLUXO DE PRODUÇÃO (MANTIDO) */}
      <motion.div variants={itemVariants} className="space-y-6">
        <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
          Produção <div className="h-[1px] flex-1 bg-border" />
          <span className="text-[10px] uppercase font-black text-muted-foreground bg-muted px-2 py-1 rounded flex items-center gap-1"><Calendar className="w-3 h-3" /> {timeFilter}</span>
        </h3>
        <motion.div variants={containerVariants} className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total', val: stats.total, icon: Package, color: 'muted' },
            { label: 'Novos', val: stats.newOrders, icon: Clock, color: 'blue' },
            { label: 'Em Produção', val: stats.inProgress, icon: PackageSearch, color: 'amber' }, 
            { label: 'Prontos', val: stats.ready, icon: CheckCircle2, color: 'emerald' }
          ].map((item, i) => (
            <motion.div key={i} variants={itemVariants} whileHover={{ y: -5 }}>
              <Card className={`border-border bg-card/30 transition-all duration-200 ${item.color === 'emerald' ? 'border-emerald-500/20 bg-emerald-500/5' : ''}`}>
                <CardContent className="p-6 text-center">
                  <item.icon className={`w-5 h-5 mb-4 mx-auto ${item.color === 'muted' ? 'text-muted-foreground/30' : `text-${item.color}-500/50`}`} />
                  <div className={`text-3xl font-black ${item.color !== 'muted' ? `text-${item.color}-600 dark:text-${item.color}-400` : ''}`}>
                    {loading ? '-' : item.val}
                  </div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">{item.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
