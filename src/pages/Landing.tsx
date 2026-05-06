import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, 
  Store, 
  CheckCircle2, 
  Timer, 
  ArrowRight, 
  Zap, 
  ShieldCheck,
  PackageSearch,
  DownloadCloud,
  Tags,
  LayoutDashboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Variantes de Animação Fluidas
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
  }
};

const hoverScale = {
  hover: { scale: 1.02, y: -5, transition: { duration: 0.3, ease: "easeOut" } }
};

export default function Landing() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState({ days: 7, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timerKey = '3dcheck_exclusive_maker_offer';
    let endTime = localStorage.getItem(timerKey);

    if (!endTime) {
      const newEndTime = new Date().getTime() + 7 * 24 * 60 * 60 * 1000;
      localStorage.setItem(timerKey, newEndTime.toString());
      endTime = newEndTime.toString();
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = parseInt(endTime!) - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 overflow-x-hidden selection:bg-blue-500/30 relative">
      
      {/* LUZES NEON FLUTUANTES (BACKGROUND) */}
      <motion.div 
        animate={{ 
          x: [0, 150, -100, 0], 
          y: [0, -100, 100, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/20 blur-[150px] rounded-full pointer-events-none mix-blend-screen" 
      />
      <motion.div 
        animate={{ 
          x: [0, -150, 100, 0], 
          y: [0, 100, -100, 0],
          scale: [1, 1.5, 1]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen" 
      />

      {/* HEADER PREMIUM */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 w-full bg-[#050505]/70 backdrop-blur-xl border-b border-zinc-900 z-50 h-20 flex items-center"
      >
        <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-2.5 rounded-xl shadow-lg shadow-blue-900/50">
              <PackageSearch className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight uppercase text-zinc-100">3D<span className="text-blue-500">Check</span></span>
          </div>
          <Button 
            onClick={() => navigate('/login')} 
            variant="ghost" 
            className="font-bold text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-xl px-6 h-11 transition-all"
          >
            Acessar Minha Oficina
          </Button>
        </div>
      </motion.header>

      {/* HERO SECTION */}
      <motion.section 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="pt-48 pb-20 px-6 relative z-10"
      >
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-8">
          <motion.div 
            variants={fadeInUp}
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-900/20 backdrop-blur-md"
          >
            <Zap className="w-4 h-4 text-blue-500" /> A Elite Maker não usa planilhas.
          </motion.div>
          
          <motion.h1 
            variants={fadeInUp}
            className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] text-zinc-100"
          >
            O controle absoluto da sua <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
              dimensão 3D.
            </span>
          </motion.h1 >
          
          <motion.p 
            variants={fadeInUp}
            className="text-lg md:text-xl text-zinc-400 font-medium max-w-2xl leading-relaxed"
          >
            Gestão inteligente, cálculo automático de custos e controle de pedidos para quem leva a impressão 3D a sério. Assuma o comando da sua fazenda.
          </motion.p>
          
          <motion.div 
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center gap-4 pt-6 w-full sm:w-auto"
          >
            <Button 
              onClick={() => navigate('/login')} 
              className="h-14 px-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto"
            >
              Começar Agora <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mt-2 sm:mt-0">
               Teste gratuito de 7 dias liberado.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* OS 3 PILARES (NOVA SEÇÃO) */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
        className="py-24 px-6 relative z-10"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-100">Um ecossistema feito para <span className="text-blue-500">lucrar</span>.</h2>
            <p className="text-zinc-400 mt-4 max-w-2xl mx-auto">Tudo que você precisa em uma única plataforma. Do fatiamento ao envio.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1: Gestão */}
            <motion.div variants={fadeInUp} whileHover="hover" variants={hoverScale} className="bg-[#0a0a0a] border border-zinc-800/80 p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full group-hover:bg-blue-500/20 transition-colors" />
              <div className="bg-blue-500/10 border border-blue-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                <LayoutDashboard className="w-7 h-7 text-blue-500" />
              </div>
              <h3 className="text-xl font-black text-zinc-100 mb-3">Gestão Operacional</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Calcule custos de energia, depreciação, purgas de cores e o valor da sua hora automaticamente. Acompanhe pedidos e saiba seu lucro líquido real ao fim do mês.
              </p>
            </motion.div>

            {/* Card 2: STLs */}
            <motion.div variants={fadeInUp} whileHover="hover" variants={hoverScale} className="bg-[#0a0a0a] border border-zinc-800/80 p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full group-hover:bg-emerald-500/20 transition-colors" />
              <div className="bg-emerald-500/10 border border-emerald-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                <DownloadCloud className="w-7 h-7 text-emerald-500" />
              </div>
              <h3 className="text-xl font-black text-zinc-100 mb-3">STLs da Comunidade</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Acesse o Hub Maker integrado. Compartilhe seus projetos de sucesso e faça download de modelos testados e validados por outros profissionais da Elite 3D.
              </p>
            </motion.div>

            {/* Card 3: Marketplace */}
            <motion.div variants={fadeInUp} whileHover="hover" variants={hoverScale} className="bg-[#0a0a0a] border border-zinc-800/80 p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full group-hover:bg-amber-500/20 transition-colors" />
              <div className="bg-amber-500/10 border border-amber-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                <Tags className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="text-xl font-black text-zinc-100 mb-3">Marketplace VIP</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Pare de caçar promoções. O 3DCheck monitora e reúne as melhores ofertas de filamentos, resinas e peças de reposição diretamente no seu painel.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* OFERTA IRRESISTÍVEL (PREÇO) */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
        className="py-24 px-6 bg-[#080808] border-y border-zinc-900 relative overflow-hidden z-10"
      >
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          
          <motion.div variants={fadeInUp} className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-100 leading-[1.1]">
              A melhor ferramenta, <br/>
              <span className="text-blue-500">pelo preço de um chaveiro</span>.
            </h2>
            <p className="text-lg text-zinc-400 leading-relaxed font-medium">
              Não faz sentido economizar na gestão e perder material numa peça com erro. O 3DCheck blinda sua operação por um custo mensal quase invisível.
            </p>
            <ul className="space-y-5 pt-4">
              {[
                "Vitrine online pública e exclusiva para sua loja",
                "Suporte nativo para perdas e purgas multi-cor",
                "Gestão de clientes (CRM) e faturamento",
                "Acesso irrestrito a Comunidade e Marketplace"
              ].map((item, i) => (
                <motion.li key={i} whileHover={{ x: 10 }} className="flex items-center gap-4 font-bold text-zinc-300">
                  <CheckCircle2 className="w-6 h-6 text-blue-500 shrink-0" /> {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* O CARD DE PREÇO DARK */}
          <motion.div 
            variants={fadeInUp}
            whileHover="hover"
            variants={hoverScale}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-blue-900 rounded-[2.5rem] transform rotate-3 scale-105 opacity-30 blur-2xl pointer-events-none" />
            
            <div className="bg-[#050505] border border-zinc-800 p-10 rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col items-center text-center">
              
              <div className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-8">
                <Timer className="w-4 h-4" /> Liberação Imediata
              </div>
              
              <div className="flex items-start justify-center gap-1 mb-2">
                <span className="text-xl font-black text-zinc-600 mt-2.5">R$</span>
                <span className="text-7xl font-black tracking-tighter text-zinc-100">19</span>
                <div className="flex flex-col items-start justify-start mt-2 gap-0.5">
                  <span className="text-3xl font-black tracking-tighter text-zinc-100">,90</span>
                  <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">/Mês</span>
                </div>
              </div>
              
              <p className="text-zinc-400 font-bold mb-8 text-sm flex items-center gap-2">
                 Comece com 7 dias TOTALMENTE GRÁTIS.
              </p>

              {/* CRONÔMETRO PERSISTENTE E FLUÍDO */}
              <div className="w-full bg-[#0a0a0a] rounded-2xl p-5 border border-zinc-800/80 mb-8 shadow-inner">
                <p className="text-[9px] uppercase font-black tracking-widest text-zinc-500 mb-3 flex items-center gap-2 justify-center">
                   <Zap className="w-3.5 h-3.5 text-blue-500 animate-pulse"/> Oferta válida por:
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'DIAS', val: timeLeft.days },
                    { label: 'HORAS', val: timeLeft.hours },
                    { label: 'MIN', val: timeLeft.minutes },
                    { label: 'SEG', val: timeLeft.seconds }
                  ].map((t, i) => (
                    <div key={i} className="flex flex-col items-center justify-center">
                      <AnimatePresence mode="popLayout">
                        <motion.div 
                          key={t.val} 
                          initial={{ opacity: 0, scale: 0.8, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="bg-zinc-900 w-full py-2 rounded-xl text-xl md:text-2xl font-black text-zinc-100 border border-zinc-800"
                        >
                          {t.val.toString().padStart(2, '0')}
                        </motion.div>
                      </AnimatePresence>
                      <span className="text-[9px] font-bold text-zinc-600 mt-2 uppercase tracking-widest">{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={() => navigate('/login')} 
                className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-lg transition-all"
              >
                QUERO MEUS 7 DIAS GRÁTIS
              </Button>
              <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 mt-4 uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4 text-zinc-500" /> Cancele a qualquer momento.
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* FOOTER */}
      <footer className="py-10 text-center border-t border-zinc-900 relative z-10 bg-[#050505]">
        <div className="flex items-center justify-center gap-2 opacity-40 mb-2">
          <PackageSearch className="w-5 h-5 text-zinc-500" />
          <span className="font-black tracking-widest uppercase text-zinc-400">3DCheck</span>
        </div>
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
          © 2026 3DCheck. O Padrão Elite da Gestão Maker.
        </p>
      </footer>
    </div>
  );
}
