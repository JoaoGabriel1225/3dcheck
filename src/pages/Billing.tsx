import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, ShieldCheck, Zap, Star, Rocket, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Billing() {
  const { profile } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false); // Estado para controlar o botão

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

  // Função ATUALIZADA: Chama a sua própria API na Vercel
  const handleCheckout = async () => {
    if (selectedPlan !== 'monthly') {
      toast.info("O plano anual estará disponível em breve!");
      return;
    }

    setLoading(true);

    try {
      // Chama a Serverless Function que você criou em api/checkout.js
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: profile.id, 
          email: profile.email 
        }),
      });

      const data = await response.json();

      if (data.init_point) {
        // Redireciona para o Checkout Seguro Oficial (com PIX e Cartão liberados)
        window.location.href = data.init_point;
      } else {
        throw new Error('Falha ao gerar link. Verifique as configurações da API.');
      }
    } catch (err) {
      console.error('Erro no checkout:', err);
      toast.error('Erro ao conectar com o Mercado Pago. Tente novamente.');
    } finally {
      setLoading(false);
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
              <h3 className="font-black text-lg text-red-800 dark:text-red-400 tracking-tight">Acesso Expirado</h3>
              <p className="text-sm text-red-600/80 dark:text-red-400/80 font-medium mt-1">
                Seu período de teste acabou. Assine para continuar usando o Marketplace e a Gestão.
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
                Você tem <strong>{diffDays} dias</strong> restantes. Assine agora para garantir sua vaga no plano Pro!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SELEÇÃO DE PLANOS */}
      <div className="grid md:grid-cols-2 gap-4">
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

        <button 
          onClick={() => setSelectedPlan('annual')}
          className={`p-6 rounded-[2.5rem] border-2 text-left transition-all relative overflow-hidden ${selectedPlan === 'annual' ? 'border-emerald-500 bg-emerald-500/5 ring-4 ring-emerald-500/10' : 'border-border bg-card/50 hover:border-emerald-500/30'}`}
        >
          <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
            Melhor Preço
          </div>
          <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-xl ${selectedPlan === 'annual' ? 'bg-emerald-500 text-white' : 'bg-accent text-muted-foreground'}`}>
              <Star className="w-5 h-5" />
            </div>
            {selectedPlan === 'annual' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          </div>
          <h4 className="font-black text-xl tracking-tight">Anual</h4>
          <p className="text-muted-foreground text-xs font-medium mb-4 tracking-wide text-emerald-600 dark:text-emerald-500 uppercase">Economize muito</p>
          <div className="text-3xl font-black tracking-tighter">R$ 199,90 <span className="text-sm font-medium text-muted-foreground">/ano</span></div>
        </button>
      </div>

      {/* CHECKOUT */}
      <Card className="border-border bg-card/50 backdrop-blur-sm shadow-2xl rounded-[3rem] overflow-hidden">
        <CardHeader className="p-10 border-b border-border/50 bg-accent/10">
          <CardTitle className="font-black text-2xl tracking-tight flex items-center gap-2">
            <Rocket className="w-6 h-6 text-blue-500" />
            Checkout Seguro
          </CardTitle>
          <CardDescription className="font-medium">
            Assinatura do plano <strong>{selectedPlan === 'monthly' ? 'Mensal' : 'Anual'}</strong>. 
            O PIX e Cartão estão liberados.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-10 space-y-6">
          <ul className="space-y-4">
            {[
              "Marketplace Hub com descontos reais",
              "Calculadora de Custos de Impressão",
              "Vitrine Pública para seus clientes",
              "Gestão de Pedidos e Clientes",
              "Notificações automáticas por e-mail"
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-sm font-bold text-foreground/80">
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
                {feature}
              </li>
            ))}
          </ul>

          <Button 
            onClick={handleCheckout}
            disabled={loading}
            className="w-full h-16 text-xl font-black bg-blue-600 hover:bg-blue-500 text-white rounded-[1.5rem] shadow-2xl shadow-blue-500/20 transition-all uppercase tracking-tight flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Processando...
              </>
            ) : (
              "Assinar Plano Pro"
            )}
          </Button>
          
          <p className="text-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            Acesso imediato via PIX • Pagamento seguro via Mercado Pago
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
