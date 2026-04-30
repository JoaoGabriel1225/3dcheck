import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, UploadCloud, CheckCircle2, ShieldCheck, Copy, FileText, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function Billing() {
  const { profile } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const trialInfo = useMemo(() => {
    if (!profile?.trialEndsAt) {
      return {
        diffDays: 0,
        isExpired: true,
      };
    }
    const now = new Date();
    const end = new Date(profile.trialEndsAt);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      diffDays,
      isExpired: diffDays <= 0,
    };
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
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
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
          <CardContent className="p-6 sm:p-8 flex items-start gap-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-500" />
            </div>
            <div>
              <h3 className="font-black text-lg text-red-800 dark:text-red-400 tracking-tight">Período de Testes Expirado</h3>
              <p className="text-sm text-red-600/80 dark:text-red-400/80 font-medium mt-1 leading-relaxed">
                Seu acesso foi bloqueado. Para continuar gerenciando seus pedidos e custos com o 3dCheck, por favor, realize a assinatura do plano.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 shadow-none">
          <CardContent className="p-6 sm:p-8 flex items-center justify-between">
            <div>
              <h3 className="font-black text-lg text-emerald-800 dark:text-emerald-400 tracking-tight">Plano Ativo (Trial)</h3>
              <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80 font-medium mt-1">
                Aproveite todos os recursos da plataforma gratuitamente.
              </p>
            </div>
            <div className="text-center bg-white dark:bg-black/20 px-4 py-2 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
              <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-500 leading-none">{diffDays}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-800/50 dark:text-emerald-400/50">Dias Restantes</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ÁREA DE PAGAMENTO */}
      {submitted ? (
        <Card className="border-border bg-card shadow-xl overflow-hidden rounded-3xl">
          <div className="h-2 bg-emerald-500 w-full" />
          <CardContent className="p-12 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="font-black text-2xl text-foreground tracking-tight mb-2">Tudo Certo!</h3>
            <p className="text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed">
              Recebemos seu comprovante. Nossa equipe fará a validação em breve e seu acesso integral será liberado.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border bg-card/50 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="p-8 border-b border-border/50 bg-accent/20 text-center">
            <CardTitle className="font-black text-2xl tracking-tight">Ativar Assinatura via PIX</CardTitle>
            <CardDescription className="font-medium text-sm mt-2">Pagamento rápido e seguro direto na conta oficial.</CardDescription>
          </CardHeader>

          <CardContent className="p-8 space-y-8">
            
            {/* BOX DA CHAVE PIX */}
            <div className="bg-background rounded-2xl border border-border p-6 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Chave PIX (Telefone)</span>
                  <div className="text-3xl font-black tracking-tight text-foreground font-mono">15022408740</div>
                </div>
                <Button 
                  onClick={handleCopyPix}
                  className={`h-12 px-6 font-bold rounded-xl shrink-0 transition-all ${
                    copied 
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                  } shadow-lg`}
                >
                  {copied ? <Check className="w-5 h-5 mr-2" /> : <Copy className="w-5 h-5 mr-2" />}
                  {copied ? 'Copiado!' : 'Copiar Chave'}
                </Button>
              </div>
            </div>

            {/* ÁREA DE UPLOAD */}
            <form onSubmit={handleFileUpload} className="space-y-6 bg-accent/30 p-6 rounded-2xl border border-border/50">
              <div className="space-y-3">
                <Label className="text-[11px] font-black uppercase tracking-widest text-foreground">Enviar Comprovante de Pagamento</Label>
                
                <div className={`
                  relative border-2 border-dashed rounded-2xl p-8 text-center transition-all
                  ${file ? 'border-blue-500 bg-blue-500/5' : 'border-border bg-background hover:border-blue-500/50 hover:bg-accent/50'}
                `}>
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    required
                  />
                  
                  <div className="flex flex-col items-center justify-center gap-3 pointer-events-none">
                    {file ? (
                      <>
                        <div className="p-3 bg-blue-500/10 rounded-full text-blue-500">
                          <FileText className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground">{file.name}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Pronto para envio</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-3 bg-muted rounded-full text-muted-foreground">
                          <UploadCloud className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground">Clique ou arraste o arquivo aqui</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Formatos aceitos: JPG, PNG ou PDF</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Button 
                disabled={!file || loading} 
                className="w-full h-14 text-lg font-black bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white hover:opacity-90 rounded-xl transition-all"
              >
                {loading ? 'Processando envio...' : 'Enviar Comprovante e Ativar Plano'}
              </Button>
            </form>

          </CardContent>
        </Card>
      )}
    </div>
  );
}
