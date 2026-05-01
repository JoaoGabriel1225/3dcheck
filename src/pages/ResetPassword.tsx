import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      toast.success('Senha atualizada com sucesso!');
      setTimeout(() => window.location.href = '/', 2000);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] p-6">
      <Card className="w-full max-w-md border-white/10 bg-white/[0.02] backdrop-blur-xl">
        <CardContent className="p-8 space-y-6">
          <h2 className="text-2xl font-black text-white">Nova Senha</h2>
          <p className="text-slate-400 text-sm">Digite sua nova senha de acesso abaixo.</p>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <Input 
              type="password" 
              placeholder="Digite a nova senha" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-[#050505] border-white/10 text-white h-12"
              required
            />
            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 font-bold h-12">
              {loading ? 'Atualizando...' : 'Redefinir Senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
