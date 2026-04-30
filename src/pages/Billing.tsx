import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
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

  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Assinatura</h2>
        <p className="text-slate-500 font-medium mt-1">Gerencie seu plano e pagamentos.</p>
      </div>

      {(profile.status === 'blocked' || profile.status === 'trial') && (
        <Card className="border-red-200 bg-red-50 rounded-xl shadow-none">
          <CardContent className="p-6 flex items-start gap-4 text-red-800">
            <AlertTriangle className="h-6 w-6 text-red-600 mt-1" />
            <div>
              <h3 className="font-extrabold text-lg">Plano Inativo</h3>
              <p className="font-medium opacity-90 mt-1">
                Seu trial expirou ou sua conta está bloqueada. Para continuar utilizando a plataforma, realize o pagamento.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {submitted ? (
        <Card className="border-green-200 border-2 rounded-xl shadow-none">
          <CardContent className="p-12 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900">Comprovante em análise</h3>
            <p className="text-slate-500 font-medium max-w-sm mx-auto">
              Recebemos seu comprovante e nossa equipe irá verificar o pagamento em breve. Aguarde a aprovação para que seu acesso seja liberado.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-xl border-slate-200 shadow-none overflow-hidden">
          <CardHeader className="p-6">
            <CardTitle className="font-extrabold text-slate-900">Pagamento via PIX</CardTitle>
            <CardDescription className="font-medium text-slate-500 mt-1">
              Para ativar sua assinatura de 30 dias, realize o PIX abaixo e envie o comprovante.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-6 pb-6">
            <div className="p-8 bg-slate-50 rounded-xl text-center space-y-2 relative border border-slate-200">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Chave PIX (Telefone)</p>
              <p className="text-4xl font-extrabold tracking-tight text-slate-900 my-4">15022408740</p>
              <p className="text-sm font-medium text-slate-500">Dúvidas? Entre em contato: <strong className="text-slate-800">21995394315</strong></p>
            </div>

            <form onSubmit={handleFileUpload} className="space-y-6 pt-4">
              <div className="space-y-3">
                <Label className="font-bold text-slate-700 text-xs uppercase tracking-wider">Enviar Comprovante (Imagem ou PDF)</Label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 hover:bg-slate-50 hover:border-slate-300 transition-colors text-center cursor-pointer relative bg-white group">
                  <Input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    accept="image/*,.pdf"
                    required
                  />
                  <div className="flex justify-center items-center h-12 w-12 rounded-full bg-slate-100 mx-auto mb-4 group-hover:bg-blue-50 transition-colors">
                    <UploadCloud className="h-6 w-6 text-slate-500 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <p className="font-extrabold text-[15px] text-slate-900">
                    {file ? file.name : 'Clique para selecionar ou arraste o arquivo'}
                  </p>
                  <p className="text-[13px] font-medium text-slate-500 mt-1">PNG, JPG ou PDF</p>
                </div>
              </div>
              <Button type="submit" className="w-full font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-md py-6 text-[15px] shadow-sm" disabled={!file || loading}>
                {loading ? 'Enviando...' : 'Enviar Comprovante de Pagamento'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
