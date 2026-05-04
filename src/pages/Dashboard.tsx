import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { 
  PackageSearch, 
  Clock, 
  Package, 
  DollarSign, 
  TrendingDown,
  LayoutDashboard,
  Zap, 
  ArrowUpRight,
  Download,
  Smartphone,
  X,
  Calendar,
  CheckCircle2,
  ListChecks,
  ChevronRight,
  BarChart3,
  Trophy,
  Bot,
  Sparkles,
  Info,
  MessageSquareOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

// --- DATABASE DE MENSAGENS DO #3DCHECK BOT (150 FRASES) ---

const BOT_PHRASES = [

  // MARKETPLACE HUB (O Ouro Garimpado)

  "Garimpei o 'ouro' no Marketplace Hub! Filamento premium com preço de banana. Já viu hoje?",

  "O Marketplace Hub atualizou com peças que são raridade. Curadoria de quem entende!",

  "Link de afiliado? Sim, mas só do que eu usaria na minha própria bancada. Confira o Marketplace Hub!",

  "Parei tudo para te avisar: tem extrusora em promoção no Marketplace Hub. Ouro puro!",

  "No Marketplace Hub eu encontro o que presta, você só clica e economiza.",

  "Sabe aquele componente que nunca baixa de preço? Garimpei ele no Marketplace Hub hoje!",



  // SQLs DA COMUNIDADE

  "Os SQLs da Comunidade estão pegando fogo! Já viu o arquivo que subiram hoje?",

  "Não reinvente a roda. Dá um pulo nos SQLs da Comunidade e veja o que os outros makers estão compartilhando.",

  "Alguém postou um suporte de fone incrível nos SQLs da Comunidade. Vai lá baixar!",

  "Compartilhar é crescer. Já subiu seu melhor arquivo nos SQLs da Comunidade?",



  // GESTÃO OPERACIONAL (CLIENTES, PEDIDOS, PRODUTOS, VITRINE)

  "Um cliente bem cadastrado é uma venda recorrente garantida. Já revisou seus contatos?",

  "Pedidos parados são máquinas paradas. Mantenha seu fluxo de produção atualizado!",

  "Sua Vitrine é sua cara. Vá em Configurações da Loja e deixe ela com o brilho da Elite.",

  "Dica: Fotos reais dos seus produtos na Vitrine aumentam a conversão em 40%!",

  "Gestão de Produtos: Se o custo do filamento subiu, o 3DCheck te avisa para ajustar o preço.",

  "O status 'Imprimindo' dá um alívio, né? Não esqueça de atualizar o pedido quando acabar!",



  // FINANCEIRO E CONFIGURAÇÕES

  "O Financeiro não mente: Gerenciar custos é o que separa o amador do profissional.",

  "Nas Configurações Globais você ajusta o 3DCheck para bater com o ritmo da sua oficina.",

  "Dinheiro no bolso é melhor que filamento no ar. Confira seu Lucro Líquido hoje!",



  // HUMOR, FATOS E CURIOSIDADES

  "Nivelar a mesa é 1% técnica e 99% oração. Mas no 3DCheck a gestão é 100% garantida!",

  "Sabia que a primeira impressora 3D é de 1984? Mais velha que muito mestre maker por aí.",

  "Spaghetti de plástico só é bom se for erro dos outros. No seu 3DCheck, a gente evita o prejuízo!",

  "O cheiro de filamento novo pela manhã é o perfume do sucesso.",

  "Se a primeira camada grudou, o dia já começou com vitória!",

  "O recorde de maior impressão 3D do mundo é um barco. Imagina o tempo de fatiamento!",

  "Impressora parada não paga o faturamento. O que vamos imprimir hoje?",

  "Makers não erram, eles criam 'protótipos de aprendizado não planejados'.",

  "A primeira camada é a base de tudo: na impressão e no seu negócio. Use o Dashboard!",

  "Dica de mestre: Um bico limpo evita 90% das dores de cabeça. Os outros 10% o 3DCheck resolve.",

  "A comunidade 3D é gigante. Você faz parte da Elite agora!",



  // (Continuando a diversificação para atingir 150 temas variados...)

  "Suporte & Feedback: Teve uma ideia genial pro app? Manda pra gente!",

  "Já configurou seu faturamento hoje? O 3DCheck ama ver seus números crescendo.",

  "A aba Clientes é o seu tesouro. Use o filtro para ver quem são seus melhores compradores.",

  "Configurações da Loja: Já colocou sua logo hoje?",

  "A vida é curta demais para nivelar a mesa manualmente toda hora.",

  "No 3DCheck, o Dashboard é o seu painel de controle para a dominação mundial maker.",

  "Fato: O PLA é feito de amido de milho, mas não tente fazer pipoca com ele!",

  "O Marketplace Hub é onde o garimpo encontra a oportunidade.",

  "Pedidos: 'Aguardando Contato' é o primeiro passo para o 'Concluído'. Agilidade neles!",

  "Sua oficina, suas regras. O 3DCheck é apenas o seu braço direito tecnológico.",

  "Fatiar, imprimir, faturar. O ciclo da felicidade mestre.",

  "Vitrine: Seus produtos merecem ser vistos. Já compartilhou o link da sua loja?",

  "O lucro está nos detalhes. O custo total leva em conta até a luz, o 3DCheck sabe disso.",

  "Nada como o som de uma impressora 3D trabalhando enquanto você dorme.",

  "Seu 3DCheck é atualizado constantemente. Estamos sempre um passo à frente!",

  "O 3DCheck Bot está aqui para te lembrar que você é um empreendedor, não só um maker.",

  "Gerencie seus pedidos com a precisão de uma camada de 0.1mm.",

  "Os SQLs da Comunidade são o Google Drive dos Deuses da Impressão.",

  "Marketplace Hub: Eu garimpo o ouro, você colhe os lucros.",

  "O faturamento de hoje é o investimento em filamento de amanhã.",

  "Configurações Globais: Onde a mágica da personalização acontece.",

  "Dúvidas? O Suporte & Feedback é o seu canal direto com o criador.",

  "O lucro líquido é o combustível da sua evolução.",

  "Status: 'Pronto'. A palavra mais bonita que um cliente pode ler no 3DCheck.",

  "Produção 3D é arte, gestão 3D é 3DCheck.",

  "Clientes satisfeitos voltam. Como está o status dos seus pedidos hoje?",

  "A vitrine digital é o seu vendedor que nunca dorme.",

  "Use o Marketplace para encontrar as ferramentas que vão acelerar sua produção.",

  "Fato: Existem impressoras 3D que imprimem comida. Já imaginou gerenciar isso no 3DCheck?",

  "A curiosidade matou o gato, mas fez o maker descobrir novas técnicas de fatiamento.",

  "O marketplace não é só compra, é estratégia de custo-benefício.",

  "Gerenciamento de produtos: Conheça seu estoque para não ser pego de surpresa.",

  "Dashboard: A visão de águia que seu negócio 3D precisava.",

  "A Elite 3DCheck não para de crescer. Você está no topo!",

  "Dica: Limpar a mesa com álcool isopropílico é o segredo da adesão perfeita.",

  "O seu sucesso é o meu código fonte. Vamos decolar!",

  "Marketplace Hub: Onde o garimpo do mestre vira economia no seu bolso.",

  "A união faz a força, e nos SQLs da Comunidade a união faz os melhores arquivos.",

  "Sincronização global ativada. Suas vendas em um só lugar.",

  "Economia circular maker: Imprima, venda, reinvista.",

  "O 3DCheck é o cérebro, você é o coração da operação.",

  "Já viu a aba Financeiro? O lucro está chamando seu nome.",

  "Produtos: Já cadastrou aquela novidade que você imprimiu ontem?",

  "Gestão operacional é o segredo das grandes fazendas de impressão.",

  "Um mestre maker nunca para de aprender. O 3DCheck nunca para de atualizar.",

  "Configurações da Loja: Sua marca é forte, mostre ela na Vitrine!",

  "Marketplace Hub: Ouro encontrado. Oportunidade batendo na porta.",

  "Não é só imprimir, é transformar plástico em valor. 3DCheck te ajuda nisso.",

  "Fato: Já imprimiram casas em 3D. O 3DCheck está pronto para grandes projetos!",

  "A aba Pedidos é o termômetro do seu sucesso. Mantenha ela aquecida!",

  "O 3DCheck Bot deseja a você uma produção sem warping e com muito lucro!",

  "A Vitrine Digital é o seu palco. Brilhe!",

  "Financeiro: Cada centavo conta na hora de escalar seu negócio 3D.",

  "SQLs da Comunidade: Onde a criatividade não tem limites.",

  "Sua oficina merece a tecnologia do 3DCheck. Gestão de Elite!",

  "O Marketplace Hub é a trilha do ouro para o maker inteligente.",

  "Clientes: O atendimento humanizado começa com uma boa organização interna.",

  "O 3DCheck é o seu assistente pessoal que não bebe café, mas adora dados.",

  "Produção: 'Em Andamento' significa que o lucro está sendo processado.",

  "Configurações Globais: Ajuste o app para o seu estilo de vida maker.",

  "Marketplace Hub: Só o filamento que não quebra e o bico que não entope.",

  "A aba Produtos é a sua prateleira infinita. Explore-a!",

  "Dica: Verifique seus custos periodicamente para manter a margem de lucro real.",

  "O Dashboard é a bússola do seu empreendimento 3D.",

  "Seja bem-vindo a mais um dia de produtividade máxima!",

  "O 3DCheck Bot está de olho: Já atualizou seus status de entrega hoje?",

  "A Vitrine é o seu cartão de visitas no mundo digital. Use e abuse!",

  "Nos SQLs da Comunidade, cada download é um reconhecimento ao talento maker.",

  "Marketplace Hub: Garimpo diário para você focar no que importa: imprimir.",

  "Financeiro: Lucro bruto é vaidade, lucro líquido é sanidade. 3DCheck faz a conta.",

  "Sua oficina 3D agora tem um sistema de gestão de nível mundial.",

  "A aba Pedidos é onde a mágica das vendas acontece. Cuide bem dela!",

  "Configurações da Loja: Sua loja, sua identidade, seu 3DCheck.",

  "O Suporte & Feedback é a nossa linha direta para construir o melhor app do mundo.",

  "Fato: O filamento Wood contém serragem real. O cheiro de madeira na oficina é top!",

  "Marketplace Hub: Onde a qualidade encontra o preço baixo. Garimpado pelo mestre.",

  "O 3DCheck Bot acredita no seu potencial. Vamos bater as metas de hoje!",

  "A aba Clientes é o seu mapa de networking. Cultive seus contatos.",

  "Produção: O segredo está na repetição com perfeição.",

  "Configurações Globais: Onde você define o idioma do seu sucesso.",

  "SQLs da Comunidade: A biblioteca infinita de soluções 3D.",

  "Marketplace Hub: A curadoria que te economiza horas de pesquisa.",

  "Financeiro: Ver o gráfico de lucro subindo é a melhor sensação para um maker.",

  "O Dashboard é o resumo da sua dedicação. Orgulhe-se dos seus números!",

  "A aba Produtos permite que você venda o mesmo design mil vezes. Escala é tudo!",

  "Vitrine: Onde o seu cliente vira seu fã.",

  "A cada atualização, o 3DCheck fica mais potente. Aproveite as novas funções!",

  "O 3DCheck Bot está aqui para facilitar sua vida. Pergunte ao Suporte se precisar!",

  "Pedidos: A velocidade na entrega é o que te diferencia da concorrência.",

  "Marketplace Hub: O ouro está nos detalhes da curadoria.",

  "Fato: A impressão 3D já é usada na medicina para criar próteses perfeitas.",

  "A aba Clientes te ajuda a lembrar quem é o mestre por trás de cada pedido.",

  "Configurações da Loja: Onde o marketing do seu negócio começa.",

  "SQLs da Comunidade: Porque o conhecimento deve ser compartilhado.",

  "O Dashboard é o seu painel de bordo para o sucesso. Ajuste a rota!",

  "Marketplace Hub: Links de confiança para uma produção de confiança.",

  "Financeiro: Tenha o controle total do seu fluxo de caixa maker.",

  "Produção: 'Pronto para Retirada' é o gatilho para a satisfação do cliente.",

  "O 3DCheck é o app que entende as dores e delícias de ser um maker.",

  "Dica: Mantenha seus filamentos em local seco para evitar a umidade.",

  "O Marketplace Hub é o seu braço direito na hora das compras.",

  "A aba Produtos organiza o caos da criação em um catálogo profissional.",

  "Vitrine: Sua loja online está pronta para receber o mundo.",

  "O 3DCheck Bot está sempre pronto para te dar uma dica valiosa.",

  "Pedidos: Acompanhe o ciclo de vida de cada peça, do fatiamento à entrega.",

  "Marketplace Hub: Garimpado, testado e aprovado pelo mestre 3DCheck.",

  "Nos SQLs da Comunidade, você encontra a inspiração que faltava.",

  "Financeiro: Lucro real é o que faz sua oficina crescer. Confira os dados!",

  "O Dashboard é o espelho da sua gestão. Reflita sucesso!",

  "Configurações Globais: Onde a sua experiência com o app se torna única.",

  "Marketplace Hub: O caminho mais curto para o melhor hardware 3D.",

  "Fato: A impressão 3D em metal já é usada na Fórmula 1!",

  "A aba Clientes é a sua agenda de ouro. Mantenha-a sempre atualizada.",

  "O 3DCheck é a ferramenta que faltava na sua caixa de ferramentas maker.",

  "Produção: Cada camada conta, cada pedido importa.",

  "Vitrine: Mostre ao mundo o poder da sua fabricação digital.",

  "O 3DCheck Bot deseja a você um dia produtivo e sem entupimentos!",

  "A aba Pedidos é o motor que move o seu negócio 3D.",

  "Marketplace Hub: O segredo dos mestres para comprar barato e vender caro.",

  "SQLs da Comunidade: Transformando bits em átomos, colaborativamente.",

  "Financeiro: O 3DCheck organiza, você lucra. Simples assim.",

  "A aba Produtos é o seu inventário de criatividade.",

  "Configurações da Loja: Dê um toque de profissionalismo ao seu negócio.",

  "Marketplace Hub: A vitrine das melhores ofertas do mundo 3D.",

  "O Dashboard é o ponto de partida para as suas melhores decisões.",

  "O 3DCheck Bot está orgulhoso da sua produção. Continue assim!",

  "Nos SQLs da Comunidade, o próximo grande projeto pode ser seu.",

  "Aba Clientes: Porque por trás de cada pedido existe uma grande parceria.",

  "3DCheck: Criado de maker para maker, visando a Elite da impressão."

];

type TopProduct = { name: string; count: number; revenue: number; percentage: number };

type OrderContext = {
  total: number;
  newOrders: number;
  inProgress: number;
  ready: number;
  completed: number;
  revenue: number;
  cost: number;
  profit: number;
  trends: { revenue: number[]; cost: number[]; profit: number[] }; 
  topProducts: TopProduct[];
}

type TimeFilter = 'hoje' | 'semana' | 'mes' | 'todos';

const MiniBarChart = ({ data, color }: { data: number[], color: string }) => {
  if (!data || data.length === 0) {
    return <div className="h-10 w-24 flex items-end"><div className="w-full h-[2px] bg-muted-foreground/20 rounded-full" /></div>;
  }
  
  const displayData = data.slice(-10);
  const max = Math.max(...displayData) || 1;

  return (
    <div className="flex items-end gap-[3px] h-14 w-24 pt-5">
      {displayData.map((val, i) => {
        const heightPercent = Math.max((val / max) * 100, 5); 
        
        return (
          <div key={i} className="relative flex-1 h-full flex items-end justify-center group">
            <div 
              className="absolute bottom-full mb-1 text-[8px] font-bold"
              style={{ color: color, opacity: val > 0 ? 1 : 0 }}
            >
              {val > 0 ? Math.round(val) : ''}
            </div>
            
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${heightPercent}%` }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="w-full rounded-t-[1px] opacity-80"
              style={{ backgroundColor: color }}
            />
          </div>
        );
      })}
    </div>
  );
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function Dashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate(); 
  const [stats, setStats] = useState<OrderContext>({ 
    total: 0, newOrders: 0, inProgress: 0, ready: 0, completed: 0, revenue: 0, cost: 0, profit: 0,
    trends: { revenue: [], cost: [], profit: [] },
    topProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('mes');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  // ESTADOS DO BOT
  const [showBot, setShowBot] = useState(true);
  const [botPhrase, setBotPhrase] = useState("");

  const storeDisplayName = user?.user_metadata?.full_name || profile?.name || 'Maker';

  useEffect(() => {
    // PERSISTÊNCIA DO BOT
    const botPreference = localStorage.getItem('hide_3dcheck_bot');
    if (botPreference === 'true') {
      setShowBot(false);
    } else {
      // Sorteia frase inicial
      const randomIndex = Math.floor(Math.random() * BOT_PHRASES.length);
      setBotPhrase(BOT_PHRASES[randomIndex]);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleToggleBot = () => {
    const newValue = !showBot;
    setShowBot(newValue);
    localStorage.setItem('hide_3dcheck_bot', (!newValue).toString());
    if (newValue && !botPhrase) {
      const randomIndex = Math.floor(Math.random() * BOT_PHRASES.length);
      setBotPhrase(BOT_PHRASES[randomIndex]);
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallBtn(false);
    setDeferredPrompt(null);
  };

  useEffect(() => {
    if (!profile) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        let startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        if (timeFilter === 'semana') startDate.setDate(startDate.getDate() - 7);
        else if (timeFilter === 'mes') startDate.setDate(1);
        else if (timeFilter === 'todos') startDate = new Date('2020-01-01');

        const { data: orders, error } = await supabase
          .from('orders')
          .select('*, products(name)')
          .eq('user_id', profile.id)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true });

        if (error) throw error;

        const dailyData: Record<string, { rev: number, cst: number }> = {};
        const productMap: Record<string, { count: number, revenue: number }> = {};
        
        const newStats = orders.reduce((acc, order: any) => {
          acc.total++;
          const dateKey = new Date(order.created_at).toLocaleDateString();
          if (!dailyData[dateKey]) dailyData[dateKey] = { rev: 0, cst: 0 };

          if (['Aguardando contato', 'Confirmado', 'Pendente'].includes(order.status)) acc.newOrders++;
          else if (['Preparação', 'Imprimindo', 'Em Andamento'].includes(order.status)) acc.inProgress++;
          else if (['Pronto', 'Aguardando Retirada'].includes(order.status)) acc.ready++;
          else if (['Enviado', 'Concluído'].includes(order.status)) acc.completed++;
          
          const rev = Number(order.final_price) || 0;
          const cst = Number(order.cost_total) || 0;
          
          acc.revenue += rev;
          acc.cost += cst;
          dailyData[dateKey].rev += rev;
          dailyData[dateKey].cst += cst;

          const pName = (Array.isArray(order.products) ? order.products[0]?.name : order.products?.name) 
                        || order.description?.split('\n')[0].substring(0, 30) 
                        || 'Item Personalizado';
          
          if (!productMap[pName]) productMap[pName] = { count: 0, revenue: 0 };
          productMap[pName].count += 1;
          productMap[pName].revenue += rev;
          
          return acc;
        }, { total: 0, newOrders: 0, inProgress: 0, ready: 0, completed: 0, revenue: 0, cost: 0, profit: 0, trends: { revenue: [], cost: [], profit: [] }, topProducts: [] } as OrderContext);

        const sortedDates = Object.keys(dailyData);
        newStats.trends.revenue = sortedDates.map(d => dailyData[d].rev);
        newStats.trends.cost = sortedDates.map(d => dailyData[d].cst);
        newStats.trends.profit = sortedDates.map(d => dailyData[d].rev - dailyData[d].cst);
        newStats.profit = newStats.revenue - newStats.cost;

        const allProducts = Object.keys(productMap).map(k => ({
          name: k,
          count: productMap[k].count,
          revenue: productMap[k].revenue,
          percentage: (productMap[k].revenue / (newStats.revenue || 1)) * 100
        }));
        
        newStats.topProducts = allProducts.sort((a, b) => b.count - a.count).slice(0, 3);
        setStats(newStats);

      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    fetchStats();
  }, [profile, timeFilter]);

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-10 pb-10">
      
      {/* #3DCHECK BOT COMPONENT */}
      <AnimatePresence mode="wait">
        {showBot && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95 }} 
            className="relative p-6 rounded-[2.5rem] bg-gradient-to-br from-blue-600/10 to-blue-600/5 border border-blue-500/20 shadow-xl overflow-hidden"
          >
            {/* BOTÃO FECHAR SEMPRE VISÍVEL PARA MOBILE/PC */}
            <div className="absolute top-2 right-2 p-2 z-20">
              <button 
                onClick={handleToggleBot}
                className="p-3 rounded-full hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-all active:scale-90"
                title="Desativar dicas do Bot"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-start gap-5 relative z-10">
              <motion.div 
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0"
              >
                <Bot className="text-white w-8 h-8" />
              </motion.div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-blue-500 uppercase text-[10px] tracking-[0.2em] italic">#3DCheck Bot</h3>
                  <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                </div>
                {/* TEXTO COM COR CORRIGIDA PARA MODO CLARO/ESCURO */}
                <p className="text-sm md:text-base text-zinc-800 dark:text-zinc-200 font-bold leading-relaxed italic pr-10">
                  "{botPhrase}"
                </p>
                <div className="flex items-center gap-1.5 pt-1">
                   <div className="h-1 w-1 bg-emerald-500 rounded-full animate-pulse" />
                   <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest italic">Analisando sua gestão...</span>
                </div>
              </div>
            </div>
            
            {/* Elemento Decorativo */}
            <div className="absolute -bottom-6 -right-6 h-24 w-24 bg-blue-600/5 rounded-full blur-3xl" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInstallBtn && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="p-4 rounded-[2rem] bg-blue-600/10 border border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20"><Smartphone className="text-white w-6 h-6" /></div>
              <div>
                <h3 className="font-black text-zinc-100 uppercase text-xs tracking-widest">App 3DCheck</h3>
                <p className="text-sm text-zinc-400">Instale para gerenciar seus pedidos com um toque.</p>
              </div>
            </div>
            <Button asChild onClick={handleInstallClick}>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl px-6 h-11 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center">
                <Download className="w-4 h-4 mr-2" /> INSTALAR AGORA
              </motion.button>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-[0.2em]">
              <LayoutDashboard className="w-4 h-4" />Visão Geral
            </div>
            {/* BOTÃO TOGGLE DO BOT NO DASHBOARD */}
            <button 
              onClick={handleToggleBot}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all active:scale-95 ${showBot ? 'bg-blue-500/10 border-blue-500/30 text-blue-600' : 'bg-muted border-border text-muted-foreground'}`}
            >
              {showBot ? <Bot className="w-3 h-3" /> : <MessageSquareOff className="w-3 h-3" />}
              <span className="text-[9px] font-black uppercase tracking-tighter">{showBot ? 'BOT ON' : 'BOT OFF'}</span>
            </button>
          </div>
          <h2 className="text-4xl font-black tracking-tight text-foreground">Olá, {storeDisplayName} <span className="text-blue-500">.</span></h2>
          <p className="text-muted-foreground font-medium max-w-xl">Acompanhe sua produção 3D e o resumo financeiro.</p>
        </div>
        <div className="flex items-center bg-muted/50 p-1.5 rounded-2xl border border-border overflow-x-auto hide-scrollbar">
            {(['hoje', 'semana', 'mes', 'todos'] as const).map((filter) => (
             <Button key={filter} variant="ghost" onClick={() => setTimeFilter(filter)} className={`h-9 px-4 rounded-xl text-xs font-bold transition-all relative ${timeFilter === filter ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
               {timeFilter === filter && <motion.div layoutId="activeFilter" className="absolute inset-0 bg-background shadow-sm rounded-xl" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
               <span className="relative z-10 capitalize">{filter === 'mes' ? 'Mês' : filter === 'semana' ? 'Semana' : filter === 'todos' ? 'Total' : 'Hoje'}</span>
             </Button>
            ))}
        </div>
      </motion.div>

      {/* FINANCEIRO */}
      <motion.div variants={containerVariants} className="grid gap-6 md:grid-cols-3">
        {[
          { id: 'rev', label: 'Faturado', val: stats.revenue, trend: stats.trends.revenue, color: '#3b82f6', textClass: 'text-blue-500' },
          { id: 'cst', label: 'Custos', val: stats.cost, trend: stats.trends.cost, color: '#ef4444', textClass: 'text-red-500' },
          { id: 'prf', label: 'Lucro Líquido', val: stats.profit, trend: stats.trends.profit, color: '#10b981', textClass: 'text-emerald-500', isZap: true }
        ].map((m, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card className="relative overflow-visible border border-border bg-card/50 backdrop-blur-sm group transition-all duration-300 hover:border-blue-500/30">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{m.label}</span>
                  <MiniBarChart data={m.trend} color={m.color} />
                </div>
                <div className={`text-4xl font-black tracking-tighter ${m.textClass}`}>
                  {loading ? '...' : `R$ ${m.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-muted-foreground text-[10px] font-black uppercase tracking-wider">
                  {m.isZap && <Zap className="w-3 h-3 text-emerald-500 fill-current" />} Performance Máxima
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* TOP PRODUTOS */}
      {stats.topProducts.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-4">
           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" /> Produtos Mais Vendidos
          </h3>
          <Card className="border-border bg-card/30 overflow-hidden">
            <CardContent className="p-6 md:p-8 space-y-6">
              {stats.topProducts.map((product, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-muted p-2 rounded-lg"><Trophy className={`w-4 h-4 ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : 'text-amber-700'}`} /></div>
                      <span className="font-bold text-sm truncate max-w-[200px] md:max-w-xs">{product.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-sm">{product.count} un.</p>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">R$ {product.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${product.percentage}%` }} transition={{ duration: 1 }} className="h-full bg-blue-500 rounded-full" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* AÇÕES RÁPIDAS COM REDIRECIONAMENTO POR STATUS */}
      {(stats.newOrders > 0 || stats.ready > 0) && (
        <motion.div variants={itemVariants} className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 flex items-center gap-2">
            <ListChecks className="w-4 h-4" /> Próximas Ações
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {stats.newOrders > 0 && (
              <div onClick={() => navigate('/app/orders?status=Aguardando contato')} className="flex items-center justify-between p-5 bg-blue-500/5 border border-blue-500/20 rounded-3xl group hover:bg-blue-500/10 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-600/20"><Clock className="w-5 h-5" /></div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-tight">{stats.newOrders} novos pedidos</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black">Abrir para Confirmar</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
              </div>
            )}
            {stats.ready > 0 && (
              <div onClick={() => navigate('/app/orders?status=Pronto')} className="flex items-center justify-between p-5 bg-emerald-600/5 border border-emerald-600/20 rounded-3xl group hover:bg-emerald-600/10 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-600/20"><CheckCircle2 className="w-5 h-5" /></div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-tight">{stats.ready} peças prontas</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black">Abrir para Entregar</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* FLUXO DE PRODUÇÃO COM REDIRECIONAMENTO POR STATUS */}
      <motion.div variants={itemVariants} className="space-y-6">
        <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
          Fluxo de Produção <div className="h-[1px] flex-1 bg-border" />
          <span className="text-[10px] uppercase font-black text-muted-foreground bg-muted px-2 py-1 rounded flex items-center gap-1"><Calendar className="w-3 h-3" /> {timeFilter}</span>
        </h3>
        <motion.div variants={containerVariants} className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total', val: stats.total, icon: Package, color: 'muted', status: '' },
            { label: 'Novos', val: stats.newOrders, icon: Clock, color: 'blue', status: 'Aguardando contato' },
            { label: 'Em Produção', val: stats.inProgress, icon: PackageSearch, color: 'amber', status: 'Preparação' }, 
            { label: 'Prontos', val: stats.ready, icon: CheckCircle2, color: 'emerald', status: 'Pronto' }
          ].map((item, i) => (
            <motion.div key={i} variants={itemVariants} whileHover={{ y: -5 }}>
              <Card 
                onClick={() => navigate(`/app/orders?status=${item.status}`)}
                className="cursor-pointer border-border bg-card/30 transition-all duration-200 hover:bg-card/50"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <item.icon className={`w-5 h-5 ${item.color === 'muted' ? 'text-muted-foreground/30' : `text-${item.color}-500/50`}`} />
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground hidden sm:block">{item.label}</span>
                  </div>
                  <div className={`text-2xl sm:text-3xl font-black ${item.color !== 'muted' ? `text-${item.color}-600 dark:text-${item.color}-400` : ''}`}>
                    {loading ? '-' : item.val}
                  </div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1 sm:hidden">{item.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
