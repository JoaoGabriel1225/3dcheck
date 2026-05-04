import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, ShieldCheck, Zap, 
  Star, Rocket, CreditCard, Lock, 
  ShieldAlert, Award, X
} from 'lucide-react';
import { toast } from 'sonner';

// INICIALIZAÇÃO DO MERCADO PAGO
initMercadoPago('APP_USR-f6d91aaa-2bd0-4549-870e-7a988139f04f', {
  locale: 'pt-BR'
});

export default function Billing() {
  const { profile } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const trialInfo = useMemo(() => {
    if (!profile?.trialEndsAt) return { diffDays: 0, isExpired: true };
    const now = new Date();
    const end = new Date(profile.trialEndsAt);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { diffDays, isExpired: diffDays <= 0 };
  }, [profile]);

  const { diffDays, isExpired } = trialInfo;

  // CONFIGURAÇÃO DO BRICK (CORRIGIDA)
  const initialization = {
    amount: selectedPlan === 'annual' ? 199.90 : 19.90,
    payer: {
      email: profile?.email || '',
      entityType: 'individual' as const, // Correção do erro de entityType
    },
  };

  const customization = {
    paymentMethods: {
      ticket: ['pix'] as string[],
      bankTransfer: ['pix'] as string[],
      creditCard: 'all' as const,
      // Removido 'installments' daqui para evitar o erro de parâmetro inválido
    },
    visual: {
      style: {
        theme: 'flat' as const,
      }
    }
  };

  const onSubmit = async ({ formData }: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/payment', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData,
          userId: profile?.id,
          planType: selectedPlan
        }),
      });

      const result = await response.json();

      if (result.status === 'approved' || result.status === 'pending') {
        toast.success("Pagamento processado com sucesso!");
      } else {
        throw new Error(result.message || 'Erro no pagamento');
      }
    } catch (error) {
      console.error(error);
      toast.error("Verifique os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 px-4 md:px-0 animate-in fade-in duration-700">
      
      {/* HEADER ELITE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-inner">
            <ShieldCheck className="w-10 h-10 text-blue-600" />
          </div>
          <div>
            <h2 className="text-4xl font-black tracking-tighter uppercase italic">Elite <span className="text-blue-500">3DCheck</span></h2>
            <p className="text-muted-foreground font-semibold">Tecnologia de ponta para empreendedores 3D.</p>
          </div>
        </div>
      </div>

      {/* SELEÇÃO DE PLANOS */}
      <div className="grid md:grid-cols-2 gap-6">
        <button 
          onClick={() => { setSelectedPlan('monthly'); setShowPaymentForm(false); }}
          className={`p-8 rounded-[3rem] border-2 text-left transition-all ${selectedPlan === 'monthly' ? 'border-blue-500 bg-blue-500/5 shadow-xl shadow-blue-500/10' : 'border-border opacity-60'}`}
        >
          <Zap className={`w-8 h-8 mb-4 ${selectedPlan === 'monthly' ? 'text-blue-500' : ''}`} />
          <h4 className="font-black text-2xl uppercase italic">Plano Mensal</h4>
          <p className="text-4xl font-black">R$ 19,90 <span className="text-sm opacity-50 font-bold">/MÊS</span></p>
        </button>

        <button 
          onClick={() => { setSelectedPlan('annual'); setShowPaymentForm(false); }}
          className={`p-8 rounded-[3rem] border-2 text-left transition-all relative ${selectedPlan === 'annual' ? 'border-amber-500 bg-amber-500/5 shadow-xl shadow-amber-500/10' : 'border-border opacity-60'}`}
        >
          <div className="absolute top-6 right-8 bg-amber-500 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase italic">Melhor Valor</div>
          <Star className={`w-8 h-8 mb-4 ${selectedPlan === 'annual' ? 'text-amber-500' : ''}`} />
          <h4 className="font-black text-2xl uppercase italic">Plano Anual</h4>
          <p className="text-4xl font-black">R$ 199,90 <span className="text-sm opacity-50 font-bold">/ANO</span></p>
        </button>
      </div>

      <Card className="border-border bg-card/40 backdrop-blur-md rounded-[3.5rem] overflow-hidden border-t-blue-500/20 shadow-2xl">
        <CardHeader className="p-12 border-b border-border/50 bg-accent/5 text-center">
          <CardTitle className="font-black text-3xl uppercase italic flex justify-center gap-3">
            <Rocket className="text-blue-500" /> Checkout Seguro
          </CardTitle>
          <CardDescription className="font-bold uppercase tracking-widest text-[10px]">
            Pagamento Processado via Mercado Pago
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8 space-y-8">
          {!showPaymentForm ? (
            <div className="space-y-6">
              <Button 
                onClick={() => setShowPaymentForm(true)}
                className="w-full h-20 text-2xl font-black bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] shadow-2xl transition-all uppercase italic flex items-center justify-center gap-3"
              >
                <CreditCard className="w-8 h-8" /> ASSINAR AGORA
              </Button>
              
              {/* BENEFÍCIOS RÁPIDOS */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground bg-accent/10 p-3 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Acesso Imediato
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground bg-accent/10 p-3 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Suporte Prioritário
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-[2.5rem] border-2 border-blue-500/10 animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-6 px-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Ambiente Criptografado</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowPaymentForm(false)} className="rounded-full hover:bg-red-50 text-red-500"><X className="w-4 h-4" /></Button>
              </div>
              
              <Payment
                initialization={initialization}
                customization={customization}
                onSubmit={onSubmit}
              />
            </div>
          )}

          {/* SEÇÃO DE SEGURANÇA E CONFIANÇA */}
          <div className="pt-8 border-t border-border/50">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center space-y-2 group">
                <div className="p-3 bg-emerald-500/10 rounded-full group-hover:bg-emerald-500/20 transition-colors">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <h5 className="text-[11px] font-black uppercase italic">Compra Segura</h5>
                <p className="text-[9px] text-muted-foreground font-bold leading-relaxed px-2">
                  Seus dados são protegidos por criptografia de nível bancário 256-bits SSL.
                </p>
              </div>

              <div className="flex flex-col items-center text-center space-y-2 group">
                <div className="p-3 bg-blue-500/10 rounded-full group-hover:bg-blue-500/20 transition-colors">
                  <Award className="w-6 h-6 text-blue-600" />
                </div>
                <h5 className="text-[11px] font-black uppercase italic">Garantia Maker</h5>
                <p className="text-[9px] text-muted-foreground font-bold leading-relaxed px-2">
                  Satisfação garantida ou seu acesso de volta. Suporte direto com o desenvolvedor.
                </p>
              </div>

              <div className="flex flex-col items-center text-center space-y-2 group">
                <div className="p-3 bg-amber-500/10 rounded-full group-hover:bg-amber-500/20 transition-colors">
                  <ShieldAlert className="w-6 h-6 text-amber-600" />
                </div>
                <h5 className="text-[11px] font-black uppercase italic">Privacidade Total</h5>
                <p className="text-[9px] text-muted-foreground font-bold leading-relaxed px-2">
                  Nunca compartilhamos seus dados. Sua operação 3D permanece 100% privada.
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-center items-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all">
               <img src="https://upload.wikimedia.org/wikipedia/commons/b/b0/Mercado_Pago_logo.svg" alt="Mercado Pago" className="h-4" />
               <div className="h-4 w-px bg-border" />
               <div className="flex items-center gap-1">
                 <Lock className="w-3 h-3" />
                 <span className="text-[10px] font-black uppercase tracking-tighter">SSL Secured</span>
               </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <p className="text-center text-[9px] text-muted-foreground font-black uppercase tracking-[0.4em] italic opacity-30">
        3DCheck Enterprise Security System • v3.0 Elite
      </p>
    </div>
  );
}
