import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

  // 🔥 LÓGICA 100% SEGURA DO TRIAL (CORRIGIDO)
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
      toast.error('Erro ao enviar comprovante', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      <div>
        <h2 className="text-2xl font-bold">Assinatura</h2>
        <p className="text-slate-500">Gerencie seu plano e pagamentos.</p>
      </div>

      {/* 🚨 BLOQUEIO REAL (SÓ QUANDO EXPIRADO DE VERDADE) */}
      {isExpired ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 flex gap-4 text-red-800">
            <AlertTriangle className="h-6 w-6 text-red-600 mt-1" />
            <div>
              <h3 className="font-bold text-lg">Plano Inativo</h3>
              <p>
                Seu trial expirou. Para continuar utilizando a plataforma, realize o pagamento.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-green-800">
            <h3 className="font-bold text-lg">Plano Ativo</h3>
            <p>Você tem {diffDays} dias restantes no seu período gratuito.</p>
          </CardContent>
        </Card>
      )}

      {/* 💳 PAGAMENTO */}
      {submitted ? (
        <Card>
          <CardContent className="p-10 text-center">
            <CheckCircle2 className="mx-auto text-green-600" />
            <h3 className="font-bold text-xl mt-4">Comprovante em análise</h3>
            <p className="text-slate-500">Aguarde a aprovação do pagamento.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Pagamento via PIX</CardTitle>
            <CardDescription>Envie o comprovante para ativar sua conta.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">

            <div className="bg-slate-50 p-6 rounded-xl text-center">
              <p className="text-sm">Chave PIX</p>
              <p className="text-2xl font-bold">15022408740</p>
            </div>

            <form onSubmit={handleFileUpload} className="space-y-4">

              <Label>Comprovante</Label>

              <div className="border-dashed border p-6 text-center relative">
                <Input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                />

                <UploadCloud className="mx-auto mb-2" />

                <p>{file ? file.name : 'Clique para enviar arquivo'}</p>
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
