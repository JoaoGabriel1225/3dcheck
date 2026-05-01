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
  Calendar, // Novo ícone importado
  CheckCircle2 // Novo ícone importado
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type OrderContext = {
  total: number;
  newOrders: number;
  inProgress: number;
  ready: number; // Novo status: Prontos
  completed: number; // Enviado/Entregue
  revenue: number;
  cost: number;
  profit: number;
}

type TimeFilter = 'hoje' | 'semana' | 'mes' | 'todos';

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState<OrderContext>({ total: 0, newOrders: 0, inProgress: 0, ready: 0, completed: 0, revenue: 0, cost: 0, profit: 0 });
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('mes'); // 'mes' como padrão

  // LÓGICA DE INSTALAÇÃO DO APP (PWA)
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
        // 1. Determina a data de corte com base no filtro selecionado
        let startDate = new Date();
        startDate.setHours(0, 0, 0, 0); // Zera hora para iniciar do começo do dia

        if (timeFilter === 'hoje') {
          // startDate já está no início de hoje
        } else if (timeFilter === 'semana') {
          // Volta para o último domingo/segunda dependendo da configuração. Vamos usar os últimos 7 dias.
          startDate.setDate(startDate.getDate() - 7);
        } else if (timeFilter === 'mes') {
          // Dia 1 do mês atual
          startDate.setDate(1);
        } else {
          // 'todos': ano 2000 para pegar tudo
          startDate = new Date('2000-01-01');
        }

        // 2. Busca no Supabase filtrando pela data de criação (created_at)
        const { data: orders, error } = await supabase
          .from('orders')
          .select('status, final_price, cost_total, created_at')
          .eq('user_id', profile.id)
          .gte('created_at', startDate.toISOString());

        if (error) throw error;

        // 3. Processa as estatísticas de acordo com os novos status
        const newStats = orders.reduce((acc, order) => {
          acc.total++;
          
          // Lógica atualizada de status
          if (order.status === 'Aguardando contato' || order.status === 'Confirmado' || order.status === 'Pendente') {
             acc.newOrders++;
          } else if (order.status === 'Preparação' || order.status === 'Imprimindo' || order.status === 'Em Andamento') {
             acc.inProgress++;
          } else if (order.status === 'Pronto' || order.status === 'Aguardando Retirada') {
             acc.ready++; // <-- NOVO CONTADOR
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
  }, [profile, timeFilter]); // O useEffect roda de novo sempre que 'timeFilter' muda

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-10">
      
      {/* BANNER DE INSTALAÇÃO DO APP (PWA CTA) */}
      {showInstallBtn && (
        <div className="p-4 rounded-[2rem] bg-blue-600/10 border border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-700">
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
              onClick={handleInstallClick}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl px-6 h-11 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
            >
              <Download className="w-4 h-4 mr-2" /> INSTALAR AGORA
            </Button>
            <Button 
              onClick={() => setShowInstallBtn(false)}
              variant="ghost" 
              className="h-11 w-11 rounded-xl text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      {/* HEADER DO DASHBOARD COM FILTRO TEMPORAL */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
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

        {/* SELETOR DE FILTRO DE DATA ESTILO PILL */}
        <div className="flex items-center bg-muted/50 p-1.5 rounded-2xl border border-border overflow-x-auto hide-scrollbar">
           <Button 
             variant="ghost" 
             onClick={() => setTimeFilter('hoje')}
             className={`h-9 px-4 rounded-xl text-xs font-bold transition-all ${timeFilter === 'hoje' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
           >
             Hoje
           </Button>
           <Button 
             variant="ghost" 
             onClick={() => setTimeFilter('semana')}
             className={`h-9 px-4 rounded-xl text-xs font-bold transition-all ${timeFilter === 'semana' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
           >
             Esta Semana
           </Button>
           <Button 
             variant="ghost" 
             onClick={() => setTimeFilter('mes')}
             className={`h-9 px-4 rounded-xl text-xs font-bold transition-all ${timeFilter === 'mes' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
           >
             Este Mês
           </Button>
           <Button 
             variant="ghost" 
             onClick={() => setTimeFilter('todos')}
             className={`h-9 px-4 rounded-xl text-xs font-bold transition-all ${timeFilter === 'todos' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
           >
             Todo Período
           </Button>
        </div>
      </div>

      {/* MÉTRICAS FINANCEIRAS */}
      <div className="grid gap-6 md:grid-cols-3">
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
            <p className="text-xs text-muted-foreground mt-2 font-medium">Receita bruta no período</p>
          </CardContent>
        </Card>

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
          {/* Badge que mostra o filtro atual pra reforçar o contexto visual */}
          <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-1 rounded flex items-center gap-1">
             <Calendar className="w-3 h-3" /> {timeFilter}
          </span>
        </h3>

        <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
          <Card className="border-border bg-card/30 hover:bg-card transition-all duration-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <Package className="w-5 h-5 text-muted-foreground/50" />
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground hidden sm:block">Total</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black">{loading ? '-' : stats.total}</div>
              <p className="text-[9px] sm:text-xs text-muted-foreground mt-1 sm:hidden uppercase font-bold tracking-widest">Total</p>
            </CardContent>
          </Card>
          
          <Card className="border-border bg-card/30 hover:bg-card transition-all duration-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <Clock className="w-5 h-5 text-blue-500/50" />
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground hidden sm:block">Novos</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-blue-500">{loading ? '-' : stats.newOrders}</div>
              <p className="text-[9px] sm:text-xs text-muted-foreground mt-1 sm:hidden uppercase font-bold tracking-widest">Novos</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/30 hover:bg-card transition-all duration-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <PackageSearch className="w-5 h-5 text-amber-500/50" />
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground hidden sm:block">Em Andamento</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-500">{loading ? '-' : stats.inProgress}</div>
              <p className="text-[9px] sm:text-xs text-muted-foreground mt-1 sm:hidden uppercase font-bold tracking-widest">Fazendo</p>
            </CardContent>
          </Card>

          {/* NOVO CARD: PRONTOS */}
          <Card className="border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all duration-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-500/80" />
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-500 hidden sm:block">Prontos</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{loading ? '-' : stats.ready}</div>
              <p className="text-[9px] sm:text-xs text-emerald-600/70 dark:text-emerald-500/70 mt-1 sm:hidden uppercase font-bold tracking-widest">Prontos</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
