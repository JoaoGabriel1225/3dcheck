import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, 
  Calculator, 
  Store, 
  Users, 
  CheckCircle2, 
  Timer, 
  ArrowRight, 
  Zap, 
  ShieldCheck,
  PackageSearch,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Variantes de Animação Fluidas
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } // Ease out quart (suave)
  }
};

const hoverScale = {
  hover: { scale: 1.03, transition: { duration: 0.3, ease: "easeOut" } }
};

export default function Landing() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState({ days: 7, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Lógica do cronômetro persistente (localStorage)
    const timerKey = '3dcheck_exclusive_maker_offer';
    let endTime = localStorage.getItem(timerKey);

    if (!endTime) {
      // Configura para 7 dias a partir do primeiro acesso
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
    // Forçando o tema deep dark para combinar com a imagem de referência
    <div className="min-h-screen bg-black text-zinc-100 overflow-x-hidden selection:bg-blue-500/30">
      
      {/* HEADER PREMIUM (Fixado com Blur) */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 w-full bg-black/60 backdrop-blur-lg border-b border-zinc-800 z-50 h-20 flex items-center"
      >
        <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-600/20">
              <PackageSearch className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight uppercase italic text-foreground">3D<span className="text-blue-500">Check</span></span>
          </div>
          <Button 
            onClick={() => navigate('/login')} 
            variant="ghost" 
            className="font-bold text-zinc-400 hover:text-foreground hover:bg-zinc-800 rounded-xl px-5 h-11"
          >
            Acessar Minha Oficina
          </Button>
        </div>
      </motion.header>

      {/* HERO SECTION GIGANTE E FLUIDA */}
      <motion.section 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="pt-40 pb-28 px-6 relative"
      >
        {/* Glow de fundo dinâmico */}
        <motion.div 
          animate={{ opacity: [0.4, 0.6, 0.4], scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-blue-600/20 blur-[150px] rounded-full pointer-events-none" 
        />
        
        <div className="max-w-5xl mx-auto text-center relative z-10 flex flex-col items-center gap-8 mt-10">
          <motion.div 
            variants={fadeInUp}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-blue-600/10 border border-blue-600/20 text-blue-400 font-bold text-sm uppercase tracking-widest shadow-xl shadow-blue-950/30"
          >
            <Zap className="w-5 h-5 text-blue-500" /> A Elite Maker não usa planilhas.
          </motion.div>
          
          <motion.h1 
            variants={fadeInUp}
            className="text-6xl md:text-8xl font-black tracking-tighter leading-[1.05] italic uppercase"
          >
            Pare de jogar <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">
              lucro fora
            </span>.
          </motion.h1 >
          
          <motion.p 
            variants={fadeInUp}
            className="text-xl md:text-2xl text-zinc-300 font-medium max-w-3xl leading-relaxed"
          >
            O 3DCheck é a plataforma operacional de elite para profissionais da impressão 3D. Calcule preços exatos com 1 clique, automatize pedidos e venda através da sua própria vitrine digital integrada.
          </motion.p>
          
          <motion.div 
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center gap-5 pt-5 w-full sm:w-auto"
          >
            <Button 
              onClick={() => navigate('/register')} 
              className="h-16 px-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xl shadow-2xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto uppercase tracking-wide"
            >
              Começar Teste de 7 Dias Grátis <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-sm font-black text-zinc-500 uppercase tracking-widest mt-2 sm:mt-0 italic">
               Cartão de crédito não exigido.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* OFERTA IRRESISTÍVEL (O CARD PREMIUM NO ESTILO DA REFERÊNCIA) */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
        className="py-24 px-6 bg-zinc-950 border-y border-zinc-800 relative overflow-hidden"
      >
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          
          <motion.div variants={fadeInUp} className="space-y-7">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic text-foreground leading-[1.1]">
              A melhor gestão 3D do Brasil, <span className="text-blue-500">pelo preço de um chaveiro</span>.
            </h2>
            <p className="text-xl text-zinc-300 leading-relaxed font-medium">
              Não faz sentido economizar na gestão e perder R$20,00 de filamento numa peça com erro de fatiamento. O 3DCheck blinda o seu bolso por um custo mensal ridículo.
            </p>
            <ul className="space-y-5 pt-5">
              {[
                {text: "Cálculo automático de custos (Filamento, Energia, Depreciação, Setup)", active: true},
                {text: "Suporte nativo para impressão multi-cor (AMS) com cálculo de perdas", active: true},
                {text: "Sua Vitrine Online pronta para receber pedidos direto no dashboard", active: true},
                {text: "Financeiro completo: saiba exatamente seu lucro líquido real", active: true}
              ].map((item, i) => (
                <motion.li key={i} whileHover={{ x: 10 }} className="flex items-center gap-4 font-bold text-zinc-100 text-lg">
                  <CheckCircle2 className="w-7 h-7 text-emerald-500 shrink-0" /> {item.text}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* O CARD DE PREÇO - Refinado no estilo da tela de login */}
          <motion.div 
            variants={fadeInUp}
            whileHover="hover"
            variants={hoverScale}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[2.5rem] transform rotate-3 scale-105 opacity-20 blur-xl pointer-events-none" />
            
            {/* Design do Card similar à referência */}
            <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col items-center text-center">
              
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-8 shadow-inner shadow-amber-500/10"
              >
                <Timer className="w-4 h-4" /> Oferta Maker por Tempo Limitado
              </motion.div>
              
              <div className="flex items-start justify-center gap-1 mb-2">
                <span className="text-2xl font-black text-zinc-500 mt-2.5">R$</span>
                <span className="text-8xl font-black tracking-tighter text-blue-500 italic">19</span>
                <div className="flex flex-col items-start justify-start mt-2.5 gap-1">
                  <span className="text-3xl font-black tracking-tighter text-blue-500">,90</span>
                  <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">/Mês</span>
                </div>
              </div>
              
              <p className="text-emerald-500 font-bold mb-10 text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5"/> Comece com 7 dias TOTALMENTE GRÁTIS.
              </p>

              {/* CRONÔMETRO PERSISTENTE E FLUÍDO */}
              <div className="w-full bg-black rounded-2xl p-6 border border-zinc-800 mb-10 shadow-inner">
                <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-4 italic flex items-center gap-2 justify-center">
                   <Zap className="w-3.5 h-3.5 text-blue-500 animate-pulse"/> Sua oferta VIP expira em:
                </p>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'DIAS', val: timeLeft.days },
                    { label: 'HORAS', val: timeLeft.hours },
                    { label: 'MINutos', val: timeLeft.minutes },
                    { label: 'SEGUNDOS', val: timeLeft.seconds }
                  ].map((t, i) => (
                    <motion.div key={i} className="flex flex-col items-center justify-center">
                      <AnimatePresence mode="popLayout">
                        <motion.div 
                          key={t.val} 
                          initial={{ opacity: 0, scale: 0.8, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="bg-zinc-800 w-full py-2.5 rounded-xl text-2xl md:text-3xl font-black text-foreground shadow-lg border border-zinc-700"
                        >
                          {t.val.toString().padStart(2, '0')}
                        </motion.div>
                      </AnimatePresence>
                      <span className="text-[10px] font-bold text-zinc-500 mt-2 uppercase tracking-widest">{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={() => navigate('/register')} 
                className="w-full h-16 rounded-xl bg-foreground hover:bg-zinc-200 text-background font-black text-xl shadow-2xl transition-all hover:scale-105 active:scale-95 uppercase tracking-wide"
              >
                Ativar Meus 7 Dias Gratuitos <Rocket className="w-5 h-5 ml-2.5" />
              </Button>
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 mt-5 italic tracking-wider">
                <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" /> Sem fidelidade. Cancele quando quiser.
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* FOOTER PREMIUM */}
      <footer className="py-12 text-center border-t border-zinc-800 bg-black">
        <div className="flex items-center justify-center gap-2.5 opacity-60 mb-3">
          <PackageSearch className="w-5 h-5 text-blue-500" />
          <span className="font-black tracking-tighter uppercase italic text-foreground">3DCheck</span>
        </div>
        <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest italic">
          O Sistema Operacional da Fabricação Digital de Elite.
        </p>
      </footer>
    </div>
  );
}
