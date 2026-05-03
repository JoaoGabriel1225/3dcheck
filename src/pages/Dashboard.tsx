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
  TrendingDown,
  LayoutDashboard,
  Zap,
  ArrowUpRight,
  Download,
  Smartphone,
  X,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion'; // Importação das ferramentas de animação

type OrderContext = {
  total: number;
  newOrders: number;
  inProgress: number;
  ready: number;
  completed: number;
  revenue: number;
  cost: number;
  profit: number;
}

type TimeFilter = 'hoje' | 'semana' | 'mes' | 'todos';

// Variantes para animações em cascata (Stagger)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState<OrderContext>({ total: 0, newOrders: 0, inProgress: 0, ready: 0, completed: 0, revenue: 0, cost: 0, profit: 0 });
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('mes');

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  const storeDisplayName = user?.user_metadata?.full_name || 
                           user?.user_metadata?.store_name || 
                           profile?.name || 
                           'Empreendedor';

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
    if (outcome === 'accepted') {
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  useEffect(() => {
    if (!profile) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        let startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        if (timeFilter === 'hoje') {
        } else if (timeFilter === 'semana') {
          startDate.setDate(startDate.getDate() - 7);
        } else if (timeFilter === 'mes') {
          startDate.setDate(1);
        } else {
          startDate = new Date('2000-01-01');
        }

        const { data: orders, error } = await supabase
          .from('orders')
          .select('status, final_price, cost_total, created_at')
          .eq('user_id', profile.id)
          .gte('created_at', startDate.toISOString());

        if (error) throw error;

        const newStats = orders.reduce((acc, order) => {
          acc.total++;
          if (order.status === 'Aguardando contato' || order.status === 'Confirmado' || order.status === 'Pendente') {
             acc.newOrders++;
          } else if (order.status === 'Preparação' || order.status === 'Imprimindo' || order.status === 'Em Andamento') {
             acc.inProgress++;
          } else if (order.status === 'Pronto' || order.status === 'Aguardando Retirada') {
             acc.ready++;
          } else if (order.status === 'Enviado' || order.status === 'Concluído') {
             acc.completed++;
          }
          
          const finalPrice = Number(order.final_price) || 0;
          const costTotal = Number(order.cost_total) || 0;
          
          acc.revenue += finalPrice;
          acc.cost += costTotal;
          
          return acc;
        }, { total: 0, newOrders: 0, inProgress: 0, ready: 0, completed: 0, revenue: 0, cost: 0, profit: 0 } as OrderContext);

        newStats.profit = newStats.revenue - newStats.cost;
        setStats(newStats);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [profile, timeFilter]);

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-10 pb-10"
    >
      
      {/* BANNER DE INSTALAÇÃO COM SAÍDA SUAVE */}
      <AnimatePresence>
        {showInstallBtn && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-4 rounded-[2rem] bg-blue-600/10 border border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Smartphone className="text-white w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-zinc-100 uppercase text-xs tracking-widest">App 3DCheck</h3>
                <p className="text-sm text-zinc-400">Instale para gerenciar seus pedidos com um toque.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button 
                asChild
                onClick={handleInstallClick}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl px-6 h-11 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center"
                >
                  <Download className="w-4 h-4 mr-2" /> INSTALAR AGORA
                </motion.button>
              </Button>
              <Button 
                onClick={() => setShowInstallBtn(false)}
                variant="ghost" 
                className="h-11 w-11 rounded-xl text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-[0.2em]">
            <LayoutDashboard className="w-4 h-4" />
            Visão Geral
          </div>
          <h2 className="text-4xl font-black tracking-tight text-foreground">
            Olá, {storeDisplayName} <span className="text-blue-500">.</span>
          </h2>
          <p className="text-muted-foreground font-medium max-w-xl">
            Acompanhe o desempenho da sua produção 3D e o resumo financeiro atualizado.
          </p>
        </div>

        <div className="flex items-center bg-muted/50 p-1.5 rounded-2xl border border-border overflow-x-auto hide-scrollbar">
           {(['hoje', 'semana', 'mes', 'todos'] as const).map((filter) => (
             <Button 
               key={filter}
               variant="ghost" 
               onClick={() => setTimeFilter(filter)}
               className={`h-9 px-4 rounded-xl text-xs font-bold transition-all relative ${timeFilter === filter ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
             >
               {timeFilter === filter && (
                 <motion.div 
                   layoutId="activeFilter"
                   className="absolute inset-0 bg-background shadow-sm rounded-xl"
                   transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                 />
               )}
               <span className="relative z-10 capitalize">
                 {filter === 'mes' ? 'Este Mês' : filter === 'semana' ? 'Esta Semana' : filter === 'todos' ? 'Todo Período' : 'Hoje'}
               </span>
             </Button>
           ))}
        </div>
      </motion.div>

      {/* MÉTRICAS FINANCEIRAS COM STAGGER */}
      <motion.div variants={containerVariants} className="grid gap-6 md:grid-cols-3">
        {[
          { label: 'Faturado', val: stats.revenue, color: 'blue', icon: DollarSign, sub: 'Receita bruta no período' },
          { label: 'Custos Operacionais', val: stats.cost, color: 'red', icon: TrendingDown, sub: 'Investimento em insumos' },
          { label: 'Lucro Líquido', val: stats.profit, color: 'emerald', icon: ArrowUpRight, sub: 'Performance Máxima', isZap: true }
        ].map((m, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card className={`relative overflow-hidden border border-border bg-card/50 backdrop-blur-sm group hover:border-${m.color}-500/50 transition-all duration-300`}>
              <div className={`absolute top-0 left-0 w-1 h-full bg-${m.color}-500/50`} />
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{m.label}</span>
                  <div className={`p-2 rounded-lg bg-${m.color}-500/10`}>
                    <m.icon className={`h-5 w-5 text-${m.color}-500`} />
                  </div>
                </div>
                <div className={`text-4xl font-black tracking-tighter ${m.color === 'emerald' ? 'text-emerald-500' : 'text-foreground'}`}>
                  {loading ? <div className="h-10 w-32 bg-muted animate-pulse rounded" /> : `R$ ${m.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </div>
                {m.isZap ? (
                  <div className="flex items-center gap-1.5 mt-2 text-emerald-600 dark:text-emerald-400/80 text-xs font-bold uppercase tracking-wider">
                    <Zap className="w-3 h-3 fill-current" />
                    {m.sub}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2 font-medium">{m.sub}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* SEÇÃO DE PEDIDOS */}
      <motion.div variants={itemVariants} className="space-y-6">
        <h3 className="text-xl font-black tracking-tight text-foreground flex items-center gap-3">
          Fluxo de Produção
          <div className="h-[1px] flex-1 bg-border" />
          <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-1 rounded flex items-center gap-1">
             <Calendar className="w-3 h-3" /> {timeFilter}
          </span>
        </h3>

        <motion.div variants={containerVariants} className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total', val: stats.total, icon: Package, color: 'muted' },
            { label: 'Novos', val: stats.newOrders, icon: Clock, color: 'blue' },
            { label: 'Em Andamento', val: stats.inProgress, icon: PackageSearch, color: 'amber' },
            { label: 'Prontos', val: stats.ready, icon: CheckCircle2, color: 'emerald' }
          ].map((item, i) => (
            <motion.div key={i} variants={itemVariants} whileHover={{ y: -5 }}>
              <Card className={`border-border bg-card/30 hover:bg-card transition-all duration-200 ${item.color === 'emerald' ? 'border-emerald-500/20 bg-emerald-500/5' : ''}`}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <item.icon className={`w-5 h-5 ${item.color === 'muted' ? 'text-muted-foreground/50' : `text-${item.color}-500/50`}`} />
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground hidden sm:block">{item.label}</span>
                  </div>
                  <div className={`text-2xl sm:text-3xl font-black ${item.color !== 'muted' ? `text-${item.color}-600 dark:text-${item.color}-400` : ''}`}>
                    {loading ? '-' : item.val}
                  </div>
                  <p className="text-[9px] sm:text-xs text-muted-foreground mt-1 sm:hidden uppercase font-bold tracking-widest">{item.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
