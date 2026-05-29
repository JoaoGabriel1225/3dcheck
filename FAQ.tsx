import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  HelpCircle, ChevronDown, Rocket, Box, Settings2, 
  DollarSign, Bot, ArrowRight, BookOpen, ShoppingCart, 
  Sparkles, Layers, Cog, Palette, TrendingUp
} from 'lucide-react';

// --- ESTRUTURA DOS PASSOS INICIAIS ---
const QUICK_START_STEPS = [
  {
    step: "01",
    title: "Configure os Custos",
    desc: "Vá em Configurações > Financeiro. Insira o valor do seu kWh e a sua hora de trabalho. O app precisa disso para calcular custos.",
    icon: Cog,
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    step: "02",
    title: "Estoque de Filamentos",
    desc: "Na aba Filamentos, cadastre os rolos que você tem. Coloque o preço pago e o peso. Assim saberemos o custo exato do plástico por grama.",
    icon: Palette,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10"
  },
  {
    step: "03",
    title: "Crie seus Produtos",
    desc: "Na aba Produtos, cadastre suas peças. Adicione o tempo de impressão e qual filamento usa. O 3DCheck te dará o Custo Real e o Preço Ideal.",
    icon: Box,
    color: "text-amber-500",
    bg: "bg-amber-500/10"
  },
  {
    step: "04",
    title: "Registre as Vendas",
    desc: "Ao vender, vá em Pedidos. O app vai cruzar o produto com os custos, gerenciar o status da impressão e mostrar seu Lucro Real no Dashboard.",
    icon: TrendingUp,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10"
  }
];

// --- ESTRUTURA DAS DÚVIDAS FREQUENTES ---
const FAQ_DATA = [
  {
    category: "Fundação & Configurações",
    icon: Settings2,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    questions: [
      {
        q: "Como configuro os custos da minha loja (Luz, Hora, etc)?",
        a: "Vá em Configurações > Financeiro. Lá você define o custo da sua energia (kWh), a depreciação das máquinas e o valor da sua hora de trabalho. Esses dados são a fundação para o 3DCheck calcular automaticamente o custo real de cada impressão e garantir seu lucro."
      },
      {
        q: "Como configuro minha Vitrine Digital?",
        a: "Em Configurações da Loja, adicione o nome da sua marca, logotipo e uma breve descrição. Todos os produtos que você marcar como 'Ativos na Vitrine' aparecerão no seu link exclusivo. Copie esse link e coloque na bio do seu Instagram ou mande no WhatsApp dos clientes!"
      }
    ]
  },
  {
    category: "Gestão de Filamentos & Produtos",
    icon: Layers,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    questions: [
      {
        q: "Como cadastrar meus Filamentos corretamente?",
        a: "Acesse a aba Filamentos. Cadastre o tipo (PLA, PETG, ABS), a marca, a cor, o peso total do carretel (ex: 1000g) e o valor pago. O 3DCheck usará o peso e o preço para calcular exatamente quanto custa cada grama de material gasto nas suas impressões."
      },
      {
        q: "Como crio um Produto para vender?",
        a: "Na aba Produtos, clique em 'Novo Produto'. Adicione fotos reais da peça, título e descrição. Em seguida, adicione os insumos: selecione qual filamento é usado e coloque o peso da peça fatiada e o tempo de impressão. O app vai cruzar essas informações com suas configurações globais e te dar o Custo Real, sugerindo o Preço de Venda ideal."
      }
    ]
  },
  {
    category: "Operação: Clientes & Pedidos",
    icon: ShoppingCart,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    questions: [
      {
        q: "Qual a melhor forma de cadastrar um Cliente?",
        a: "Na aba Clientes, insira o nome, WhatsApp e endereço (caso faça entregas). Ter uma base de clientes organizada permite que você acompanhe quem compra mais e mande mensagens de novidades. Um cliente recorrente é lucro garantido."
      },
      {
        q: "Como funciona o Ciclo do Pedido?",
        a: "Quando gerar uma venda, crie um Pedido. O ciclo ideal é: 'Aguardando' (novo pedido) -> 'Preparação' (fatiando/preparando máquina) -> 'Imprimindo' -> 'Pronto' (peça finalizada) -> 'Concluído' (entregue ao cliente). Manter esse status atualizado alimenta seu Dashboard com dados em tempo real."
      }
    ]
  },
  {
    category: "Financeiro & Comunidade",
    icon: DollarSign,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    questions: [
      {
        q: "Como o Lucro Líquido é calculado no Dashboard?",
        a: "O 3DCheck não soma apenas o dinheiro que entra. Ele pega o Valor da Venda (Pedidos com pagamento confirmado) e subtrai o Custo do Filamento usado + Custos Operacionais (Energia/Hora). O que aparece no Dashboard como 'Lucro Real' é dinheiro livre no seu bolso."
      },
      {
        q: "Para que serve o Marketplace Hub e os SQLs da Comunidade?",
        a: "O Hub é a nossa curadoria: links de afiliados de filamentos premium e peças de reposição baratas que nós mesmos testamos. Os SQLs da Comunidade são uma biblioteca colaborativa onde a Elite Maker compartilha os melhores modelos STL e scripts."
      }
    ]
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const AccordionItem = ({ q, a }: { q: string, a: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border/50 rounded-2xl overflow-hidden bg-muted/20 transition-all hover:bg-muted/40">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 md:p-5 text-left focus:outline-none"
      >
        <span className="font-bold text-foreground text-sm md:text-base pr-4">{q}</span>
        <ChevronDown 
          className={`w-5 h-5 text-muted-foreground transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} 
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-4 md:px-5 pb-5 text-sm font-medium text-muted-foreground leading-relaxed border-t border-border/50 pt-4">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function FAQ() {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={containerVariants} 
      className="space-y-12 pb-10 max-w-5xl mx-auto"
    >
      {/* HEADER */}
      <motion.div variants={itemVariants} className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-[0.2em]">
          <BookOpen className="w-4 h-4" /> Guia do Maker
        </div>
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
          Como Usar o 3DCheck <HelpCircle className="w-8 h-8 text-blue-500 hidden sm:block" />
        </h2>
        <p className="text-muted-foreground font-medium max-w-2xl text-sm md:text-base">
          Domine a gestão da sua oficina 3D. Entenda o fluxo ideal e transforme plástico fatiado em lucro real e previsível.
        </p>
      </motion.div>

      {/* NOVO: PASSO A PASSO (QUICK START) */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border/50 pb-4">
          <Rocket className="w-6 h-6 text-blue-500" />
          <h3 className="text-2xl font-black tracking-tight text-foreground">
            Passo a Passo Inicial
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_START_STEPS.map((step, idx) => (
            <Card key={idx} className="bg-card/30 border-border/50 hover:bg-card/50 transition-colors relative overflow-hidden group">
              <CardContent className="p-6">
                <div className="absolute top-[-10px] right-[-10px] text-7xl font-black text-muted/10 transition-transform group-hover:scale-110 pointer-events-none select-none">
                  {step.step}
                </div>
                <div className={`p-3 rounded-2xl ${step.bg} w-max mb-4 shadow-sm`}>
                  <step.icon className={`w-6 h-6 ${step.color}`} />
                </div>
                <h4 className="text-lg font-bold text-foreground mb-2 relative z-10">{step.title}</h4>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed relative z-10">
                  {step.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* FAQ CATEGORIES */}
      <motion.div variants={itemVariants} className="space-y-8 pt-4">
        <div className="flex items-center gap-3 border-b border-border/50 pb-4 mb-6">
          <HelpCircle className="w-6 h-6 text-blue-500" />
          <h3 className="text-2xl font-black tracking-tight text-foreground">
            Dúvidas Frequentes
          </h3>
        </div>

        <div className="grid gap-8">
          {FAQ_DATA.map((section, idx) => (
            <div key={idx} className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2.5 rounded-xl ${section.bgColor}`}>
                  <section.icon className={`w-5 h-5 ${section.color}`} />
                </div>
                <h4 className="text-lg md:text-xl font-black uppercase tracking-tight text-foreground">
                  {section.category}
                </h4>
              </div>
              
              <div className="grid gap-3">
                {section.questions.map((faq, faqIdx) => (
                  <AccordionItem key={faqIdx} q={faq.q} a={faq.a} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* SUPPORT BOT CTA */}
      <motion.div variants={itemVariants} className="pt-8">
        <Card className="relative overflow-hidden border-blue-500/30 bg-gradient-to-br from-blue-600/10 via-background to-cyan-900/10 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
          
          <CardContent className="p-8 md:p-10 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="h-20 w-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 h-6 w-6 rounded-full border-4 border-background flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tight text-foreground">Ainda perdido?</h3>
                <p className="text-muted-foreground font-medium max-w-md">
                  Nenhuma máquina vem com todas as respostas prontas. Se você teve um problema ou tem uma sugestão genial, o 3DCheck Bot está pronto para te ouvir.
                </p>
              </div>
            </div>

            <Button 
              onClick={() => navigate('/app/support')}
              className="w-full md:w-auto h-14 px-8 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] gap-3 transition-all hover:scale-105 active:scale-95 group"
            >
              FALAR COM O SUPORTE
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>

    </motion.div>
  );
}
