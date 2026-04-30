import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, UploadCloud, CheckCircle2, ShieldCheck, Copy, FileText, Check, Zap, Star } from 'lucide-react';
import { toast } from 'sonner';

export default function Billing() {
  const { profile } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');

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
    navigator.clipboard.writeText('15022408740');
    setCopied(true);
    toast.success('Chave PIX copiada!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !profile) return;
    setLoading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('pix-proofs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('pix-proofs')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('payment_requests')
        .insert({
          user_id: profile.id,
          pix_proof_url: data.publicUrl,
          plan_type: selectedPlan // Registrando qual plano ele escolheu
        });

      if (dbError) throw dbError;

      setSubmitted(true);
      toast.success('Comprovante enviado com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao enviar comprovante');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-500/10 rounded-xl">
          <ShieldCheck className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tight text-foreground">Assinatura</h2>
          <p className="text-muted-foreground font-medium">Gerencie seu plano e acessos da plataforma.</p>
        </div>
      </div>

      {/* STATUS DO PLANO */}
      {isExpired ? (
        <Card className="border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 shadow-none">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-500" />
            </div>
            <div>
              <h3 className="font-black text-lg text-red-800 dark:text-red-400 tracking-tight">Período de Testes Expirado</h3>
              <p className="text-sm text-red-600/80 dark:text-red-400/80 font-medium mt-1">
                Seu trial expirou. Selecione um plano abaixo para liberar seu acesso.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 shadow-none">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h3 className="font-black text-lg text-emerald-800 dark:text-emerald-400 tracking-tight">Plano Ativo (Trial)</h3>
              <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80 font-medium mt-1">
                Você tem {diffDays} dias restantes no seu período gratuito.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SELEÇÃO DE PLANOS */}
      {!submitted && (
        <div className="grid md:grid-cols-2 gap-4">
          <button 
            onClick={() => setSelectedPlan('monthly')}
            className={`p-6 rounded-3xl border-2 text-left transition-all ${selectedPlan === 'monthly' ? 'border-blue-500 bg-blue-500/5 ring-4 ring-blue-500/10' : 'border-border bg-card/50 hover:border-blue-500/30'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg ${selectedPlan === 'monthly' ? 'bg-blue-500 text-white' : 'bg-accent text-muted-foreground'}`}>
                <Zap className="w-5 h-5" />
              </div>
              {selectedPlan === 'monthly' && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
            </div>
            <h4 className="font-black text-lg tracking-tight">Mensal</h4>
            <p className="text-muted-foreground text-xs font-medium mb-4 tracking-wide">Para quem quer flexibilidade</p>
            <div className="text-2xl font-black tracking-tighter">R$ 29,90 <span className="text-sm font-medium text-muted-foreground">/mês</span></div>
          </button>

          <button 
            onClick={() => setSelectedPlan('annual')}
            className={`p-6 rounded-3xl border-2 text-left transition-all relative overflow-hidden ${selectedPlan === 'annual' ? 'border-emerald-500 bg-emerald-500/5 ring-4 ring-emerald-500/10' : 'border-border bg-card/50 hover:border-emerald-500/30'}`}
          >
            <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest">
              Melhor Valor
            </div>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg ${selectedPlan === 'annual' ? 'bg-emerald-500 text-white' : 'bg-accent text-muted-foreground'}`}>
                <Star className="w-5 h-5" />
              </div>
              {selectedPlan === 'annual' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            </div>
            <h4 className="font-black text-lg tracking-tight">Anual</h4>
            <p className="text-muted-foreground text-xs font-medium mb-4 tracking-wide text-emerald-600 dark:text-emerald-500">Economize R$ 60,00 por ano</p>
            <div className="text-2xl font-black tracking-tighter">R$ 299,00 <span className="text-sm font-medium text-muted-foreground">/ano</span></div>
          </button>
        </div>
      )}

      {/* ÁREA DE PAGAMENTO DINÂMICA */}
      {submitted ? (
        <Card className="border-border bg-card shadow-xl overflow-hidden rounded-3xl animate-in zoom-in duration-300">
          <CardContent className="p-12 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="font-black text-2xl text-foreground tracking-tight mb-2">Comprovante em análise</h3>
            <p className="text-muted-foreground font-medium max-w-sm mx-auto">
              Recebemos seu comprovante do plano <strong>{selectedPlan === 'monthly' ? 'Mensal' : 'Anual'}</strong>. Seu acesso será liberado em instantes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border bg-card/50 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="p-8 border-b border-border/50 bg-accent/20">
            <CardTitle className="font-black text-xl tracking-tight">Pagamento via PIX</CardTitle>
            <CardDescription className="font-medium text-sm">Valor selecionado: <span className="text-foreground font-bold">{selectedPlan === 'monthly' ? 'R$ 29,90' : 'R$ 299,00'}</span></CardDescription>
          </CardHeader>

          <CardContent className="p-8 space-y-8">
            <div className="bg-background rounded-2xl border border-border p-6 text-center space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Chave PIX (Telefone)</span>
              <div className="text-3xl font-black tracking-tight text-foreground font-mono">15022408740</div>
              <Button 
                onClick={handleCopyPix}
                variant="outline"
                className={`h-10 mt-2 rounded-xl transition-all ${copied ? 'border-emerald-500 text-emerald-500' : ''}`}
              >
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copiado!' : 'Copiar Chave'}
              </Button>
            </div>

            <form onSubmit={handleFileUpload} className="space-y-6">
              <div className="space-y-3">
                <Label className="text-[11px] font-black uppercase tracking-widest text-foreground">Anexar Comprovante</Label>
                <div className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${file ? 'border-blue-500 bg-blue-500/5' : 'border-border bg-background hover:border-blue-500/50'}`}>
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    required
                  />
                  <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                    {file ? (
                      <div className="flex items-center gap-2 text-blue-500 font-bold text-sm">
                        <FileText className="w-5 h-5" /> {file.name}
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-8 h-8 text-muted-foreground/50" />
                        <p className="font-bold text-sm text-foreground">Clique para selecionar o arquivo</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Button 
                disabled={!file || loading} 
                className="w-full h-14 text-lg font-black bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xl shadow-blue-500/20 transition-all"
              >
                {loading ? 'Enviando...' : `Ativar Plano ${selectedPlan === 'monthly' ? 'Mensal' : 'Anual'}`}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
