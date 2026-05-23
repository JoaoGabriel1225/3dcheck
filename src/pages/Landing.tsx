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
  XCircle,
  MessageCircle,
  Store,
  Users,
  Star,
  Quote,
  TrendingUp,
  AlertTriangle
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

const QUICK_REVIEWS = [
  { text: "Mano, a barra de vida do filamento salva demais. antes eu perdia peça grande por falta de material", author: "Impressão 3D Brasil" },
  { text: "Muito facil de mexer! Eu odiava planilha, agora vejo o lucro livre no fim do mes direto no celular", author: "Jota 3D Maker" },
  { text: "A calculadora de custo com energia e purga já pagou o sistema no primeiro pedido kkkk", author: "Farm 3D" },
  { text: "to usando a vitrine deles e o cliente ja manda o pedido direto pro meu zap... bom demais", author: "PrintArt" },
  { text: "Achei q ia ser dificil de usar mas é bem intuitivo. cadastrei meus filamentos e produtos rapidinho", author: "Rafa_3D" }
];

export default function Landing() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState({ days: 7, hours: 0, minutes: 0, seconds: 0 });
  const [spotsLeft, setSpotsLeft] = useState(12);
  const [currentReviewIdx, setCurrentReviewIdx] = useState(0);

  // IMPLEMENTAÇÃO DA NOVA LÓGICA DE AFILIADOS
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const refCode = queryParams.get('ref');
    if (refCode) {
      localStorage.setItem('referral_code', refCode);
    }
  }, []);

  useEffect(() => {
    // TIMER PERSISTENTE REAL
    const timerKey = '3dcheck_exclusive_7d_offer';
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

    // VAGAS PERSISTENTES (Gera urgência)
    const spotsKey = '3dcheck_spots_left';
    let savedSpots = localStorage.getItem(spotsKey);
    if (!savedSpots) {
        // Gera um número realista entre 7 e 14
        savedSpots = Math.floor(Math.random() * (14 - 7 + 1) + 7).toString();
        localStorage.setItem(spotsKey, savedSpots);
    }
    setSpotsLeft(parseInt(savedSpots));

    // CARROSSEL DE REVIEWS (Troca a cada 4 segundos)
    const revInterval = setInterval(() => {
      setCurrentReviewIdx(prev => (prev + 1) % QUICK_REVIEWS.length);
    }, 4000);

    return () => {
      clearInterval(interval);
      clearInterval(revInterval);
    };
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
        className="fixed top-0 w-full bg-[#050505]/80 backdrop-blur-xl border-b border-zinc-900/50 z-50 h-20 flex items-center"
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

      {/* HERO SECTION - Focada na Dor e Conversão Agressiva */}
      <motion.section 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="pt-48 pb-20 px-6 relative z-10"
      >
        <div className="max-w-5xl mx-auto text-center flex flex-col items-center gap-8">
          <motion.div 
            variants={fadeInUp}
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs uppercase tracking-widest shadow-xl shadow-red-900/20 backdrop-blur-md"
          >
            <AlertTriangle className="w-4 h-4 text-red-500" /> Apenas {spotsLeft} vagas restantes para o teste gratuito.
          </motion.div>
          
          <motion.h1 
            variants={fadeInUp}
            className="text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tighter leading-[1.05] text-zinc-100"
          >
            Você está trabalhando de <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
              graça na Impressão 3D.
            </span>
          </motion.h1 >
          
          <motion.p 
            variants={fadeInUp}
            className="text-lg md:text-xl text-zinc-400 font-medium max-w-3xl leading-relaxed"
          >
            Se você não sabe calcular o custo de energia, desgaste da máquina e gramas do filamento, você está perdendo dinheiro. O 3DCheck é o ERP de Elite que gerencia toda a sua oficina no piloto automático.
          </motion.p>
          
          <motion.div 
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center gap-4 pt-6 w-full sm:w-auto"
          >
            <Button 
              onClick={() => navigate('/login')} 
              className="h-16 px-12 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-lg shadow-2xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto tracking-wide border border-blue-400/50"
            >
              LIBERAR MEU ACESSO VIP AGORA <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
          <motion.p variants={fadeInUp} className="text-xs font-bold text-zinc-500 uppercase tracking-widest -mt-2">
            Não pedimos cartão de crédito. Cancele quando quiser.
          </motion.p>
        </div>
      </motion.section>

      {/* SEÇÃO SOCIAL PROOF COM CARROSSEL - Prova de que funciona */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
        className="py-10 px-6 relative z-10 border-y border-zinc-900/50 bg-[#080808]/50 overflow-hidden"
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center md:justify-between gap-8 opacity-80">
           <div className="flex items-center gap-3">
              <div className="flex flex-col items-center md:items-start">
                 <div className="flex text-amber-500">
                    <Star className="w-4 h-4 fill-amber-500" /><Star className="w-4 h-4 fill-amber-500" /><Star className="w-4 h-4 fill-amber-500" /><Star className="w-4 h-4 fill-amber-500" /><Star className="w-4 h-4 fill-amber-500" />
                 </div>
                 <span className="text-xs font-black uppercase text-zinc-400 tracking-widest mt-1">Mais de 10.000+ peças precificadas</span>
              </div>
           </div>
           
           <div className="text-center md:text-right relative h-[70px] md:h-[60px] flex flex-col justify-center w-full md:w-[600px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentReviewIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                  className="absolute right-0 left-0"
                >
                  <p className="text-sm md:text-lg font-black text-zinc-100 tracking-tight italic">"{QUICK_REVIEWS[currentReviewIdx].text}"</p>
                  <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">- {QUICK_REVIEWS[currentReviewIdx].author}</p>
                </motion.div>
              </AnimatePresence>
           </div>
        </div>
      </motion.section>

      {/* TODAS AS FUNCIONALIDADES DO APP */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={containerVariants}
        className="py-24 px-6 relative z-10"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-zinc-100">Um exército de <span className="text-blue-500">ferramentas</span> na sua mão.</h2>
            <p className="text-zinc-400 mt-4 max-w-2xl mx-auto font-medium">Você foca em nivelar a mesa e fatiar o modelo. A parte chata e burocrática, o 3DCheck faz por você de um jeito muito fácil e rápido.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feat 1: Precificação */}
            <motion.div variants={fadeInUp} className="bg-[#0a0a0a] border border-zinc-800/80 p-8 rounded-[2.5rem] shadow-xl hover:border-blue-500/30 transition-colors group">
              <div className="bg-blue-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                <Calculator className="w-7 h-7 text-blue-500" />
              </div>
              <h3 className="text-xl font-black text-zinc-100 mb-3 tracking-tight">Precificação Milimétrica</h3>
              <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                Insira peso e tempo. O app calcula Kw/h, depreciação das máquinas, taxa de falha e margem de lucro. Você nunca mais vai chutar um preço ou ficar na dúvida.
              </p>
            </motion.div>

            {/* Feat 2: Estoque de Filamento */}
            <motion.div variants={fadeInUp} className="bg-[#0a0a0a] border border-zinc-800/80 p-8 rounded-[2.5rem] shadow-xl hover:border-emerald-500/30 transition-colors group">
              <div className="bg-emerald-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                <Box className="w-7 h-7 text-emerald-500" />
              </div>
              <h3 className="text-xl font-black text-zinc-100 mb-3 tracking-tight">Estoque de Filamentos Visual</h3>
              <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                Cadastre seus rolos em 1 minuto. Conforme atende pedidos, o sistema desconta as gramas automaticamente. Saiba exatamente qual rolo está no fim antes mesmo de fatiar.
              </p>
            </motion.div>

            {/* Feat 3: Financeiro */}
            <motion.div variants={fadeInUp} className="bg-[#0a0a0a] border border-zinc-800/80 p-8 rounded-[2.5rem] shadow-xl hover:border-amber-500/30 transition-colors group">
              <div className="bg-amber-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                <LineChart className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="text-xl font-black text-zinc-100 mb-3 tracking-tight">Dashboard de Caixa Real</h3>
              <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                Vender não é receber. Nosso Dashboard separa exatamente o que já caiu na sua conta (Pix/Cartão) do que está pendente, mostrando seu lucro livre real para investir.
              </p>
            </motion.div>

            {/* Feat 4: Vitrine */}
            <motion.div variants={fadeInUp} className="bg-[#0a0a0a] border border-zinc-800/80 p-8 rounded-[2.5rem] shadow-xl hover:border-indigo-500/30 transition-colors group">
              <div className="bg-indigo-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                <Store className="w-7 h-7 text-indigo-500" />
              </div>
              <h3 className="text-xl font-black text-zinc-100 mb-3 tracking-tight">Sua Loja / Vitrine Digital</h3>
              <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                Ganhe um link exclusivo público com os seus produtos. O cliente escolhe, vê o preço e o pedido cai direto no seu painel pronto para você aprovar. Menos dor de cabeça, mais vendas.
              </p>
            </motion.div>

            {/* Feat 5: WhatsApp */}
            <motion.div variants={fadeInUp} className="bg-[#0a0a0a] border border-zinc-800/80 p-8 rounded-[2.5rem] shadow-xl hover:border-green-500/30 transition-colors group">
              <div className="bg-green-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                <MessageCircle className="w-7 h-7 text-green-500" />
              </div>
              <h3 className="text-xl font-black text-zinc-100 mb-3 tracking-tight">Automação de WhatsApp</h3>
              <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                Mude o status do pedido para "Imprimindo" ou "Pronto para Entrega" e o 3DCheck gera a mensagem de WhatsApp automática para notificar seu cliente em 1 clique.
              </p>
            </motion.div>

            {/* Feat 6: CRM */}
            <motion.div variants={fadeInUp} className="bg-[#0a0a0a] border border-zinc-800/80 p-8 rounded-[2.5rem] shadow-xl hover:border-violet-500/30 transition-colors group">
              <div className="bg-violet-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-violet-500" />
              </div>
              <h3 className="text-xl font-black text-zinc-100 mb-3 tracking-tight">CRM e Banco de Clientes</h3>
              <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                Guarde o histórico de todo mundo que já comprou com você. Saiba quem são os clientes de ouro que mais te dão lucro e ofereça descontos exclusivos.
              </p>
            </motion.div>

          </div>
        </div>
      </motion.section>

      {/* SEÇÃO DE DEPOIMENTOS - A Autoridade (Makers Reais) */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
        className="py-24 px-6 relative z-10 bg-[#080808]/50 border-y border-zinc-900/50"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-zinc-100">Makers reais. Negócios reais.</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Carlos M.", role: "Fazenda com 8 Máquinas", text: "Antes eu cobrava pelo peso q o fatiador mostrava e esquecia da luz e maquina. O 3DCheck calculou certo e vi q tava trabalhando quase de graça rs." },
              { name: "Marina R.", role: "Focada em Peças Técnicas", text: "A barra de vida do filamento é absurda! Sou pessima com planilha e o app é muito facil de usar. Agr nao aceito pedido grande sem saber se o rolo aguenta." },
              { name: "Felipe T.", role: "Renda Extra com 3D", text: "Comecei na impressao 3d faz pouco tempo e tava perdido nos preços. O sistema faz tudo sozinho, mt bom. Se pagou no primeiro dia." }
            ].map((review, i) => (
              <motion.div key={i} variants={fadeInUp} className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2rem] relative">
                 <Quote className="absolute top-6 right-6 w-8 h-8 text-zinc-700/50" />
                 <div className="flex text-amber-500 mb-4">
                    <Star className="w-4 h-4 fill-amber-500" /><Star className="w-4 h-4 fill-amber-500" /><Star className="w-4 h-4 fill-amber-500" /><Star className="w-4 h-4 fill-amber-500" /><Star className="w-4 h-4 fill-amber-500" />
                 </div>
                 <p className="text-zinc-300 font-medium leading-relaxed mb-6 italic">"{review.text}"</p>
                 <div>
                    <h4 className="font-black text-zinc-100 uppercase tracking-tight">{review.name}</h4>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">{review.role}</span>
                 </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* OFERTA E ANCORAGEM (A HORA DA VERDADE) */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
        className="py-32 px-6 relative overflow-hidden z-10"
      >
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          
          <motion.div variants={fadeInUp} className="text-center space-y-6 mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest mb-4">
              <TrendingUp className="w-3.5 h-3.5" /> O Investimento Mais Lógico
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-100 leading-[1.1]">
              A paz mental da sua oficina custa <br/>
              <span className="text-blue-500 underline decoration-blue-500/30 underline-offset-8">o preço de um chaveiro.</span>
            </h2>
            <p className="text-lg text-zinc-400 leading-relaxed font-medium max-w-2xl mx-auto">
              Perder uma impressão de 15 horas por falta de filamento custa caro. Cobrar R$ 20 numa peça que custou R$ 25 de energia e material custa caro. O 3DCheck custa menos que o lucro de UM chaveiro que você vende no mês.
            </p>
          </motion.div>

          <motion.div 
            variants={fadeInUp}
            whileHover={{ scale: 1.02 }}
            className="relative w-full max-w-lg"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-blue-900 rounded-[3rem] transform rotate-3 scale-105 opacity-30 blur-2xl pointer-events-none" />
            
            <div className="bg-[#050505] border border-zinc-800 p-10 md:p-12 rounded-[3rem] shadow-2xl relative z-10 flex flex-col items-center text-center">
              
              <div className="flex items-start justify-center gap-1 mb-2">
                <span className="text-2xl font-black text-zinc-600 mt-2.5">R$</span>
                <span className="text-8xl font-black tracking-tighter text-zinc-100">19</span>
                <div className="flex flex-col items-start justify-start mt-2 gap-0.5">
                  <span className="text-4xl font-black tracking-tighter text-zinc-100">,90</span>
                  <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">/Mês</span>
                </div>
              </div>
              
              <p className="text-emerald-500 font-black uppercase tracking-widest mt-2 mb-8 text-sm bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
                 🔥 TESTE COMPLETO GRÁTIS
              </p>

              <div className="w-full bg-[#0a0a0a] rounded-2xl p-5 border border-zinc-800/80 mb-8 shadow-inner">
                <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-3 flex items-center gap-2 justify-center">
                   <Zap className="w-3.5 h-3.5 text-blue-500 animate-pulse"/> Sua vaga de teste expira em:
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
                className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-lg shadow-xl shadow-blue-600/30 transition-all active:scale-95 animate-pulse-slow mb-4"
              >
                QUERO MEU TESTE GRÁTIS
              </Button>
              
              <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-zinc-400 mt-2 uppercase tracking-widest bg-zinc-900/50 py-2.5 px-4 rounded-full border border-zinc-800">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Sem necessidade de cadastrar cartão.
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
