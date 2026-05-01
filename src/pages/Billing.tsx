import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, CheckCircle2, ShieldCheck, Zap, 
  Star, Rocket, Loader2, Copy, CreditCard, Sparkles,
  Image as ImageIcon, SendHorizontal, FileUp
} from 'lucide-react';
import { toast } from 'sonner';

export default function Billing() {
  const { profile } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  // SUA CHAVE PIX ATUALIZADA
  const pixKey = "24971502-ab9f-4837-88ff-73eea13fa78a";

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

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    toast.success("Chave PIX copiada! Agora é só pagar no seu banco.");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      toast.info(`Arquivo ${e.target.files[0].name} selecionado.`);
    }
  };

  // FUNÇÃO PARA ATIVAÇÃO MANUAL (PIX COM COMPROVANTE)
  const submitManualPayment = async () => {
    if (!file) {
      toast.error("Por favor, anexe o comprovante do Pix para validação.");
      return;
    }

    setLoading(true);
    try {
      // 1. Upload para o Storage (Bucket: comprovantes)
      const fileExt = file.name.split('.').pop();
      const fileName = `pix_${profile?.id}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('comprovantes')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Registro na tabela subscriptions_pending
      const { error: dbError } = await supabase
        .from('subscriptions_pending')
        .insert([{ 
          user_id: profile?.id, 
          user_email: profile?.email,
          receipt_url: fileName,
          status: 'pending'
        }]);

      if (dbError) throw dbError;

      toast.success("Comprovante enviado com sucesso! João Gabriel (Dev) validará seu acesso em breve.");
      setFile(null);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao processar envio. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  // CHECKOUT AUTOMÁTICO (CARTÃO/MERCADO PAGO)
  const handleCheckout = async () => {
    if (selectedPlan !== 'monthly') {
      toast.info("O plano anual estará disponível em breve! Use o Mensal por enquanto.");
      return;
    }
    if (!profile?.email) {
      toast.error("E-mail não encontrado. Tente relogar.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id, email: profile.email }),
      });
      const data = await response.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error('Falha ao gerar checkout');
      }
    } catch (err) {
      toast.error('Erro ao conectar com o gateway de pagamento.');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20 px-4 md:px-0">
      
      {/* HEADER PREMIUM */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-inner">
            <ShieldCheck className="w-10 h-10 text-blue-600" />
          </div>
          <div>
            <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase italic">
              Elite <span className="text-blue-500">3DCheck</span>
            </h2>
            <p className="text-muted-foreground font-semibold tracking-tight">
              Domine sua operação com o ecossistema mais avançado do mercado.
            </p>
          </div>
        </div>
      </div>

      {/* STATUS DO TRIAL */}
      {isExpired ? (
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-[2rem] flex items-center gap-4 animate-pulse">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <div>
            <h3 className="font-black text-red-500 uppercase text-sm tracking-widest uppercase">Sua produtividade está em pausa</h3>
            <p className="text-xs font-bold text-red-500/80">O período de demonstração expirou. Reative suas ferramentas de gestão agora.</p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-[2rem] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Sparkles className="h-6 w-6 text-emerald-500" />
            <div>
              <h3 className="font-black text-emerald-600 dark:text-emerald-400 uppercase text-xs tracking-widest">Acesso Antecipado Ativo</h3>
              <p className="text-xs font-bold text-muted-foreground">Você possui <span className="text-emerald-500">{diffDays} dias</span> de autonomia plena.</p>
            </div>
          </div>
        </div>
      )}

      {/* SELEÇÃO DE PLANOS */}
      <div className="grid md:grid-cols-2 gap-6">
        <button 
          onClick={() => setSelectedPlan('monthly')}
          className={`group p-8 rounded-[3rem] border-2 text-left transition-all duration-300 relative ${selectedPlan === 'monthly' ? 'border-blue-500 bg-blue-500/5 shadow-2xl shadow-blue-500/10' : 'border-border bg-card/50 opacity-70 hover:opacity-100 hover:border-blue-500/30'}`}
        >
          <div className="flex justify-between items-center mb-6">
            <Zap className={`w-8 h-8 ${selectedPlan === 'monthly' ? 'text-blue-500' : 'text-muted-foreground'}`} />
            {selectedPlan === 'monthly' && <CheckCircle2 className="w-6 h-6 text-blue-500" />}
          </div>
          <h4 className="font-black text-2xl tracking-tighter uppercase italic">Assinatura Mensal</h4>
          <p className="text-muted-foreground text-[10px] font-black mb-6 tracking-[0.2em] uppercase">Escalabilidade & Flexibilidade</p>
          <div className="text-4xl font-black tracking-tighter flex items-baseline gap-1">
            R$ 19,90 <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest ml-1">/mês</span>
          </div>
        </button>

        <button 
          onClick={() => setSelectedPlan('annual')}
          className={`group p-8 rounded-[3rem] border-2 text-left transition-all duration-300 relative ${selectedPlan === 'annual' ? 'border-amber-500 bg-amber-500/5 shadow-2xl shadow-amber-500/10' : 'border-border bg-card/50 opacity-70 hover:opacity-100 hover:border-amber-500/30'}`}
        >
          <div className="absolute top-6 right-8 bg-amber-500 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest italic shadow-lg">
            Visão de Longo Prazo
          </div>
          <div className="flex justify-between items-center mb-6">
            <Star className={`w-8 h-8 ${selectedPlan === 'annual' ? 'text-amber-500' : 'text-muted-foreground'}`} />
            {selectedPlan === 'annual' && <CheckCircle2 className="w-6 h-6 text-amber-500" />}
          </div>
          <h4 className="font-black text-2xl tracking-tighter uppercase italic">Assinatura Anual</h4>
          <p className="text-amber-600 dark:text-amber-400 text-[10px] font-black mb-6 tracking-[0.2em] uppercase italic">Máximo Desconto</p>
          <div className="text-4xl font-black tracking-tighter flex items-baseline gap-1">
            R$ 199,90 <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest ml-1">/ano</span>
          </div>
        </button>
      </div>

      {/* CHECKOUT SECTION */}
      <Card className="border-border bg-card/40 backdrop-blur-md shadow-3xl rounded-[3.5rem] overflow-hidden border-t-blue-500/20">
        <CardHeader className="p-12 border-b border-border/50 bg-accent/5">
          <CardTitle className="font-black text-3xl tracking-tighter flex items-center gap-3 uppercase italic">
            <Rocket className="w-8 h-8 text-blue-500" />
            Configuração de Acesso
          </CardTitle>
          <CardDescription className="text-base font-medium">
            Ative o <strong className="text-blue-500 uppercase">{selectedPlan === 'monthly' ? 'Plano Pro Mensal' : 'Plano Pro Anual'}</strong>. 
            Suporte direto com o desenvolvedor.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-12 space-y-10">
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-10">
            {[
              "Marketplace Hub com descontos reais",
              "Calculadora de Custos de Alta Precisão",
              "Vitrine Digital Profissional (Link Personalizado)",
              "Ecossistema de Gestão de Pedidos & CRM",
              "Mensageria de Automação via E-mail",
              "Métricas Avançadas de Produção"
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-sm font-bold text-foreground/90">
                <div className="bg-blue-500/10 p-1 rounded-md">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                </div>
                {feature}
              </li>
            ))}
          </ul>

          <div className="space-y-8">
            {/* BOTÃO PARA CARTÃO (MERCADO PAGO) */}
            <Button 
              onClick={handleCheckout}
              disabled={loading}
              className="w-full h-20 text-2xl font-black bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] shadow-2xl shadow-blue-600/30 transition-all uppercase tracking-tighter italic flex items-center justify-center gap-3 active:scale-95"
            >
              {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <><CreditCard className="w-6 h-6" /> PAGAR COM CARTÃO</>}
            </Button>
            
            {/* ÁREA DE PIX MANUAL (JOÃO GABRIEL) */}
            <div className="pt-8 border-t border-border/50 space-y-6">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-blue-500">
                  <Zap className="w-4 h-4 fill-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Ativação Manual via PIX</span>
                </div>
                <p className="text-[10px] text-muted-foreground font-bold">Pague ao desenvolvedor João Gabriel e anexe o comprovante abaixo.</p>
              </div>

              <div className="flex items-center gap-2 bg-accent/20 p-2 rounded-2xl border border-dashed border-border/60">
                 <code className="flex-1 text-[9px] font-mono font-bold truncate px-4 opacity-50 italic">{pixKey}</code>
                 <Button onClick={handleCopyPix} size="sm" className="bg-foreground text-background font-black rounded-xl px-6 h-10 hover:opacity-90">
                    <Copy className="w-4 h-4 mr-2" /> COPIAR
                 </Button>
              </div>

              {/* UPLOAD DO COMPROVANTE */}
              <div className="grid gap-4">
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-[2.5rem] cursor-pointer hover:bg-blue-500/5 hover:border-blue-500/30 transition-all group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileUp className="w-10 h-10 text-muted-foreground mb-3 group-hover:text-blue-500 transition-colors" />
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                      {file ? file.name : "ANEXAR COMPROVANTE DO PIX"}
                    </p>
                  </div>
                  <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                </label>

                <Button 
                  onClick={submitManualPayment}
                  disabled={loading || !file}
                  className="w-full h-16 text-lg font-black bg-emerald-600 hover:bg-emerald-500 text-white rounded-[1.5rem] shadow-xl transition-all uppercase flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <><SendHorizontal className="w-5 h-5" /> VALIDAR PAGAMENTO</>}
                </Button>
              </div>
            </div>
          </div>
          
          <p className="text-center text-[9px] text-muted-foreground font-black uppercase tracking-[0.3em] italic opacity-50">
            Suporte VIP Direto • 3DCheck Security Integration
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
