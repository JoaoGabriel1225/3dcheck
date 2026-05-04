import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, CheckCircle2, ShieldCheck, Zap, 
  Star, Rocket, Loader2, Copy, CreditCard, Sparkles,
  SendHorizontal, FileUp, X
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
  const [file, setFile] = useState<File | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const pixKey = "24971502-ab9f-4837-88ff-73eea13fa78a";

  const trialInfo = useMemo(() => {
    if (!profile?.trialEndsAt) return { diffDays: 0, isExpired: true };
    const now = new Date();
    const end = new Date(profile.trialEndsAt);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { diffDays, isExpired: diffDays <= 0 };
  }, [profile]);

  const { diffDays, isExpired } = trialInfo;

  // FUNÇÃO QUE PROCESSA O PAGAMENTO DO BRICK
  const initialization = {
    amount: selectedPlan === 'annual' ? 199.90 : 19.90,
    payer: {
      email: profile?.email || '',
    },
  };

  const customization = {
    paymentMethods: {
      ticket: ['pix'], // Forçamos a exibição do Pix
      bankTransfer: ['pix'],
      creditCard: 'all',
      installments: 12,
    },
    visual: {
      style: {
        theme: 'flat' as const, // Visual limpo para o 3DCheck
      }
    }
  };

  const onSubmit = async ({ formData }: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/payment', { // ROTA DA SUA NOVA API
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
        toast.success("Pagamento iniciado! Siga as instruções na tela.");
      } else {
        throw new Error(result.message || 'Erro no pagamento');
      }
    } catch (error) {
      console.error(error);
      toast.error("Falha ao processar o pagamento. Verifique os dados.");
    } finally {
      setLoading(false);
    }
  };

  // FUNÇÃO PARA ATIVAÇÃO MANUAL (PIX COM COMPROVANTE)
  const submitManualPayment = async () => {
    if (!file) {
      toast.error("Anexe o comprovante.");
      return;
    }
    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `pix_${profile?.id}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('comprovantes').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from('subscriptions_pending').insert([{ 
        user_id: profile?.id, 
        user_email: profile?.email,
        receipt_url: fileName,
        plan_type: selectedPlan,
        status: 'pending'
      }]);
      if (dbError) throw dbError;
      toast.success("Enviado! João Gabriel validará em breve.");
      setFile(null);
    } catch (err) {
      toast.error("Erro ao enviar.");
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 px-4 md:px-0 animate-in fade-in duration-700">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-inner">
            <ShieldCheck className="w-10 h-10 text-blue-600" />
          </div>
          <div>
            <h2 className="text-4xl font-black tracking-tighter uppercase italic">Elite <span className="text-blue-500">3DCheck</span></h2>
            <p className="text-muted-foreground font-semibold">Gestão de alta performance para makers.</p>
          </div>
        </div>
      </div>

      {/* PLANOS */}
      <div className="grid md:grid-cols-2 gap-6">
        <button 
          onClick={() => { setSelectedPlan('monthly'); setShowPaymentForm(false); }}
          className={`p-8 rounded-[3rem] border-2 text-left transition-all ${selectedPlan === 'monthly' ? 'border-blue-500 bg-blue-500/5 shadow-xl shadow-blue-500/10' : 'border-border opacity-60'}`}
        >
          <Zap className={`w-8 h-8 mb-4 ${selectedPlan === 'monthly' ? 'text-blue-500' : ''}`} />
          <h4 className="font-black text-2xl uppercase italic">Mensal</h4>
          <p className="text-4xl font-black">R$ 19,90 <span className="text-sm opacity-50">/mês</span></p>
        </button>

        <button 
          onClick={() => { setSelectedPlan('annual'); setShowPaymentForm(false); }}
          className={`p-8 rounded-[3rem] border-2 text-left transition-all relative ${selectedPlan === 'annual' ? 'border-amber-500 bg-amber-500/5 shadow-xl shadow-amber-500/10' : 'border-border opacity-60'}`}
        >
          <div className="absolute top-6 right-8 bg-amber-500 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase italic">Economia</div>
          <Star className={`w-8 h-8 mb-4 ${selectedPlan === 'annual' ? 'text-amber-500' : ''}`} />
          <h4 className="font-black text-2xl uppercase italic">Anual</h4>
          <p className="text-4xl font-black">R$ 199,90 <span className="text-sm opacity-50">/ano</span></p>
        </button>
      </div>

      <Card className="border-border bg-card/40 backdrop-blur-md rounded-[3.5rem] overflow-hidden border-t-blue-500/20">
        <CardHeader className="p-12 border-b border-border/50 bg-accent/5 text-center">
          <CardTitle className="font-black text-3xl uppercase italic flex justify-center gap-3">
            <Rocket className="text-blue-500" /> Checkout Direto
          </CardTitle>
          <CardDescription>Ativando Plano {selectedPlan === 'annual' ? 'Anual' : 'Mensal'}</CardDescription>
        </CardHeader>

        <CardContent className="p-8 space-y-8">
          {!showPaymentForm ? (
            <Button 
              onClick={() => setShowPaymentForm(true)}
              className="w-full h-20 text-2xl font-black bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] shadow-2xl transition-all uppercase italic"
            >
              <CreditCard className="mr-3" /> INICIAR PAGAMENTO
            </Button>
          ) : (
            <div className="bg-white p-6 rounded-[2rem] border-2 border-blue-500/20 animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-black text-blue-500 uppercase tracking-widest">Mercado Pago Gateway</span>
                <Button variant="ghost" size="sm" onClick={() => setShowPaymentForm(false)} className="rounded-full"><X className="w-4 h-4" /></Button>
              </div>
              
              {/* O COMPONENTE BRICK APARECE AQUI */}
              <Payment
                initialization={initialization}
                customization={customization}
                onSubmit={onSubmit}
                onReady={() => console.log('Brick Pronto')}
              />
            </div>
          )}

          {/* PIX MANUAL - JOÃO GABRIEL */}
          <div className="pt-8 border-t border-border/50 space-y-6">
            <p className="text-center text-[10px] font-black uppercase text-muted-foreground tracking-widest">Alternativa: PIX para o Dev</p>
            <div className="flex items-center gap-2 bg-accent/20 p-2 rounded-2xl border border-dashed">
              <code className="flex-1 text-[9px] font-mono truncate px-4 opacity-50">{pixKey}</code>
              <Button onClick={() => { navigator.clipboard.writeText(pixKey); toast.success("Copiado!"); }} size="sm" className="bg-foreground text-background font-black rounded-xl h-10 px-6">COPIAR</Button>
            </div>

            <div className="grid gap-4">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-[2rem] cursor-pointer hover:bg-blue-500/5 transition-all group">
                <FileUp className="w-8 h-8 text-muted-foreground group-hover:text-blue-500" />
                <p className="text-[10px] font-black uppercase mt-2">{file ? file.name : "Anexar Comprovante Manual"}</p>
                <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} accept="image/*" />
              </label>

              <Button onClick={submitManualPayment} disabled={loading || !file} className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[1.2rem] font-black uppercase transition-all shadow-lg active:scale-95">
                {loading ? <Loader2 className="animate-spin" /> : <><SendHorizontal className="w-4 h-4 mr-2" /> VALIDAR ENVIO</>}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
