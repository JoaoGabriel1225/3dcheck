import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Certifique-se de que o npm install foi feito
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

// Gráfico que se adapta aos dados reais do Supabase
const DynamicSparkline = ({ data, color }: { data: number[], color: string }) => {
  if (!data || data.length < 2) return <div className="w-16 h-8 border-b border-dashed border-muted-foreground/20" />;
  
  const max = Math.max(...data) || 1;
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 35 - ((val - min) / range) * 30; 
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
    trends: { revenue: [], cost: [], profit: [] }
  });
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('mes');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  const storeDisplayName = user?.user_metadata?.full_name || profile?.name || 'Empreendedor';

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

        const { data: orders, error } = await supabase
          .from('orders')
          .select('status, final_price, cost_total, created_at')
          .eq('user_id', profile.id)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true });

        if (error) throw error;

        const dailyData: Record<string, { rev: number, cst: number }> = {};
        
        const newStats = orders.reduce((acc, order) => {
          acc.total++;
          const dateKey = new Date(order.created_at).toLocaleDateString();
          if (!dailyData[dateKey]) dailyData[dateKey] = { rev: 0, cst: 0 };

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
        }, { total: 0, newOrders: 0, inProgress: 0, ready: 0, completed: 0, revenue: 0, cost: 0, profit: 0, trends: { revenue: [], cost: [], profit: [] } } as OrderContext);

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
      
      {/* BANNER PWA */}
      <AnimatePresence>
        {showInstallBtn && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="p-4 rounded-[2rem] bg-blue-600/10 border border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20"><Smartphone className="text-white w-6 h-6" /></div>
              <div>
                <h3 className="font-black text-zinc-100 uppercase text-xs tracking-widest">App 3DCheck</h3>
                <p className="text-sm text-zinc-400">Instale para gerenciar seus pedidos com um toque.</p>
              </div>
            </div>
            <Button asChild onClick={handleInstallClick}>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl px-6 h-11 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center">
                <Download className="w-4 h-4 mr-2" /> INSTALAR AGORA
              </motion.button>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-[0.2em]"><LayoutDashboard className="w-4 h-4" />Visão Geral</div>
          <h2 className="text-4xl font-black tracking-tight text-foreground">Olá, {storeDisplayName} <span className="text-blue-500">.</span></h2>
          <p className="text-muted-foreground font-medium max-w-xl">Acompanhe sua produção 3D e o resumo financeiro.</p>
        </div>
        <div className="flex items-center bg-muted/50 p-1.5 rounded-2xl border border-border overflow-x-auto hide-scrollbar">
           {(['hoje', 'semana', 'mes', 'todos'] as const).map((filter) => (
             <Button key={filter} variant="ghost" onClick={() => setTimeFilter(filter)} className={`h-9 px-4 rounded-xl text-xs font-bold transition-all relative ${timeFilter === filter ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
               {timeFilter === filter && <motion.div layoutId="activeFilter" className="absolute inset-0 bg-background shadow-sm rounded-xl" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
               <span className="relative z-10 capitalize">{filter === 'mes' ? 'Este Mês' : filter === 'semana' ? 'Esta Semana' : filter === 'todos' ? 'Todo Período' : 'Hoje'}</span>
             </Button>
           ))}
        </div>
      </motion.div>

      {/* FINANCEIRO */}
      <motion.div variants={containerVariants} className="grid gap-6 md:grid-cols-3">
        {[
          { label: 'Faturado', val: stats.revenue, trend: stats.trends.revenue, color: '#3b82f6', sub: 'Receita bruta' },
          { label: 'Custos', val: stats.cost, trend: stats.trends.cost, color: '#ef4444', sub: 'Em insumos' },
          { label: 'Lucro Líquido', val: stats.profit, trend: stats.trends.profit, color: '#10b981', sub: 'Performance Máxima', isZap: true }
        ].map((m, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card className="relative overflow-hidden border border-border bg-card/50 backdrop-blur-sm group transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{m.label}</span>
                  <DynamicSparkline data={m.trend} color={m.color} />
                </div>
                <div className={`text-4xl font-black tracking-tighter ${m.label === 'Lucro Líquido' ? 'text-emerald-500' : 'text-foreground'}`}>
                  {loading ? <div className="h-10 w-32 bg-muted animate-pulse rounded" /> : `R$ ${m.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  {m.isZap && <Zap className="w-3 h-3 text-emerald-500 fill-current" />} {m.sub}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* PRÓXIMAS AÇÕES */}
      {(stats.newOrders > 0 || stats.ready > 0) && (
        <motion.div variants={itemVariants} className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 flex items-center gap-2">
            <ListChecks className="w-4 h-4" /> Próximas Ações
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {stats.newOrders > 0 && (
              <div 
                onClick={() => navigate('/app/orders')} 
                className="flex items-center justify-between p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl group hover:bg-blue-500/10 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-bold">{stats.newOrders} novos pedidos</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Confirmar e Iniciar</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-blue-500 group-hover:translate-x-1 transition-transform" />
              </div>
            )}
            {stats.ready > 0 && (
              <div 
                onClick={() => navigate('/app/orders')} 
                className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl group hover:bg-emerald-500/10 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-sm font-bold">{stats.ready} peças prontas</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Organizar Entrega</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-1 transition-transform" />
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* PRODUÇÃO */}
      <motion.div variants={itemVariants} className="space-y-6">
        <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
          Produção <div className="h-[1px] flex-1 bg-border" />
          <span className="text-[10px] font-black text-muted-foreground bg-muted px-2 py-1 rounded"><Calendar className="w-3 h-3 inline mr-1" /> {timeFilter}</span>
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
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <item.icon className={`w-5 h-5 ${item.color === 'muted' ? 'text-muted-foreground/50' : `text-${item.color}-500/50`}`} />
                  </div>
                  <div className={`text-2xl sm:text-3xl font-black ${item.color !== 'muted' ? `text-${item.color}-600 dark:text-${item.color}-400` : ''}`}>{loading ? '-' : item.val}</div>
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
