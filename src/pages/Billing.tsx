import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, ShieldCheck, Zap, Star, Rocket } from 'lucide-react';

export default function Billing() {
  const { profile } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');

  // Cálculo de dias restantes do Trial
  const trialInfo = useMemo(() => {
    if (!profile?.trialEndsAt) {
      return { diffDays: 0, isExpired: true };
    }
    const now = new Date();
    const end = new Date(profile.trialEndsAt);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { diffDays, isExpired: diffDays <= 0 };
  }, [profile]);

  const { diffDays, isExpired } = trialInfo;

  // Função para redirecionar ao Mercado Pago
  const handleCheckout = () => {
    if (selectedPlan === 'monthly') {
      // Seu Link do Mercado Pago para R$ 19,90
      window.location.href = "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=d8a042c7777e41bf90d623f77209c3e3";
    } else {
      // Placeholder para o link Anual (quando você criar o plano de R$ 199,90)
      alert("Link do plano anual em breve! Use o mensal por enquanto.");
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12 px-4 md:px-0">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-500/10 rounded-xl">
          <ShieldCheck className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tight text-foreground uppercase">Plano Profissional</h2>
          <p className="text-muted-foreground font-medium">Libere o Marketplace Hub e automações exclusivas.</p>
        </div>
      </div>

      {/* STATUS DO TRIAL */}
      {isExpired ? (
        <Card className="border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 shadow-none rounded-3xl">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-500" />
            </div>
            <div>
              <h3 className="font-black text-lg text-red-800 dark:text-red-400 tracking-tight">Período Grátis Encerrado</h3>
              <p className="text-sm text-red-600/80 dark:text-red-400/80 font-medium mt-1">
                Seu acesso aos recursos avançados expirou. Assine abaixo para continuar operando.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 shadow-none rounded-3xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h3 className="font-black text-lg text-emerald-800 dark:text-emerald-400 tracking-tight">Teste Grátis Ativo</h3>
              <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80 font-medium mt-1">
                Você ainda tem <strong>{diffDays} dias</strong> para explorar o 3DCheck sem custos.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SELEÇÃO DE PLANOS ATUALIZADOS */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* MENSAL - R$ 19,90 */}
        <button 
          onClick={() => setSelectedPlan('monthly')}
          className={`p-6 rounded-[2.5rem] border-2 text-left transition-all ${selectedPlan === 'monthly' ? 'border-blue-500 bg-blue-500/5 ring-4 ring-blue-500/10' : 'border-border bg-card/50 hover:border-blue-500/30'}`}
        >
          <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-xl ${selectedPlan === 'monthly' ? 'bg-blue-500 text-white' : 'bg-accent text-muted-foreground'}`}>
              <Zap className="w-5 h-5" />
            </div>
            {selectedPlan === 'monthly' && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
          </div>
          <h4 className="font-black text-xl tracking-tight">Mensal</h4>
          <p className="text-muted-foreground text-xs font-medium mb-4 tracking-wide uppercase">Flexibilidade total</p>
          <div className="text-3xl font-black tracking-tighter">R$ 19,90 <span className="text-sm font-medium text-muted-foreground">/mês</span></div>
        </button>

        {/* ANUAL - R$ 199,90 */}
        <button 
          onClick={() => setSelectedPlan('annual')}
          className={`p-6 rounded-[2.5rem] border-2 text-left transition-all relative overflow-hidden ${selectedPlan === 'annual' ? 'border-emerald-500 bg-emerald-500/5 ring-4 ring-emerald-500/10' : 'border-border bg-card/50 hover:border-emerald-500/30'}`}
        >
          <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
            Economia Máxima
          </div>
          <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-xl ${selectedPlan === 'annual' ? 'bg-emerald-500 text-white' : 'bg-accent text-muted-foreground'}`}>
              <Star className="w-5 h-5" />
            </div>
            {selectedPlan === 'annual' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          </div>
          <h4 className="font-black text-xl tracking-tight">Anual</h4>
          <p className="text-muted-foreground text-xs font-medium mb-4 tracking-wide text-emerald-600 dark:text-emerald-500 uppercase">2 meses de bônus</p>
          <div className="text-3xl font-black tracking-tighter">R$ 199,90 <span className="text-sm font-medium text-muted-foreground">/ano</span></div>
        </button>
      </div>

      {/* ÁREA DE RESUMO E CHECKOUT */}
      <Card className="border-border bg-card/50 backdrop-blur-sm shadow-2xl rounded-[3rem] overflow-hidden">
        <CardHeader className="p-10 border-b border-border/50 bg-accent/10">
          <CardTitle className="font-black text-2xl tracking-tight flex items-center gap-2">
            <Rocket className="w-6 h-6 text-blue-500" />
            Checkout Seguro
          </CardTitle>
          <CardDescription className="font-medium">
            Você está assinando o plano <strong>{selectedPlan === 'monthly' ? 'Mensal' : 'Anual'}</strong>. 
            O período de 7 dias grátis será aplicado.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-10 space-y-6">
          <ul className="space-y-4">
            {[
              "Acesso ilimitado ao Marketplace Hub",
              "Calculadora de Custos automática",
              "Vitrine Pública personalizada",
              "Notificações automáticas para clientes",
              "Dashboard inteligente de pedidos"
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-sm font-bold text-foreground/80">
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
                {feature}
              </li>
            ))}
          </ul>

          <Button 
            onClick={handleCheckout}
            className="w-full h-16 text-xl font-black bg-blue-600 hover:bg-blue-500 text-white rounded-[1.5rem] shadow-2xl shadow-blue-500/20 transition-all uppercase tracking-tight"
          >
            Ativar Acesso Pro Agora
          </Button>
          
          <p className="text-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            Pagamento processado via Mercado Pago • Cancele quando quiser
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
