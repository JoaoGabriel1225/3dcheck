import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export default function Login() {
  const { signIn } = useAuth();
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
    // Fundo principal: Escuro e tecnológico por padrão, com ajustes para mobile
    <div className="min-h-screen flex bg-[#0a0a0c] selection:bg-blue-500/30">
      
      {/* LADO ESQUERDO: Branding (Oculto no mobile, visível do lg para cima) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#050505] overflow-hidden flex-col justify-between p-12 border-r border-white/5">
        {/* Efeitos de luz (Glow) tecnológicos */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-900/15 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Logo / Título */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 flex items-center justify-center">
            {/* TAG DA IMAGEM AQUI: Basta colocar sua logo.png na pasta public */}
            <img src="/logo.jpg.png" alt="3dCheck Logo" className="h-full w-auto object-contain drop-shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
          </div>
          <span className="text-3xl font-extrabold tracking-tight text-white">
            <span className="text-blue-500">3d</span>Check
          </span>
        </div>

        {/* Slogan */}
        <div className="relative z-10 max-w-md">
          <h1 className="text-5xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
            O controle absoluto da sua <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">dimensão 3D.</span>
          </h1>
          <p className="text-lg text-slate-400 font-medium leading-relaxed">
            Gestão inteligente, cálculo automático de custos e controle de pedidos para quem leva a impressão 3D a sério.
          </p>
        </div>

        {/* Rodapé do lado esquerdo */}
        <div className="relative z-10 text-slate-600 text-sm font-medium tracking-wide">
          &copy; {new Date().getFullYear()} 3dCheck. Todos os direitos reservados.
        </div>
      </div>

      {/* LADO DIREITO: Formulário de Login (Mobile e Desktop) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        
        {/* Background gradient para Mobile (ajuda a dar o tom azul/preto sem a imagem lateral) */}
        <div className="absolute inset-0 lg:hidden bg-gradient-to-br from-[#0a0a0c] via-[#050505] to-[#0a192f] pointer-events-none" />
        {/* Efeito de luz sutil no mobile */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] lg:hidden bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md space-y-8 relative z-20">
          
          <div className="text-center lg:text-left">
            {/* Logo para Mobile */}
            <div className="flex lg:hidden justify-center items-center gap-3 mb-8">
              <div className="h-10 flex items-center justify-center">
                <img src="/logo.png" alt="3dCheck Logo" className="h-full w-auto object-contain drop-shadow-[0_0_10px_rgba(37,99,235,0.4)]" />
              </div>
              <span className="text-3xl font-extrabold tracking-tight text-white">
                <span className="text-blue-500">3d</span>Check
              </span>
            </div>

            <h2 className="text-3xl font-extrabold text-white tracking-tight">Bem-vindo de volta</h2>
            <p className="text-slate-400 mt-2 font-medium">Insira suas credenciais para acessar o painel.</p>
          </div>

          {/* Card com efeito Glassmorphism (Fosco) para destacar no fundo escuro */}
          <Card className="border-white/10 shadow-2xl bg-white/[0.02] backdrop-blur-xl">
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleLogin} className="space-y-6">
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="seu@email.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-[#050505] border-white/10 text-white placeholder:text-slate-600 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Senha
                    </Label>
                    <a href="#" className="text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors">
                      Esqueceu a senha?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 bg-[#050505] border-white/10 text-white placeholder:text-slate-600 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required 
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 font-bold text-base bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] flex items-center justify-center gap-2 group border-0"
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
