import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, 
  CheckCircle2, 
  Timer, 
  ArrowRight, 
  Zap, 
  ShieldCheck,
  PackageSearch,
  Calculator,
  LineChart,
  Box,
  XCircle
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

export default function Landing() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState({ days: 14, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timerKey = '3dcheck_exclusive_maker_offer_v2';
    let endTime = localStorage.getItem(timerKey);

    if (!endTime) {
      // 14 dias de gatilho mental para a nova estratégia
      const newEndTime = new Date().getTime() + 14 * 24 * 60 * 60 * 1000;
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
    <div className="min-h-screen bg-[#050505] text-zinc-100 overflow-x-hidden selection:bg-blue-500/30 relative font-sans">
      
      {/* LUZES NEON FLUTUANTES (BACKGROUND) */}
      <motion.div 
        animate={{ 
          x: [0, 150, -100, 0], 
          y: [0, -100, 100, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen" 
      />
      <motion.div 
        animate={{ 
          x: [0, -150, 100, 0], 
          y: [0, 100, -100, 0],
          scale: [1, 1.5, 1]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen" 
      />

      {/* HEADER PREMIUM */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 w-full bg-[#050505]/70 backdrop-blur-xl border-b border-zinc-900/50 z-50 h-20 flex items-center"
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

      {/* HERO SECTION - Focada na Dor */}
      <motion.section 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="pt-48 pb-20 px-6 relative z-10"
      >
        <div className="max-w-5xl mx-auto text-center flex flex-col items-center gap-8">
          <motion.div 
            variants={fadeInUp}
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-900/20 backdrop-blur-md"
          >
            <Zap className="w-4 h-4 text-blue-500" /> A era das planilhas acabou.
          </motion.div>
          
          <motion.h1 
            variants={fadeInUp}
            className="text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tighter leading-[1.05] text-zinc-100"
          >
            Pare de chutar preços e <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
              perder dinheiro em 3D.
            </span>
          </motion.h1 >
          
          <motion.p 
            variants={fadeInUp}
            className="text-lg md:text-xl text-zinc-400 font-medium max-w-2xl leading-relaxed"
          >
            O único ERP financeiro e operacional que calcula o custo exato da grama do seu filamento, gerencia seus pedidos e te mostra o lucro real que vai para o seu bolso.
          </motion.p>
          
          <motion.div 
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center gap-4 pt-6 w-full sm:w-auto"
          >
            <Button 
              onClick={() => navigate('/login')} 
              className="h-16 px-12 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-lg shadow-2xl shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto tracking-wide"
            >
              CRIAR CONTA GRÁTIS <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
          <motion.p variants={fadeInUp} className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest -mt-2">
            Teste completo por 14 dias. Sem cartão de crédito.
          </motion.p>
        </div>
      </motion.section>

      {/* SEÇÃO PROBLEMA VS SOLUÇÃO */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
        className="py-24 px-6 relative z-10 bg-[#080808]/50 border-y border-zinc-900/50"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-zinc-100">Por que os amadores <span className="text-red-500">quebram</span>?</h2>
            <p className="text-zinc-400 mt-4 max-w-2xl mx-auto font-medium">A impressão 3D é uma fábrica em casa. Se você não gerenciar como uma indústria, o prejuízo é certo.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            <motion.div variants={fadeInUp} className="bg-red-500/5 border border-red-500/20 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden flex flex-col gap-4">
              <div className="bg-red-500/10 w-12 h-12 rounded-2xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-black text-zinc-100">Cobrar pelo "Olhômetro"</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Você gasta 35 horas imprimindo, gasta luz, desgaste de bico e cobra barato porque o concorrente cobrou. Resultado: Trabalhou de graça.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="bg-red-500/5 border border-red-500/20 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden flex flex-col gap-4">
              <div className="bg-red-500/10 w-12 h-12 rounded-2xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-black text-zinc-100">Estoque Cego</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Você aceita a encomenda e na hora de fatiar descobre que o rolo de filamento preto acabou. Cliente frustrado, prazo estourado.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="bg-red-500/5 border border-red-500/20 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden flex flex-col gap-4">
              <div className="bg-red-500/10 w-12 h-12 rounded-2xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-black text-zinc-100">Planilhas Caóticas</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Anotar pedidos no papel, no WhatsApp e em planilhas que você esquece de atualizar. O dinheiro entra, mas você não sabe de onde veio.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* FEATURES MATADORAS */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
        className="py-24 px-6 relative z-10"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-zinc-100">Assuma o controle de uma <span className="text-blue-500">Elite Maker</span>.</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div variants={fadeInUp} className="bg-[#0a0a0a] border border-zinc-800/80 p-10 rounded-[3rem] shadow-2xl group hover:border-blue-500/30 transition-colors">
              <div className="bg-blue-500/10 w-16 h-16 rounded-3xl flex items-center justify-center mb-6">
                <Calculator className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-2xl font-black text-zinc-100 mb-4 tracking-tight">Precificação Milimétrica</h3>
              <p className="text-zinc-400 leading-relaxed font-medium">
                Insira suas gramas, horas de impressão e margem de lucro. O 3DCheck calcula a energia elétrica, desgaste da máquina, purga e te dá o preço exato e imbatível. Nunca mais tome prejuízo.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="bg-[#0a0a0a] border border-zinc-800/80 p-10 rounded-[3rem] shadow-2xl group hover:border-emerald-500/30 transition-colors">
              <div className="bg-emerald-500/10 w-16 h-16 rounded-3xl flex items-center justify-center mb-6">
                <Box className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-black text-zinc-100 mb-4 tracking-tight">Gestão de Filamentos Visual</h3>
              <p className="text-zinc-400 leading-relaxed font-medium">
                Cadastre seus rolos. Conforme você fecha os pedidos, o 3DCheck desconta automaticamente as gramas e exibe barras de vida reais do seu estoque. Saiba exatamente quando repor.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="bg-[#0a0a0a] border border-zinc-800/80 p-10 rounded-[3rem] shadow-2xl group hover:border-amber-500/30 transition-colors md:col-span-2 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="bg-amber-500/10 w-16 h-16 rounded-3xl flex items-center justify-center mb-6">
                  <LineChart className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-2xl font-black text-zinc-100 mb-4 tracking-tight">Dashboard Financeiro Inteligente</h3>
                <p className="text-zinc-400 leading-relaxed font-medium">
                  Pare de misturar dinheiro pessoal com o da oficina. Veja em gráficos o que foi <strong>Vendido</strong>, o que realmente está <strong>Pago no Caixa</strong>, o dinheiro <strong>Pendente</strong> e o seu <strong>Lucro Líquido Real</strong> do mês.
                </p>
              </div>
              <div className="flex-1 w-full flex justify-end">
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl w-full max-w-sm shadow-2xl rotate-2">
                  <div className="flex justify-between items-center mb-4">
                     <span className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Lucro Real (Caixa)</span>
                  </div>
                  <div className="text-4xl font-black text-emerald-500">R$ 4.259,00</div>
                  <div className="w-full bg-zinc-800 h-2 mt-4 rounded-full overflow-hidden">
                     <div className="bg-emerald-500 w-[80%] h-full rounded-full"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* OFERTA E GATILHO MENTAL */}
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
              Blinde sua operação, <br/>
              <span className="text-blue-500">por menos que um rolo de PLA</span>.
            </h2>
            <p className="text-lg text-zinc-400 leading-relaxed font-medium">
              Um erro no cálculo de um pedido grande ou a falta de organização custam dezenas de reais. O 3DCheck paga a própria assinatura com 1 pedido bem precificado.
            </p>
            <ul className="space-y-5 pt-4">
              {[
                "Vitrine online pública exclusiva",
                "Estoque de Filamentos com Baixa Automática",
                "Dashboard de Fluxo de Caixa Real",
                "Alertas Inteligentes no WhatsApp do Cliente"
              ].map((item, i) => (
                <motion.li key={i} whileHover={{ x: 10 }} className="flex items-center gap-4 font-bold text-zinc-300">
                  <CheckCircle2 className="w-6 h-6 text-blue-500 shrink-0" /> {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div 
            variants={fadeInUp}
            whileHover={{ scale: 1.02, y: -5 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-blue-900 rounded-[3rem] transform rotate-3 scale-105 opacity-30 blur-2xl pointer-events-none" />
            
            <div className="bg-[#050505] border border-zinc-800 p-10 rounded-[3rem] shadow-2xl relative z-10 flex flex-col items-center text-center">
              
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
                 Comece agora com 14 dias TOTALMENTE GRÁTIS.
              </p>

              <div className="w-full bg-[#0a0a0a] rounded-2xl p-5 border border-zinc-800/80 mb-8 shadow-inner">
                <p className="text-[9px] uppercase font-black tracking-widest text-zinc-500 mb-3 flex items-center gap-2 justify-center">
                   <Zap className="w-3.5 h-3.5 text-blue-500 animate-pulse"/> Sua vaga expira em:
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
                className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-lg shadow-xl shadow-blue-600/20 transition-all active:scale-95"
              >
                QUERO MEUS 14 DIAS GRÁTIS
              </Button>
              <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 mt-5 uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4 text-zinc-500" /> Plataforma Segura • Cancele quando quiser.
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* FOOTER */}
      <footer className="py-12 text-center border-t border-zinc-900 relative z-10 bg-[#050505]">
        <div className="flex items-center justify-center gap-2 opacity-40 mb-3">
          <PackageSearch className="w-5 h-5 text-zinc-500" />
          <span className="font-black tracking-widest uppercase text-zinc-400">3DCheck</span>
        </div>
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
          © 2026 3DCheck. O Padrão Ouro da Gestão Maker.
        </p>
      </footer>
    </div>
  );
}
