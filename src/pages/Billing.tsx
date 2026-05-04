import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, ShieldCheck, Zap, 
  Star, Rocket, CreditCard, Lock, 
  Fingerprint, ShieldEllipsis, X,
  ExternalLink, Verified, Award // ADICIONADO: Importação do ícone Award
} from 'lucide-react';
import { toast } from 'sonner';

// INICIALIZAÇÃO DO MERCADO PAGO - AMBIENTE SEGURO
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

  // CONFIGURAÇÃO DO BRICK - PROCESSAMENTO DIRETO
  const initialization = {
    amount: selectedPlan === 'annual' ? 199.90 : 19.90,
    payer: {
      email: profile?.email || '',
      entityType: 'individual' as const,
    },
  };

  const customization = {
    paymentMethods: {
      ticket: ['pix'] as string[],
      bankTransfer: ['pix'] as string[],
      creditCard: 'all' as const,
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
        toast.success("Pagamento autorizado! Seu acesso Elite está sendo liberado.");
      } else {
        throw new Error(result.message || 'O processador recusou a transação.');
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro no processamento. Verifique seus dados ou use outro método.");
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

      {/* SELEÇÃO DE PLANOS COM FOCO EM VALOR */}
      <div className="grid md:grid-cols-2 gap-6">
        <button 
          onClick={() => { setSelectedPlan('monthly'); setShowPaymentForm(false); }}
          className={`group p-8 rounded-[3rem] border-2 text-left transition-all duration-300 ${selectedPlan === 'monthly' ? 'border-blue-500 bg-blue-500/5 shadow-2xl shadow-blue-500/10' : 'border-border opacity-50 hover:opacity-100'}`}
        >
          <Zap className={`w-8 h-8 mb-4 transition-transform group-hover:scale-110 ${selectedPlan === 'monthly' ? 'text-blue-500' : ''}`} />
          <h4 className="font-black text-2xl uppercase italic tracking-tighter">Assinatura Flex</h4>
          <div className="text-4xl font-black mt-2">R$ 19,90 <span className="text-sm opacity-50 font-bold tracking-widest">/MÊS</span></div>
          <p className="text-[10px] font-bold text-muted-foreground mt-4 uppercase">Cancele a qualquer momento • Sem fidelidade</p>
        </button>

        <button 
          onClick={() => { setSelectedPlan('annual'); setShowPaymentForm(false); }}
          className={`group p-8 rounded-[3rem] border-2 text-left transition-all duration-300 relative ${selectedPlan === 'annual' ? 'border-amber-500 bg-amber-500/5 shadow-2xl shadow-amber-500/10' : 'border-border opacity-50 hover:opacity-100'}`}
        >
          <div className="absolute top-6 right-8 bg-amber-500 text-white text-[9px] font-black px-4 py-1 rounded-full uppercase italic tracking-widest">Compromisso Elite</div>
          <Star className={`w-8 h-8 mb-4 transition-transform group-hover:rotate-12 ${selectedPlan === 'annual' ? 'text-amber-500' : ''}`} />
          <h4 className="font-black text-2xl uppercase italic tracking-tighter">Assinatura Power</h4>
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
            Protocolo de Criptografia Ativo • Checkout 3DCheck v3.0
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8 space-y-8">
          {!showPaymentForm ? (
            <div className="space-y-6">
              <Button 
                onClick={() => setShowPaymentForm(true)}
                className="w-full h-20 text-2xl font-black bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] shadow-2xl transition-all uppercase italic flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <CreditCard className="w-7 h-7" /> ADQUIRIR LICENÇA PRO
              </Button>
              
              <div className="flex justify-center gap-6">
                 <div className="flex items-center gap-2 text-[9px] font-black uppercase text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 text-blue-500" /> Liberação em Segundos
                 </div>
                 <div className="flex items-center gap-2 text-[9px] font-black uppercase text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 text-blue-500" /> Nota Fiscal Eletrônica
                 </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-blue-500/10 animate-in zoom-in-95 duration-500">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.15em]">Conexão Segura com Mercado Pago</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowPaymentForm(false)} className="rounded-full hover:bg-red-50 text-red-500">
                  <X className="w-4 h-4 mr-1" /> CANCELAR
                </Button>
              </div>
              
              <Payment
                initialization={initialization}
                customization={customization}
                onSubmit={onSubmit}
              />
            </div>
          )}

          {/* MENSAGENS DE SEGURANÇA ELITE */}
          <div className="pt-8 border-t border-border/50">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-5 h-5 text-blue-500" />
                  <h5 className="text-[11px] font-black uppercase italic tracking-wider">Dados Blindados</h5>
                </div>
                <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">
                  Não armazenamos suas informações sensíveis. Todo o processamento é feito via tokenização criptografada ponta-a-ponta.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldEllipsis className="w-5 h-5 text-blue-500" />
                  <h5 className="text-[11px] font-black uppercase italic tracking-wider">Antifraude Ativo</h5>
                </div>
                <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">
                  Nossa integração utiliza inteligência artificial para monitorar transações 24/7, garantindo a legitimidade da sua compra.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-500" />
                  <h5 className="text-[11px] font-black uppercase italic tracking-wider">Selo de Integridade</h5>
                </div>
                <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">
                  Utilizamos o ecossistema Mercado Pago, a plataforma de pagamentos mais robusta e confiável da América Latina.
                </p>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-border/10 flex flex-col md:flex-row justify-between items-center gap-6">
               <img src="https://http2.mlstatic.com/frontend-assets/sdk-web-payments/2.1.0/mercadopago/logo_main.svg" alt="Mercado Pago" className="h-5 opacity-60 hover:opacity-100 transition-opacity" />
               
               <div className="flex items-center gap-6 opacity-40">
                  <div className="flex items-center gap-2 border border-border px-3 py-1.5 rounded-lg">
                    <Lock className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase tracking-tighter">AES-256 Verified</span>
                  </div>
                  <div className="flex items-center gap-2 border border-border px-3 py-1.5 rounded-lg">
                    <Verified className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase tracking-tighter">PCI-DSS Compliant</span>
                  </div>
               </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex flex-col items-center gap-2 opacity-30 group cursor-default">
         <p className="text-center text-[9px] text-muted-foreground font-black uppercase tracking-[0.4em] italic">
           3DCheck Global Financial Security Integration • v3.0 Elite
         </p>
         <div className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-widest">
            <ExternalLink className="w-2 h-2" />
            Visualizar Termos de Uso e Privacidade
         </div>
      </div>
    </div>
  );
}
