import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { communityService } from '../../lib/communityService'; 
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Download, ThumbsUp, ThumbsDown, Plus, Search, Box, HelpCircle, Sparkles, 
  ChevronRight, X, UploadCloud, FileBox, ImageIcon, Loader2, 
  Eye, Trash2, Clock, Flame, TrendingUp, Bot, MessageSquare, Send, Heart
} from 'lucide-react';

const botMessages = [
  "Nivelou a mesa hoje, maker?",
  "Aderência perfeita na primeira camada é arte!",
  "Mostra pra gente o que está na sua mesa de impressão!",
  "STL novo? Compartilha aí!",
  "O filamento acabou no meio da impressão? Força guerreiro!",
  "Bambu Lab, Creality ou Anycubic? O que importa é imprimir!",
  "Apoio nunca é demais. Ou é?",
  "Z-hop salvando vidas (e peças) desde sempre.",
  "Qual a temperatura perfeita pro seu PLA?",
  "PETG é vida, mas que stringing chato, hein?",
  "Já calibrou o fluxo hoje?",
  "Imprimiu algo útil hoje ou só bonecos? (Julgamos não!)",
  "Que a sua primeira camada seja sempre lisa como vidro.",
  "Bora compartilhar conhecimento e arquivos 3D!",
  "Nada como o cheirinho de filamento derretido de manhã.",
  "Warping é o terror, mas a gente sempre vence.",
  "Posta aquele modelo que você modelou e tem orgulho!",
  "Mais um dia, mais uma impressão.",
  "Qual o seu fatiador favorito? Conta pra gente!",
  "Infill de 20% ou de 100%? Depende da raiva.",
  "Ajude a comunidade dando like nos projetos incríveis!",
  "Ficou em dúvida? Pergunta ali no Fórum!",
  "Uma comunidade forte se faz com compartilhamento.",
  "Suportes em árvore são maravilhosos, concorda?",
  "Bico entupido de novo? A gente te entende.",
  "Resina ou FDM? A batalha continua.",
  "Secou o filamento antes de usar? Fica a dica!",
  "Mostre sua mais nova invenção em 3D!",
  "Erro no G-Code? Reinicia que vai (mentira, não vai).",
  "Nada de desistir daquela impressão de 48 horas!",
  "Quem nunca esqueceu de gerar suporte que atire a primeira pedra.",
  "Sua impressora está pedindo manutenção, não finja que não viu.",
  "Imprimindo upgrades para a própria impressora? Clássico.",
  "Dê feedback nos projetos da galera, isso motiva muito!",
  "Aquele momento de tensão quando a peça não desgruda da mesa...",
  "Qual a cor de filamento que mais sai por aí?",
  "Um bom design resolve metade dos problemas de impressão.",
  "Bora subir o nível do Hub Maker com seus STLs!",
  "Velocidade ou Qualidade? Eis a questão.",
  "Já lubrificou os eixos Z hoje?",
  "Peça soltou da mesa nas últimas 10 camadas? Trágico.",
  "Compartilhe seus perfis de fatiamento com quem precisa!",
  "A magia do 3D: Do software para o mundo real.",
  "Nenhum modelo é simples demais para ser compartilhado.",
  "Iniciante ou Veterano, todo maker tem seu espaço aqui.",
  "Brim, Skirt ou Raft? Escolha sua arma.",
  "Quebrou a peça tirando o suporte? Super bonder resolve.",
  "Aquele barulhinho da impressora trabalhando acalma a alma.",
  "Seu projeto pode ajudar outro maker, poste aí!",
  "Bora dominar o mundo (uma camada de cada vez).",
  "Cola bastão ou spray fixador? Qual o seu segredo?",
  "Mais um rolo de filamento comprado que não cabia no orçamento...",
  "Imprimir em TPU é um teste de paciência, né?",
  "Já testou a magia do filamento Silk hoje?",
  "Não compre, imprima! (Mesmo que demore 3x mais tempo).",
  "Mesa de vidro ou PEI magnética? Façam suas apostas.",
  "Odor de ABS logo de manhã... Lembre-se da ventilação!",
  "Klipper ou Marlin? O que roda no coração da sua máquina?",
  "OrcaSlicer, Cura ou PrusaSlicer? Conta sua preferência!",
  "Quem nunca imprimiu um barquinho para testar a impressora?",
  "O temido monstro de espaguete atacou hoje?",
  "Retração calibrada é sinônimo de paz de espírito.",
  "Fusion 360, Blender ou Tinkercad? Como você cria sua magia?",
  "Aquela peça de 30 horas finalizada com sucesso... Ufa!",
  "Imprimindo com filamento que brilha no escuro? Mostra pra gente!",
  "A regra é clara: sempre verifique o G-code antes de dormir.",
  "Faltou luz no meio da impressão e não tinha no-break? A gente chora junto.",
  "Seu filamento está úmido? O estalo no bico não perdoa.",
  "Dúvida cruel: pintar a peça ou imprimir colorido?",
  "Um bom maker sempre limpa a mesa com álcool isopropílico.",
  "Ajustar o Z-offset é quase uma terapia.",
  "Já imprimiu algo útil para a casa hoje?",
  "Deixe um like naquele post que salvou sua vida!",
  "Suporte orgânico economiza tempo e material. Concorda?",
  "Quem nunca queimou o dedo no bloco aquecido não é maker de verdade.",
  "O segredo de um bom overhang é reza forte e ventilação.",
  "Imprimindo peças em lote? Haja coragem!",
  "Nada de jogar fora! Aquela peça com defeito vira teste de pintura.",
  "Filamento quebra-galho ou marca premium? O que você prefere?",
  "A primeira camada é a base de todo o sucesso (literalmente).",
  "Aquele 'crec' ao soltar a peça da mesa magnética é música para os ouvidos.",
  "Já limpou o bico entupido com agulha hoje?",
  "O que você está modelando de bom por aí?",
  "Um projeto falho é só mais uma oportunidade de aprender.",
  "Qual a velocidade máxima que sua impressora já alcançou?",
  "A arte de esconder as emendas (Z-seam) no fatiador.",
  "Camada de 0.12mm para miniaturas, ou 0.28mm pra terminar logo?",
  "Não julgue a peça pelo monstro de espaguete que ela deixou.",
  "A impressora está parada? Que heresia! Bota ela pra rodar!",
  "Quantos quilos de filamento você já transformou em arte?",
  "Seu design pode ser a solução para o problema de alguém.",
  "Bora trocar dicas de acabamento e lixamento no Fórum!",
  "Fez um time-lapse da impressão? Posta o vídeo aqui!",
  "A paciência é a virtude mais importante de um maker.",
  "Nada como a magia de ver a peça surgir do nada na mesa.",
  "Dizem que PLA não aguenta calor... Já testou num dia de sol?",
  "O botão de Like não gasta o seu mouse, valorize o trabalho da galera!",
  "Qual o seu truque para evitar pé de elefante (elephant foot)?",
  "Sextou! E a impressora vai virar a noite trabalhando.",
  "Uma impressora 3D é pouco, duas é bom, três é pouco espaço em casa!",
  "Impressão 3D: transformando rolos de plástico em felicidade."
];

// Helper para descobrir se é vídeo
const isVideo = (url: string) => {
  if (!url) return false;
  return !!url.match(/\.(mp4|webm|ogg|mov)(?:\?.*)?$/i);
};

export default function Community() {
  const { profile } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'feed' | 'doubts'>('feed');
  const [sortBy, setSortBy] = useState<'views' | 'likes' | 'newest'>('views');
  const [posts, setPosts] = useState<any[]>([]);
  const [doubts, setDoubts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showBot, setShowBot] = useState(localStorage.getItem('hide3DBot') !== 'true');
  const [botPhrase, setBotPhrase] = useState('');

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDoubtModalOpen, setIsDoubtModalOpen] = useState(false);
  
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [selectedDoubt, setSelectedDoubt] = useState<any | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stlFile, setStlFile] = useState<File | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    setBotPhrase(botMessages[Math.floor(Math.random() * botMessages.length)]);
  }, []);

  const toggleBot = () => {
    const newValue = !showBot;
    setShowBot(newValue);
    localStorage.setItem('hide3DBot', newValue ? 'false' : 'true');
  };

  const loadData = async () => {
    setLoading(true);
    const [postData, doubtData] = await Promise.all([
      communityService.getPosts(sortBy),
      communityService.getDoubts()
    ]);
    setPosts(postData || []);
    setDoubts(doubtData || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [sortBy]);

  useEffect(() => {
    if (selectedPost) {
      communityService.getComments(selectedPost.id).then(data => setComments(data));
    }
  }, [selectedPost]);

  useEffect(() => {
    if (selectedDoubt) {
      communityService.getDoubtComments(selectedDoubt.id).then(data => setComments(data));
    }
  }, [selectedDoubt]);

  const handleInteraction = async (postId: string, isLikeAction: boolean) => {
    if (!profile) return toast.error("Faça login para interagir.");
    const postToUpdate = posts.find(p => p.id === postId);
    const myCurrentInteraction = postToUpdate?.post_interactions?.find((i: any) => i.user_id === profile.id);
    
    let newInteractionState: boolean | null = isLikeAction;
    if (myCurrentInteraction && myCurrentInteraction.is_like === isLikeAction) {
      newInteractionState = null; 
    }

    try {
      await communityService.interactWithPost(postId, profile.id, newInteractionState);
      loadData(); 
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost({...selectedPost, 
           like_count: newInteractionState === true ? (selectedPost.like_count + 1) : (myCurrentInteraction?.is_like === true ? selectedPost.like_count - 1 : selectedPost.like_count),
           dislike_count: newInteractionState === false ? (selectedPost.dislike_count + 1) : (myCurrentInteraction?.is_like === false ? selectedPost.dislike_count - 1 : selectedPost.dislike_count)
        });
      }
    } catch (e) {
      toast.error("Erro ao registrar interação.");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !newComment.trim()) return;
    
    try {
      if (selectedPost) {
        await communityService.addComment(selectedPost.id, profile.id, newComment);
        communityService.getComments(selectedPost.id).then(data => setComments(data));
      } else if (selectedDoubt) {
        await communityService.addDoubtComment(selectedDoubt.id, profile.id, newComment);
        communityService.getDoubtComments(selectedDoubt.id).then(data => setComments(data));
      }
      setNewComment('');
      toast.success("Enviado com sucesso!");
    } catch (error) {
      toast.error("Erro ao enviar. Verifique o banco.");
    }
  };

  const handleLikeComment = async (commentId: string, currentLikes: number) => {
    if (!profile) return;
    try {
      await communityService.likeComment(commentId, profile.id, currentLikes);
      if (selectedPost) communityService.getComments(selectedPost.id).then(data => setComments(data));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !title || !description) return toast.error("Preencha tudo!");
    try {
      setIsUploading(true);
      
      let finalContent = description;
      let attachments = { stl: null as string | null, media: [] as string[] };
      
      if (stlFile) {
        const stlExt = stlFile.name.split('.').pop();
        attachments.stl = await communityService.uploadFile('community_stls', stlFile, `${profile.id}/${Date.now()}_doubt.${stlExt}`);
      }
      
      if (mediaFiles.length > 0) {
        for (let i = 0; i < mediaFiles.length; i++) {
          const file = mediaFiles[i];
          const ext = file.name.split('.').pop();
          const url = await communityService.uploadFile('community_images', file, `${profile.id}/${Date.now()}_doubt_media_${i}.${ext}`);
          attachments.media.push(url);
        }
      }
      
      if (attachments.stl || attachments.media.length > 0) {
        finalContent += `|ATTACHMENTS|${JSON.stringify(attachments)}`;
      }

      await communityService.createDoubt(profile.id, title, finalContent);
      toast.success("Dúvida publicada!");
      setIsDoubtModalOpen(false);
      setTitle(''); setDescription(''); setStlFile(null); setMediaFiles([]); setMediaPreviews([]);
      loadData();
    } catch (e) {
      toast.error("Erro ao criar dúvida.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !title || !stlFile || mediaFiles.length === 0) return toast.error("Preencha título, STL e no mínimo 1 foto/vídeo!");
    try {
      setIsUploading(true);
      toast.info("Injetando modelo no servidor...");
      await communityService.createPost(profile.id, title, description, stlFile, mediaFiles);
      toast.success("Modelo publicado!");
      setIsUploadModalOpen(false);
      setTitle(''); setDescription(''); setStlFile(null); setMediaFiles([]); setMediaPreviews([]);
      loadData();
    } catch (error) {
      toast.error("Erro ao publicar modelo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleMediaSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const combinedFiles = [...mediaFiles, ...newFiles].slice(0, 5); // Limite de 5 arquivos
      setMediaFiles(combinedFiles);
      setMediaPreviews(combinedFiles.map(f => URL.createObjectURL(f)));
    }
  };

  const removeMedia = (indexToRemove: number) => {
    const updatedFiles = mediaFiles.filter((_, idx) => idx !== indexToRemove);
    setMediaFiles(updatedFiles);
    setMediaPreviews(updatedFiles.map(f => URL.createObjectURL(f)));
  };

  const handleOpenPost = async (post: any) => {
    setSelectedPost(post);
    setActiveImageIndex(0);
    setNewComment('');
    communityService.incrementViews(post.id, post.views_count || 0);
  };

  const handleOpenDoubt = (doubt: any) => {
    setSelectedDoubt(doubt);
    setNewComment('');
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Apagar este modelo permanentemente?")) return;
    try {
      await communityService.deletePost(postId);
      toast.success("Modelo apagado!");
      setSelectedPost(null);
      loadData();
    } catch (error) {
      toast.error("Erro ao apagar. Sem permissão.");
    }
  };

  const handleDeleteDoubt = async (doubtId: string) => {
    if (!confirm("Apagar esta dúvida permanentemente?")) return;
    try {
      await communityService.deleteDoubt(doubtId);
      toast.success("Dúvida apagada!");
      setSelectedDoubt(null);
      loadData();
    } catch (error) {
      toast.error("Erro ao apagar. Sem permissão.");
    }
  };

  const myInteraction = selectedPost?.post_interactions?.find((i: any) => i.user_id === profile?.id);
  const isLiked = myInteraction?.is_like === true;
  const isDisliked = myInteraction?.is_like === false;

  return (
    <div className="w-full h-full p-4 md:p-8 space-y-6 pb-32">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-foreground flex items-center gap-3">
            Hub <span className="text-blue-500">Maker</span>
            {!showBot && (
              <Button variant="outline" size="sm" onClick={toggleBot} className="ml-2 h-8 rounded-full text-xs font-black uppercase text-blue-500 border-blue-500/30 hover:bg-blue-500/10">
                <Bot className="w-3 h-3 mr-1" /> Ativar 3DBot
              </Button>
            )}
          </h2>
        </div>
        <Button onClick={() => activeTab === 'feed' ? setIsUploadModalOpen(true) : setIsDoubtModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl px-6 h-12 shadow-lg uppercase italic flex items-center gap-2 w-full md:w-auto">
          <Plus className="w-5 h-5" /> {activeTab === 'feed' ? 'Novo Modelo' : 'Nova Dúvida'}
        </Button>
      </header>

      <AnimatePresence>
        {showBot && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0, overflow: 'hidden' }}>
            <Card className="bg-card border border-border shadow-sm overflow-hidden relative rounded-3xl mb-6 group">
              <Button variant="ghost" size="icon" onClick={toggleBot} className="absolute top-2 right-2 z-20 text-muted-foreground hover:text-red-500 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-background/80 md:bg-transparent w-10 h-10 flex items-center justify-center shadow-sm md:shadow-none">
                <X className="w-5 h-5" />
              </Button>
              <div className="absolute right-0 top-0 opacity-[0.03] transform translate-x-4 -translate-y-4 pointer-events-none">
                <Bot className="w-48 h-48" />
              </div>
              <CardContent className="p-5 md:p-6 flex items-center gap-5 relative z-10 pr-12 md:pr-6">
                <div className="bg-blue-500/10 p-3 rounded-2xl flex-shrink-0 hidden sm:block border border-blue-500/20">
                  <Bot className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-black uppercase italic tracking-tighter text-foreground">Opa, Maker! Aqui é o 3DBot 🤖</h3>
                  <p className="font-semibold text-muted-foreground text-xs md:text-sm mt-1 max-w-3xl">"{botPhrase}"</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col bg-card p-3 rounded-2xl border border-border shadow-sm gap-4">
        
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Pesquisar modelos, fórum..." 
            className="pl-11 h-12 rounded-xl bg-muted/50 border-transparent focus-visible:ring-blue-500 font-medium w-full"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center w-full">
          <div className="flex flex-wrap gap-2 w-full xl:w-auto">
            <button onClick={() => setActiveTab('feed')} className={`flex-1 md:flex-none justify-center flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'feed' ? 'bg-muted text-blue-500' : 'text-muted-foreground hover:bg-muted/50'}`}>
              <Box className="w-4 h-4" /> Modelos
            </button>
            <button onClick={() => setActiveTab('doubts')} className={`flex-1 md:flex-none justify-center flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'doubts' ? 'bg-muted text-blue-500' : 'text-muted-foreground hover:bg-muted/50'}`}>
              <HelpCircle className="w-4 h-4" /> Fórum
            </button>
          </div>

          {activeTab === 'feed' && (
            <div className="flex flex-wrap gap-2 w-full xl:w-auto">
              <button onClick={() => setSortBy('views')} className={`flex items-center justify-center flex-1 md:flex-none gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border ${sortBy === 'views' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'border-transparent text-muted-foreground hover:bg-muted'}`}>
                <TrendingUp className="w-3 h-3" /> Populares
              </button>
              <button onClick={() => setSortBy('likes')} className={`flex items-center justify-center flex-1 md:flex-none gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border ${sortBy === 'likes' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'border-transparent text-muted-foreground hover:bg-muted'}`}>
                <Flame className="w-3 h-3" /> Curtidos
              </button>
              <button onClick={() => setSortBy('newest')} className={`flex items-center justify-center flex-1 md:flex-none gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border ${sortBy === 'newest' ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' : 'border-transparent text-muted-foreground hover:bg-muted'}`}>
                <Clock className="w-3 h-3" /> Novos
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'feed' ? (
          <motion.div key={`feed-${sortBy}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5">
            {posts
              .filter(post => post.title.toLowerCase().includes(searchTerm.toLowerCase()) || (post.description && post.description.toLowerCase().includes(searchTerm.toLowerCase())))
              .map((post) => (
              <STLCard key={post.id} post={post} profileId={profile?.id} onLike={() => handleInteraction(post.id, true)} onDislike={() => handleInteraction(post.id, false)} onClick={() => handleOpenPost(post)} />
            ))}
          </motion.div>
        ) : (
          <motion.div key="forum" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {doubts
              .filter(doubt => doubt.title.toLowerCase().includes(searchTerm.toLowerCase()) || doubt.content.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((doubt) => (
              <DoubtItem key={doubt.id} doubt={doubt} onClick={() => handleOpenDoubt(doubt)} isAdmin={isAdmin} currentUserId={profile?.id} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DO FÓRUM (CRIAR DÚVIDA) */}
      <AnimatePresence>
        {isDoubtModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pl-0 md:pl-64">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDoubtModalOpen(false)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl z-10">
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <h3 className="text-xl font-black uppercase italic tracking-tighter">Nova <span className="text-blue-500">Dúvida</span></h3>
                <Button variant="ghost" size="icon" onClick={() => setIsDoubtModalOpen(false)} className="rounded-full"><X className="w-5 h-5" /></Button>
              </div>
              <form onSubmit={handleCreateDoubt} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase">Tópico</label>
                  <Input required placeholder="Ex: Problema de stringing no PETG" className="h-12 rounded-xl" value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase">Explicação detalhada</label>
                  <textarea required placeholder="Detalhe sua impressora, temperatura..." className="w-full h-32 p-4 rounded-xl border border-border bg-background resize-none focus:ring-2 focus:ring-blue-500 outline-none" value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="relative border-2 border-dashed border-border hover:border-blue-500/50 rounded-2xl p-4 text-center transition-colors bg-muted/10 group">
                      <input type="file" accept="image/*,video/*" multiple disabled={isUploading || mediaFiles.length >= 5} onChange={handleMediaSelection} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
                      <ImageIcon className={`w-5 h-5 mx-auto mb-1 ${mediaFiles.length ? 'text-blue-500' : 'text-muted-foreground'}`} />
                      <p className="text-[10px] font-bold px-2">{mediaFiles.length ? `${mediaFiles.length}/5 selecionadas` : 'Fotos/Vídeos (Opcional)'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="relative border-2 border-dashed border-border hover:border-blue-500/50 rounded-2xl p-4 text-center transition-colors bg-muted/10 group h-full flex flex-col justify-center">
                      <input type="file" accept=".stl,.obj,.zip,.rar,.7z" disabled={isUploading} onChange={(e) => setStlFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <FileBox className={`w-5 h-5 mx-auto mb-1 ${stlFile ? 'text-blue-500' : 'text-muted-foreground'}`} />
                      <p className="text-[10px] font-bold truncate px-2">{stlFile ? stlFile.name : 'Arquivo (.STL, .ZIP)'}</p>
                    </div>
                  </div>
                </div>

                {mediaPreviews.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto py-2">
                    {mediaPreviews.map((src, i) => (
                      <div key={i} className="relative w-12 h-12 flex-shrink-0">
                         {isVideo(src) ? <video src={src} className="w-full h-full object-cover rounded-xl border border-border" /> : <img src={src} className="w-full h-full object-cover rounded-xl border border-border" />}
                         <button type="button" disabled={isUploading} onClick={() => removeMedia(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:scale-110 transition-transform"><X className="w-3 h-3"/></button>
                      </div>
                    ))}
                  </div>
                )}

                <Button type="submit" disabled={isUploading} className="w-full h-12 bg-blue-600 text-white font-black uppercase italic rounded-xl">
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publicar no Fórum'}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE DÚVIDA (RESPONDER E VISUALIZAR) */}
      <AnimatePresence>
        {selectedDoubt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pl-0 md:pl-64">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedDoubt(null)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl z-10 flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <ProfileAvatar user={selectedDoubt.profiles} className="w-10 h-10" />
                  <div>
                    <h3 className="text-lg font-black uppercase italic leading-tight">{selectedDoubt.title}</h3>
                    <p className="text-xs font-bold uppercase text-muted-foreground">@{selectedDoubt.profiles?.name}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedDoubt(null)} className="rounded-full"><X className="w-5 h-5" /></Button>
              </div>
              
              {/* CONTEÚDO DA DÚVIDA COM ANEXOS */}
              {(() => {
                let doubtText = selectedDoubt.content || '';
                let doubtMedia: string[] = [];
                let doubtStl: string | null = null;
                
                if (doubtText.includes('|ATTACHMENTS|')) {
                  const parts = doubtText.split('|ATTACHMENTS|');
                  doubtText = parts[0];
                  try {
                    const parsed = JSON.parse(parts[1]);
                    doubtMedia = parsed.media || [];
                    doubtStl = parsed.stl || null;
                  } catch(e) {}
                }

                return (
                  <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{doubtText}</p>
                    
                    {doubtMedia.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {doubtMedia.map((url, i) => (
                          <div key={i} className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-xl overflow-hidden border border-border bg-black/50">
                            {isVideo(url) ? (
                              <video src={url} controls className="w-full h-full object-cover" />
                            ) : (
                              <img src={url} className="w-full h-full object-cover" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {doubtStl && (
                      <Button onClick={() => window.open(doubtStl, '_blank')} variant="outline" className="w-full h-12 border-blue-500/30 text-blue-500 hover:bg-blue-500/10 font-bold uppercase tracking-widest text-xs">
                        <Download className="w-4 h-4 mr-2" /> Baixar Anexo da Dúvida
                      </Button>
                    )}

                    <div className="border-t border-border/50 pt-4">
                      <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2 mb-4">
                        <MessageSquare className="w-4 h-4"/> Respostas ({comments.length})
                      </h4>
                      <div className="space-y-4">
                        {comments.map((c) => (
                          <div key={c.id} className="flex gap-3">
                            <ProfileAvatar user={c.profiles} className="w-8 h-8 flex-shrink-0" />
                            <div className="bg-muted/40 p-4 rounded-2xl rounded-tl-sm flex-1 border border-border/30">
                              <p className="text-[10px] font-black uppercase text-blue-500 mb-1">@{c.profiles?.name}</p>
                              <p className="text-sm text-foreground/90">{c.content}</p>
                            </div>
                          </div>
                        ))}
                        {comments.length === 0 && <p className="text-sm text-muted-foreground italic text-center py-4">Ninguém respondeu ainda. Salve o dia!</p>}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="p-3 md:p-4 border-t border-border/50 bg-card/90 flex flex-col gap-3">
                <form onSubmit={handleAddComment} className="relative flex items-center">
                  <Input placeholder="Escreva sua resposta..." value={newComment} onChange={e => setNewComment(e.target.value)} className="pr-12 rounded-full h-12 bg-muted/50 border-transparent focus-visible:ring-blue-500" />
                  <Button type="submit" size="icon" variant="ghost" className="absolute right-1 text-blue-500 hover:text-blue-600 hover:bg-transparent rounded-full">
                    <Send className="w-5 h-5" />
                  </Button>
                </form>
                {(profile?.id === selectedDoubt.user_id || isAdmin) && (
                  <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-500/10 text-xs font-bold uppercase w-fit mx-auto" onClick={() => handleDeleteDoubt(selectedDoubt.id)}>
                    <Trash2 className="w-3 h-3 mr-1" /> Apagar Tópico
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE DETALHES DO POST (DESIGN ADAPTADO PARA CELULAR) */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6 pl-0 md:pl-64">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedPost(null)} className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-6xl h-[92vh] md:h-[85vh] bg-card border border-border/50 rounded-[2rem] shadow-2xl z-10 flex flex-col md:flex-row overflow-hidden">
              
              <Button variant="ghost" size="icon" onClick={() => setSelectedPost(null)} className="absolute top-4 right-4 z-30 bg-background/50 hover:bg-background/80 text-foreground rounded-full backdrop-blur-md transition-colors border border-border/50 shadow-sm">
                <X className="w-5 h-5" />
              </Button>

              {/* Lado Esquerdo - Mídia em Destaque (Fixo na altura no celular) */}
              <div className="w-full md:w-3/5 bg-zinc-950 flex flex-col relative h-[35vh] md:h-full border-b md:border-b-0 md:border-r border-border/50 flex-shrink-0">
                <div className="flex-1 w-full h-full p-2 md:p-4 flex items-center justify-center overflow-hidden">
                   {isVideo(selectedPost.post_media?.[activeImageIndex]?.media_url) ? (
                     <video src={selectedPost.post_media?.[activeImageIndex]?.media_url} autoPlay loop muted playsInline className="max-w-full max-h-full object-contain drop-shadow-xl rounded-xl" />
                   ) : (
                     <img src={selectedPost.post_media?.[activeImageIndex]?.media_url} className="max-w-full max-h-full object-contain drop-shadow-xl" alt="Preview" />
                   )}
                </div>
                {selectedPost.post_media?.length > 1 && (
                  <div className="flex gap-2 p-3 md:p-4 overflow-x-auto bg-black/40 backdrop-blur-sm">
                    {selectedPost.post_media.map((media: any, index: number) => (
                      <button key={media.id} onClick={() => setActiveImageIndex(index)} className={`w-12 h-12 md:w-16 md:h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${index === activeImageIndex ? 'border-blue-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                        {isVideo(media.media_url) ? (
                          <video src={media.media_url} className="w-full h-full object-cover" />
                        ) : (
                          <img src={media.media_url} className="w-full h-full object-cover" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Lado Direito - Informações Roláveis no Celular */}
              <div className="w-full md:w-2/5 flex flex-col flex-1 md:h-full bg-background relative overflow-hidden">
                
                <div className="flex items-center gap-3 p-4 md:p-6 border-b border-border/50 bg-background/95 z-10 flex-shrink-0">
                  <ProfileAvatar user={selectedPost.profiles} className="w-10 h-10 md:w-12 md:h-12 shadow-sm" />
                  <div>
                    <h2 className="text-base md:text-lg font-black uppercase tracking-tighter leading-tight line-clamp-1">{selectedPost.title}</h2>
                    <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase">@{selectedPost.profiles?.name || 'Maker'}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-6">
                  <div className="space-y-4">
                    <p className="text-xs md:text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{selectedPost.description || 'Nenhuma descrição fornecida.'}</p>
                    
                    <div className="flex items-center gap-3 text-[10px] md:text-xs font-black text-muted-foreground uppercase pt-2 flex-wrap">
                      <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5 text-blue-500" /> {selectedPost.views_count || 0} views</span>
                      <span className="text-muted-foreground/30">•</span>
                      <span className="flex items-center gap-1"><Download className="w-3.5 h-3.5 text-emerald-500" /> {selectedPost.download_count || 0} down</span>
                      <span className="text-muted-foreground/30">•</span>
                      <span>{new Date(selectedPost.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border/50 space-y-4 pb-4">
                    <h4 className="text-[10px] md:text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-500"/> Comentários ({comments.length})
                    </h4>
                    <div className="space-y-4">
                      {comments.map((c) => (
                        <div key={c.id} className="flex gap-3">
                          <ProfileAvatar user={c.profiles} className="w-8 h-8 flex-shrink-0" />
                          <div className="flex-1 space-y-1">
                            <div className="bg-muted/30 px-4 py-3 rounded-2xl rounded-tl-sm border border-border/30">
                              <p className="text-[10px] font-black uppercase text-foreground mb-1">@{c.profiles?.name}</p>
                              <p className="text-xs md:text-sm text-foreground/90">{c.content}</p>
                            </div>
                            <button onClick={() => handleLikeComment(c.id, c.like_count || 0)} className="text-[10px] font-bold text-muted-foreground hover:text-red-500 flex items-center gap-1 ml-2 transition-colors">
                              <Heart className="w-3 h-3" /> Curtir {c.like_count > 0 && `(${c.like_count})`}
                            </button>
                          </div>
                        </div>
                      ))}
                      {comments.length === 0 && <p className="text-xs text-muted-foreground italic text-center py-8">Seja o primeiro a comentar neste modelo!</p>}
                    </div>
                  </div>
                </div>

                <div className="p-3 md:p-4 border-t border-border/50 bg-background/95 flex flex-col gap-2 md:gap-3 flex-shrink-0 z-20 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)]">
                  <div className="flex gap-2">
                    <Button onClick={() => handleInteraction(selectedPost.id, true)} className={`flex-1 h-10 rounded-xl font-black transition-colors ${isLiked ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-muted/50 text-foreground hover:bg-muted'}`}>
                      <ThumbsUp className="w-4 h-4 mr-2" /> {selectedPost.like_count || 0}
                    </Button>
                    <Button onClick={() => handleInteraction(selectedPost.id, false)} className={`flex-1 h-10 rounded-xl font-black transition-colors ${isDisliked ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-muted/50 text-foreground hover:bg-muted'}`}>
                      <ThumbsDown className="w-4 h-4 mr-2" /> {selectedPost.dislike_count || 0}
                    </Button>
                  </div>

                  <form onSubmit={handleAddComment} className="relative flex items-center">
                    <Input placeholder="Adicionar comentário..." value={newComment} onChange={e => setNewComment(e.target.value)} className="pr-12 rounded-full h-10 md:h-12 bg-muted/50 border-transparent focus-visible:ring-blue-500 text-xs md:text-sm" />
                    <Button type="submit" size="icon" variant="ghost" className="absolute right-1 text-blue-500 hover:text-blue-600 hover:bg-transparent rounded-full h-8 w-8 md:h-10 md:w-10">
                      <Send className="w-4 h-4 md:w-5 md:h-5" />
                    </Button>
                  </form>
                  
                  <div className="flex gap-2">
                    <Button className="flex-1 h-10 md:h-12 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase italic rounded-full text-xs md:text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95" onClick={() => { window.open(selectedPost.stl_url, '_blank'); communityService.incrementDownload(selectedPost.id, selectedPost.download_count || 0); }}>
                      <Download className="w-4 h-4 mr-2" /> Baixar Modelo
                    </Button>
                    {(profile?.id === selectedPost.user_id || isAdmin) && (
                      <Button variant="ghost" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-full text-muted-foreground hover:bg-red-500 hover:text-white border border-transparent hover:border-red-500 transition-colors" onClick={() => handleDeletePost(selectedPost.id)}>
                        <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                      </Button>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE UPLOAD DE STL E MÍDIAS (CRIAR POST) */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pl-0 md:pl-64">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isUploading && setIsUploadModalOpen(false)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-3xl shadow-2xl z-10 custom-scrollbar">
              <div className="sticky top-0 bg-card/90 backdrop-blur-md flex items-center justify-between p-6 border-b border-border/50 z-20">
                <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter">Novo <span className="text-blue-500">Post</span></h3>
                <Button disabled={isUploading} variant="ghost" size="icon" onClick={() => setIsUploadModalOpen(false)} className="rounded-full"><X className="w-5 h-5 text-muted-foreground" /></Button>
              </div>
              <form onSubmit={handleUploadSubmit} className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-muted-foreground ml-1">Título *</label>
                    <Input disabled={isUploading} required placeholder="Ex: Suporte Articulado" className="h-12 rounded-xl font-bold italic" value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-muted-foreground ml-1">Descrição</label>
                    <textarea disabled={isUploading} placeholder="Detalhes, material..." className="w-full min-h-[100px] p-4 rounded-xl font-medium border border-border bg-background resize-none focus:ring-2 focus:ring-blue-500 outline-none" value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* UPLOAD MÚLTIPLAS MÍDIAS */}
                  <div className="space-y-2">
                    <div className="relative border-2 border-dashed border-border hover:border-blue-500/50 rounded-2xl p-6 text-center transition-colors bg-muted/10 group">
                      <input type="file" accept="image/*,video/*" multiple required={mediaFiles.length === 0} disabled={isUploading || mediaFiles.length >= 5} onChange={handleMediaSelection} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
                      <ImageIcon className={`w-6 h-6 mx-auto mb-2 ${mediaFiles.length ? 'text-blue-500' : 'text-muted-foreground'}`} />
                      <p className="text-xs font-bold px-2">{mediaFiles.length ? `${mediaFiles.length}/5 selecionadas` : 'Fotos / Vídeos (Até 5)'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="relative border-2 border-dashed border-border hover:border-blue-500/50 rounded-2xl p-6 text-center transition-colors bg-muted/10 group h-full flex flex-col justify-center">
                      <input type="file" accept=".stl,.obj,.zip,.rar,.7z" required disabled={isUploading} onChange={(e) => setStlFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <FileBox className={`w-6 h-6 mx-auto mb-2 ${stlFile ? 'text-blue-500' : 'text-muted-foreground'}`} />
                      <p className="text-xs font-bold truncate px-2">{stlFile ? stlFile.name : 'Arquivo (.STL, .ZIP)'}</p>
                    </div>
                  </div>
                </div>

                {/* PREVIEWS NO FORMULÁRIO */}
                {mediaPreviews.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto py-2">
                    {mediaPreviews.map((src, i) => (
                      <div key={i} className="relative w-16 h-16 flex-shrink-0">
                         {isVideo(src) ? (
                           <video src={src} className="w-full h-full object-cover rounded-xl border border-border" />
                         ) : (
                           <img src={src} className="w-full h-full object-cover rounded-xl border border-border" />
                         )}
                         <button type="button" disabled={isUploading} onClick={() => removeMedia(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform">
                           <X className="w-3 h-3"/>
                         </button>
                      </div>
                    ))}
                  </div>
                )}

                <Button type="submit" disabled={isUploading} className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase italic rounded-xl text-sm">
                  {isUploading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <UploadCloud className="w-5 h-5 mr-2" />}
                  Publicar Modelo
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Subcomponente de Avatar
function ProfileAvatar({ user, className = '' }: { user: any, className?: string }) {
  if (user?.avatar_url) {
    return <img src={user.avatar_url} className={`rounded-full object-cover border border-border/50 ${className}`} alt={user.name} />;
  }
  return (
    <div className={`rounded-full bg-blue-500 flex items-center justify-center text-white font-black uppercase ${className}`}>
      {user?.name?.charAt(0) || 'M'}
    </div>
  );
}

// Card do Feed
function STLCard({ post, onClick, onLike, onDislike, profileId }: any) {
  const mainImage = post.post_media?.[0]?.media_url || 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2070';
  const myInt = post.post_interactions?.find((i:any) => i.user_id === profileId);
  const isLiked = myInt?.is_like === true;
  const isDisliked = myInt?.is_like === false;

  return (
    <Card className="group bg-card border-border overflow-hidden rounded-2xl hover:border-blue-500/50 transition-all shadow-sm hover:shadow-xl hover:shadow-blue-500/10 flex flex-col">
      <div className="aspect-square relative overflow-hidden bg-muted cursor-pointer" onClick={onClick}>
        {isVideo(mainImage) ? (
          <video src={mainImage} autoPlay loop muted playsInline className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <img src={mainImage} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={post.title} />
        )}
      </div>
      <CardContent className="p-3 md:p-4 flex flex-col justify-between flex-1 space-y-2">
        <h4 className="font-black text-xs md:text-sm uppercase italic tracking-tighter line-clamp-2 leading-tight cursor-pointer hover:text-blue-500 transition-colors" onClick={onClick}>{post.title}</h4>
        <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-auto">
          <div className="flex items-center gap-1.5 truncate max-w-[50%]">
            <ProfileAvatar user={post.profiles} className="w-4 h-4 text-[8px]" />
            <span className="text-[9px] md:text-[10px] font-bold uppercase text-muted-foreground truncate">@{post.profiles?.name || 'Maker'}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground">
            <button onClick={onLike} className={`flex items-center gap-0.5 hover:text-blue-500 transition-colors ${isLiked ? 'text-blue-500' : ''}`}>
              <ThumbsUp className="w-3 h-3" /> {post.like_count || 0}
            </button>
            <button onClick={onDislike} className={`flex items-center gap-0.5 hover:text-red-500 transition-colors ${isDisliked ? 'text-red-500' : ''}`}>
              <ThumbsDown className="w-3 h-3" /> {post.dislike_count || 0}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DoubtItem({ doubt, onClick, isAdmin, currentUserId }: any) {
  let doubtText = doubt.content || '';
  if (doubtText.includes('|ATTACHMENTS|')) {
    doubtText = doubtText.split('|ATTACHMENTS|')[0];
  }

  return (
    <Card onClick={onClick} className="bg-card/50 border-border hover:border-blue-500/40 rounded-2xl overflow-hidden cursor-pointer transition-colors shadow-sm">
      <div className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <ProfileAvatar user={doubt.profiles} className="w-8 h-8 flex-shrink-0 text-xs" />
          <div>
            <h5 className="font-black uppercase italic text-sm line-clamp-1">{doubt.title}</h5>
            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{doubtText}</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </div>
    </Card>
  );
}
