import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, Mail, ArrowRight, UserPlus, Store } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!email) {
      toast.error('Por favor, digite seu e-mail para recuperar a senha.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      toast.success('E-mail de recuperação enviado!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar e-mail.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const referralCode = localStorage.getItem('referral_code');

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: storeName,
              store_name: storeName,
              referred_by: referralCode 
            }
          }
        });

        if (error) throw error;
        toast.success('Cadastro realizado! Verifique seu e-mail.');
        setIsSignUp(false);
      } else {
        // --- LÓGICA DE LOGIN CORRIGIDA ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Verificação de segurança: checar se a sessão foi criada
        if (data.session) {
          toast.success('Login realizado com sucesso!');
          window.location.href = '/app';
        }
      }
    } catch (error: any) {
      console.error('Erro na autenticação:', error);
      // Mensagem mais amigável para evitar exposição de detalhes técnicos
      toast.error('Falha na autenticação. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0a0a0c] selection:bg-blue-500/30">
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#050505] overflow-hidden flex-col justify-between p-12 border-r border-white/5">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-900/15 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="h-28 flex items-center justify-center">
            <img src="/logo.jpg.png" alt="3dCheck Logo" className="h-full w-auto object-contain drop-shadow-[0_0_20px_rgba(37,99,235,0.6)]" />
          </div>
          <span className="text-5xl font-extrabold tracking-tight text-white">
            <span className="text-blue-500">3d</span>Check
          </span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-5xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
            O controle absoluto da sua <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">dimensão 3D.</span>
          </h1>
          <p className="text-lg text-slate-400 font-medium leading-relaxed">
            Gestão inteligente, cálculo automático de custos e controle de pedidos.
          </p>
        </div>

        <div className="relative z-10 text-slate-600 text-sm font-medium tracking-wide">
          &copy; {new Date().getFullYear()} 3dCheck. Todos os direitos reservados.
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="absolute inset-0 lg:hidden bg-gradient-to-br from-[#0a0a0c] via-[#050505] to-[#0a192f] pointer-events-none" />
        
        <div className="w-full max-w-md space-y-8 relative z-20">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              {isSignUp ? 'Crie sua conta' : 'Bem-vindo de volta'}
            </h2>
          </div>

          <Card className="border-white/10 shadow-2xl bg-white/[0.02] backdrop-blur-xl">
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleAuth} className="space-y-6">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="storeName" className="text-xs font-bold uppercase tracking-wider text-slate-400">Nome da Loja</Label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                      <Input id="storeName" type="text" placeholder="Ex: Minha Loja 3D" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="pl-10 h-12 bg-[#050505] border-white/10 text-white" required={isSignUp} />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-400">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12 bg-[#050505] border-white/10 text-white" required />
                  </div>
                </div>
                <div className="space-y-2">
                   <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-400">Senha</Label>
                    {!isSignUp && <button type="button" onClick={handleResetPassword} className="text-xs font-bold text-blue-500 hover:text-blue-400">Esqueceu a senha?</button>}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-12 bg-[#050505] border-white/10 text-white" required />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white">
                  {loading ? 'Processando...' : (isSignUp ? 'Criar Minha Loja' : 'Acessar Painel')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
