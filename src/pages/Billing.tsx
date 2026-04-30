import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, UploadCloud, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Billing() {
  const { profile } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!profile) return null;

  // 🚀 LÓGICA ÚNICA DO TRIAL (FONTE DA VERDADE)
  const now = new Date();

  const end = profile?.trial_end_date
    ? new Date(profile.trial_end_date)
    : null;

  const diffTime = end ? end.getTime() - now.getTime() : 0;

  const diffDays = end
    ? Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    : 0;

  const isExpired = diffDays <= 0;

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

      const { data: publicUrlData } = supabase.storage
        .from('pix-proofs')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('payment_requests')
        .insert({
          user_id: profile.id,
          pix_proof_url: publicUrlData.publicUrl,
        });

      if (dbError) throw dbError;

      setSubmitted(true);
      toast.success('Comprovante enviado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao enviar comprovante', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      <div>
        <h2 className="text-2xl font-extrabold">Assinatura</h2>
        <p className="text-slate-500">Gerencie seu plano e pagamentos.</p>
      </div>

      {/* 🚨 BLOQUEIO BASEADO APENAS EM DATA */}
      {isExpired && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 flex items-start gap-4 text-red-800">
            <AlertTriangle className="h-6 w-6 text-red-600 mt-1" />
            <div>
              <h3 className="font-bold text-lg">Plano Inativo</h3>
              <p>
                Seu trial expirou. Para continuar utilizando a plataforma, realize o pagamento.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 🟢 PLANO ATIVO */}
      {!isExpired && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-green-800">
            <h3 className="font-bold text-lg">Plano Ativo</h3>
            <p>Você tem {diffDays} dias restantes no seu plano gratuito.</p>
          </CardContent>
        </Card>
      )}

      {/* 💳 PIX */}
      {submitted ? (
        <Card className="border-green-200">
          <CardContent className="p-12 text-center space-y-4">
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
            <h3 className="text-xl font-bold">Comprovante em análise</h3>
            <p className="text-slate-500">
              Vamos verificar seu pagamento em breve.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Pagamento via PIX</CardTitle>
            <CardDescription>
              Envie o comprovante para liberar sua conta.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">

            <div className="p-6 bg-slate-50 rounded-xl text-center">
              <p className="text-sm">Chave PIX</p>
              <p className="text-2xl font-bold">15022408740</p>
            </div>

            <form onSubmit={handleFileUpload} className="space-y-4">

              <Label>Enviar comprovante</Label>

              <div className="border-dashed border p-6 text-center relative">
                <Input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                />

                <UploadCloud className="mx-auto mb-2" />

                <p>
                  {file ? file.name : 'Clique ou arraste o arquivo'}
                </p>
              </div>

              <Button disabled={!file || loading} className="w-full">
                {loading ? 'Enviando...' : 'Enviar comprovante'}
              </Button>

            </form>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
