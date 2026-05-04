import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, ShieldCheck, Zap, 
  Star, CreditCard, Lock, 
  Fingerprint, ShieldEllipsis, Verified, Award,
  QrCode, Upload, Copy, Info
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function Billing() {
  const { profile } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);
  const [pixLoading, setPixLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const PIX_KEY = "24971502-ab9f-4837-88ff-73eea13fa78a";

  const trialInfo = useMemo(() => {
    if (!profile?.trialEndsAt) return { diffDays: 0, isExpired: true };
    const now = new Date();
    const end = new Date(profile.trialEndsAt);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { diffDays, isExpired: diffDays <= 0 };
  }, [profile]);

  const { diffDays, isExpired } = trialInfo;

  const copyPixKey = () => {
    navigator.clipboard.writeText(PIX_KEY);
    toast.success("Chave Pix copiada!");
  };

  const handleCheckout = async () => {
    if (!profile?.id || !profile?.email) {
      toast.error("Erro: Perfil de usuário não carregado.");
      return;
    }
    setLoading(true);
    const priceId = selectedPlan === 'annual' 
      ? import.meta.env.VITE_STRIPE_PRICE_ANUAL 
      : import.meta.env.VITE_STRIPE_PRICE_MENSAL;

    if (!priceId) {
      setLoading(false);
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
        window.location.assign(data.url);
      } else {
        throw new Error(data.error || 'Erro ao gerar sessão de pagamento.');
      }
    } catch (error: any) {
      toast.error("Erro ao iniciar checkout: " + (error.message || "Tente novamente."));
    } finally {
      setLoading(false);
    }
  };

  const handleManualPix = async () => {
    if (!file) {
      toast.error("Por favor, anexe o comprovante do Pix.");
      return;
    }

    setPixLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile?.id}-${Math.random()}.${fileExt}`;
      const filePath = `proofs/${fileName}`; // Pasta interna organizada

      // 1. Upload para o bucket correto: pix-proofs
      const { error: uploadError } = await supabase.storage
        .from('pix-proofs') 
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('pix-proofs')
        .getPublicUrl(filePath);

      // 2. Salva no Banco (Sem a coluna email que não existe)
      const { error: dbError } = await supabase
        .from('subscriptions_pending')
        .insert({
          user_id: profile?.id,
          plan_type: selectedPlan,
          receipt_url: publicUrl,
          status: 'pending'
        });

      if (dbError) throw dbError;

      toast.success("Comprovante enviado! O desenvolvedor ativará seu plano em instantes.");
      setFile(null);
    } catch (error: any) {
      toast.error("Erro ao enviar: " + error.message);
    } finally {
      setPixLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 px-4 md:px-0 animate-in fade-in duration-700">
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
            <p className="text-muted-foreground font-semibold">Infraestrutura de gestão certificada.</p>
          </div>
        </div>
        <div className="bg-accent/10 border border-border/50 p-4 rounded-2xl text-right">
           <p className="text-[10px] font-black uppercase opacity-50">Status da Licença</p>
           <p className="text-xl font-black italic uppercase">
             {isExpired ? "Expirado" : `${diffDays} Dias Restantes`}
           </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <button 
          onClick={() => setSelectedPlan('monthly')}
          className={`group p-8 rounded-[3rem] border-2 text-left transition-all duration-300 ${selectedPlan === 'monthly' ? 'border-blue-500 bg-blue-500/5 shadow-2xl shadow-blue-500/10' : 'border-border opacity-50 hover:opacity-100'}`}
        >
          <Zap className={`w-8 h-8 mb-4 transition-transform group-hover:scale-110 ${selectedPlan === 'monthly' ? 'text-blue-500' : ''}`} />
          <h4 className="font-black text-2xl uppercase italic tracking-tighter">Plano Pro</h4>
          <div className="text-4xl font-black mt-2">R$ 19,90 <span className="text-sm opacity-50 font-bold tracking-widest">/MÊS</span></div>
        </button>

        <button 
          onClick={() => setSelectedPlan('annual')}
          className={`group p-8 rounded-[3rem] border-2 text-left transition-all duration-300 relative ${selectedPlan === 'annual' ? 'border-amber-500 bg-amber-500/5 shadow-2xl shadow-amber-500/10' : 'border-border opacity-50 hover:opacity-100'}`}
        >
          <div className="absolute top-6 right-8 bg-amber-500 text-white text-[9px] font-black px-4 py-1 rounded-full uppercase italic tracking-widest">Melhor Valor</div>
          <Star className={`w-8 h-8 mb-4 transition-transform group-hover:rotate-12 ${selectedPlan === 'annual' ? 'text-amber-500' : ''}`} />
          <h4 className="font-black text-2xl uppercase italic tracking-tighter">Plano Pro Anual</h4>
          <div className="text-4xl font-black mt-2">R$ 199,90 <span className="text-sm opacity-50 font-bold tracking-widest">/ANO</span></div>
        </button>
      </div>

      <Card className="border-border bg-card/40 backdrop-blur-md rounded-[3.5rem] overflow-hidden border-t-blue-500/20 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)]">
        <CardHeader className="p-10 border-b border-border/50 bg-accent/5 text-center">
          <CardTitle className="font-black text-3xl uppercase italic flex justify-center gap-3">
            <Lock className="text-blue-500 w-8 h-8" /> Central de Pagamento
          </CardTitle>
          <CardDescription className="font-bold uppercase tracking-[0.2em] text-[9px] opacity-70">
            Protocolo de Criptografia Ativo • Checkout Seguro
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8 space-y-8">
          <div className="space-y-6">
            <Button 
              onClick={handleCheckout}
              disabled={loading}
              className="w-full h-24 text-xl md:text-2xl font-black bg-blue-600 hover:bg-blue-500 text-white rounded-[2.5rem] shadow-2xl transition-all uppercase italic flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 whitespace-normal leading-tight px-6 text-center"
            >
              {loading ? "PROCESSANDO..." : (
                <>
                  <CreditCard className="w-7 h-7 flex-shrink-0" /> 
                  ADQUIRIR LICENÇA {selectedPlan === 'annual' ? 'PRO ANUAL' : 'PRO'}
                </>
              )}
            </Button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50"></span></div>
              <div className="relative flex justify-center text-[10px] uppercase font-black bg-card/40 px-4 text-muted-foreground">Ou Pagamento via Pix Manual</div>
            </div>

            <div className="bg-accent/5 border border-dashed border-border rounded-[2rem] p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl"><QrCode className="w-6 h-6 text-blue-500" /></div>
                <div className="flex-1">
                  <h5 className="text-xs font-black uppercase italic">Chave Pix (Copia e Cola)</h5>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-[10px] font-mono bg-accent/20 px-2 py-1 rounded select-all break-all">{PIX_KEY}</code>
                    <Button variant="ghost" size="icon" onClick={copyPixKey} className="h-8 w-8"><Copy className="w-4 h-4" /></Button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">
                  Pagamento processado diretamente pelo desenvolvedor. Segurança garantida e ativação manual em poucos minutos.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase text-muted-foreground ml-2">Anexar Comprovante</label>
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative">
                    <input 
                      type="file" 
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                      accept="image/*,.pdf"
                    />
                    <div className="h-14 border-2 border-dashed border-border rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground bg-accent/5">
                      <Upload className="w-4 h-4" />
                      {file ? file.name : "Clique para selecionar"}
                    </div>
                  </div>
                  <Button 
                    onClick={handleManualPix}
                    disabled={pixLoading || !file}
                    className="h-14 px-8 bg-zinc-900 text-white font-black uppercase italic rounded-2xl hover:bg-zinc-800 disabled:opacity-30"
                  >
                    {pixLoading ? "ENVIANDO..." : "ENVIAR PIX"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
