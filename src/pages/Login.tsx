import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Box, Lock, Mail, ArrowRight } from 'lucide-react';

export default function Login() {
  const { signIn } = useAuth(); // Ajuste conforme a função real do seu AuthContext
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0a0a0a] transition-colors duration-300">
      
      {/* LADO ESQUERDO: Branding (Oculto no mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 overflow-hidden flex-col justify-between p-12">
        {/* Efeito de brilho no fundo (Glow) */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Logo / Título */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
            <Box className="h-8 w-8 text-white" /> {/* Substitua aqui pela tag <img src="/sua-logo.png" /> se preferir */}
          </div>
          <span className="text-3xl font-extrabold tracking-tight text-white">
            Codify<span className="text-blue-500">3D</span>
          </span>
        </div>

        {/* Slogan */}
        <div className="relative z-10 max-w-md">
          <h1 className="text-5xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
            O controle absoluto da sua <span className="text-blue-500">dimensão 3D.</span>
          </h1>
          <p className="text-lg text-slate-400 font-medium leading-relaxed">
            Gestão inteligente, cálculo automático de custos e controle de pedidos para quem leva a impressão 3D a sério.
          </p>
        </div>

        {/* Rodapé do lado esquerdo */}
        <div className="relative z-10 text-slate-500 text-sm font-medium">
          &copy; {new Date().getFullYear()} Seu App. Todos os direitos reservados.
        </div>
      </div>

      {/* LADO DIREITO: Formulário de Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative z-10">
        
        {/* Efeito sutil no fundo para mobile */}
        <div className="absolute inset-0 lg:hidden bg-gradient-to-b from-blue-950/10 to-transparent pointer-events-none" />

        <div className="w-full max-w-md space-y-8 relative">
          
          <div className="text-center lg:text-left">
            {/* Logo para Mobile */}
            <div className="flex lg:hidden justify-center items-center gap-2 mb-8">
              <div className="bg-blue-600 p-2 rounded-lg shadow-lg">
                <Box className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-foreground">
                Codify<span className="text-blue-600 dark:text-blue-500">3D</span>
              </span>
            </div>

            <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Bem-vindo de volta</h2>
            <p className="text-muted-foreground mt-2 font-medium">Insira suas credenciais para acessar o painel.</p>
          </div>

          <Card className="border-border shadow-2xl shadow-blue-900/5 dark:shadow-none bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleLogin} className="space-y-6">
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="seu@email.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-background border-border focus:ring-blue-500 focus:border-blue-500"
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Senha
                    </Label>
                    <a href="#" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                      Esqueceu a senha?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 bg-background border-border focus:ring-blue-500 focus:border-blue-500"
                      required 
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 font-bold text-base bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 group"
                >
                  {loading ? 'Entrando...' : 'Acessar Painel'}
                  {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
