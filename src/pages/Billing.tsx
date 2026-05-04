import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, ShieldCheck, Zap, 
  Star, CreditCard, Lock, 
  Fingerprint, ShieldEllipsis, Verified, Award
} from 'lucide-react';
import { toast } from 'sonner';

export default function Billing() {
  const { profile } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);

  const trialInfo = useMemo(() => {
    if (!profile?.trialEndsAt) return { diffDays: 0, isExpired: true };
    const now = new Date();
    const end = new Date(profile.trialEndsAt);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { diffDays, isExpired: diffDays <= 0 };
  }, [profile]);

  const { diffDays, isExpired } = trialInfo;

  // FUNÇÃO DE CHECKOUT CORRIGIDA PARA VITE
  const handleCheckout = async () => {
    // 1. Verificação de segurança: garante que o perfil e os dados básicos existem
    if (!profile?.id || !profile?.email) {
      toast.error("Erro: Perfil de usuário não carregado. Tente recarregar a página.");
      return;
    }

    setLoading(true);
    
    // 2. CORREÇÃO: No Vite, usamos import.meta.env e o prefixo VITE_
    const priceId = selectedPlan === 'annual' 
      ? import.meta.env.VITE_STRIPE_PRICE_ANUAL 
      : import.meta.env.VITE_STRIPE_PRICE_MENSAL;

    // 3. Verificação do ID do plano antes de chamar a API
    if (!priceId) {
      setLoading(false);
      console.error("Price ID não encontrado. Verifique se as variáveis VITE_STRIPE_PRICE_... estão no Vercel.");
      toast.error("Erro de configuração: ID do plano não encontrado.");
      return;
    }

    try {
      const response = await fetch('/api/payment', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: priceId,
          userId: profile.id,
          email: profile.email
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Redireciona para o Checkout oficial do Stripe
        window.location.assign(data.url);
      } else {
        throw new Error(data.error || 'Erro ao gerar sessão de pagamento.');
      }
    } catch (error: any) {
      console.error("Erro no checkout:", error);
      toast.error("Erro ao iniciar checkout: " + (error.message || "Tente novamente."));
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 px-4 md:px-0 animate-in fade-in duration-700">
      
      {/* HEADER DE AUTORIDADE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-inner">
            <ShieldCheck className="w-10 h-10 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
               <h2 className="text-4xl font-black tracking-tighter uppercase italic">Elite <span className="text-blue-500">3DCheck</span></h2>
               <Verified className="w-5 h-5 text-blue-500 fill-blue-500/10" />
            </div>
            <p className="text-muted-foreground font-semibold">Infraestrutura de gestão certificada para fabricantes 3D.</p>
          </div>
        </div>
      </div>

      {/* SELEÇÃO DE PLANOS */}
      <div className="grid md:grid-cols-2 gap-6">
        <button 
          onClick={() => setSelectedPlan('monthly')}
          className={`group p-8 rounded-[3rem] border-2 text-left transition-all duration-300 ${selectedPlan === 'monthly' ? 'border-blue-500 bg-blue-500/5 shadow-2xl shadow-blue-500/10' : 'border-border opacity-50 hover:opacity-100'}`}
        >
          <Zap className={`w-8 h-8 mb-4 transition-transform group-hover:scale-110 ${selectedPlan === 'monthly' ? 'text-blue-500' : ''}`} />
          <h4 className="font-black text-2xl uppercase italic tracking-tighter">Plano Pro</h4>
          <div className="text-4xl font-black mt-2">R$ 19,90 <span className="text-sm opacity-50 font-bold tracking-widest">/MÊS</span></div>
          <p className="text-[10px] font-bold text-muted-foreground mt-4 uppercase">Cancele a qualquer momento • Sem fidelidade</p>
        </button>

        <button 
          onClick={() => setSelectedPlan('annual')}
          className={`group p-8 rounded-[3rem] border-2 text-left transition-all duration-300 relative ${selectedPlan === 'annual' ? 'border-amber-500 bg-amber-500/5 shadow-2xl shadow-amber-500/10' : 'border-border opacity-50 hover:opacity-100'}`}
        >
          <div className="absolute top-6 right-8 bg-amber-500 text-white text-[9px] font-black px-4 py-1 rounded-full uppercase italic tracking-widest">Melhor Valor</div>
          <Star className={`w-8 h-8 mb-4 transition-transform group-hover:rotate-12 ${selectedPlan === 'annual' ? 'text-amber-500' : ''}`} />
          <h4 className="font-black text-2xl uppercase italic tracking-tighter">Plano Pro Anual</h4>
          <div className="text-4xl font-black mt-2">R$ 199,90 <span className="text-sm opacity-50 font-bold tracking-widest">/ANO</span></div>
          <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-4 uppercase italic">Economia de R$ 38,90 comparado ao mensal</p>
        </button>
      </div>

      <Card className="border-border bg-card/40 backdrop-blur-md rounded-[3.5rem] overflow-hidden border-t-blue-500/20 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)]">
        <CardHeader className="p-12 border-b border-border/50 bg-accent/5 text-center">
          <CardTitle className="font-black text-3xl uppercase italic flex justify-center gap-3">
            <Lock className="text-blue-500 w-8 h-8" /> Central de Pagamento
          </CardTitle>
          <CardDescription className="font-bold uppercase tracking-[0.2em] text-[9px] opacity-70">
            Protocolo de Criptografia Ativo • Checkout Stripe Global
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8 space-y-8">
          <div className="space-y-6">
            <Button 
              onClick={handleCheckout}
              disabled={loading}
              className="w-full h-20 text-2xl font-black bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] shadow-2xl transition-all uppercase italic flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  PROCESSANDO...
                </div>
              ) : (
                <>
                  <CreditCard className="w-7 h-7" /> 
                  ADQUIRIR LICENÇA {selectedPlan === 'annual' ? 'PRO ANUAL' : 'PRO'}
                </>
              )}
            </Button>
            
            <div className="flex justify-center gap-6">
               <div className="flex items-center gap-2 text-[9px] font-black uppercase text-muted-foreground">
                  <CheckCircle2 className="w-3 h-3 text-blue-500" /> Ativação Imediata
               </div>
               <div className="flex items-center gap-2 text-[9px] font-black uppercase text-muted-foreground">
                  <CheckCircle2 className="w-3 h-3 text-blue-500" /> Suporte Global Pix/Cartão
               </div>
            </div>
          </div>

          {/* MENSAGENS DE SEGURANÇA */}
          <div className="pt-8 border-t border-border/50">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-5 h-5 text-blue-500" />
                  <h5 className="text-[11px] font-black uppercase italic tracking-wider">Dados Blindados</h5>
                </div>
                <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">
                  Processamento líder mundial via Stripe. Não armazenamos seus cartões[cite: 1].
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldEllipsis className="w-5 h-5 text-blue-500" />
                  <h5 className="text-[11px] font-black uppercase italic tracking-wider">Radar Antifraude</h5>
                </div>
                <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">
                  Monitoramento em tempo real para garantir a legitimidade total da sua compra.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-500" />
                  <h5 className="text-[11px] font-black uppercase italic tracking-wider">Selo de Integridade</h5>
                </div>
                <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">
                  Ambiente de checkout certificado e otimizado para o mercado global.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
