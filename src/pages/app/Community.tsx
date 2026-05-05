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
  Eye, Trash2, Clock, Flame, TrendingUp, Bot, MessageSquare, Send
} from 'lucide-react';

const botMessages = [
  "Nivelou a mesa hoje, mestre?",
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
  "Bora subir o nível dessa comunidade com seus STLs!",
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
  "Bora dominar o mundo (uma camada de cada vez)."
];

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
  
  // Post & Fórum Aberto
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

  // Carrega comentários do POST
  useEffect(() => {
    if (selectedPost) {
      communityService.getComments(selectedPost.id).then(data => setComments(data));
    }
  }, [selectedPost]);

  // Carrega comentários da DÚVIDA
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

  // Enviar comentário (Post ou Dúvida)
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
      toast.error("Erro ao enviar.");
    }
  };

  const handleCreateDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !title || !description) return toast.error("Preencha tudo!");
    try {
      setIsUploading(true);
      await communityService.createDoubt(profile.id, title, description);
      toast.success("Dúvida publicada!");
      setIsDoubtModalOpen(false);
      setTitle(''); setDescription('');
      loadData();
    } catch (e) {
      toast.error("Erro ao criar dúvida.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !title || !stlFile || mediaFiles.length === 0) return toast.error("Preencha título, STL e fotos!");
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
      const filesArray = Array.from(e.target.files).slice(0, 5);
      setMediaFiles(filesArray);
      setMediaPreviews(filesArray.map(f => URL.createObjectURL(f)));
    }
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
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="w-full h-full p-4 md:p-8 space-y-6 pb-32">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-foreground flex items-center gap-3">
            Datalake <span className="text-blue-500">Makers</span>
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
              <Button variant="ghost" size="icon" onClick={toggleBot} className="absolute top-2 right-2 z-20 text-muted-foreground hover:text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-4 h-4" />
              </Button>
              <div className="absolute right-0 top-0 opacity-[0.03] transform translate-x-4 -translate-y-4 pointer-events-none">
                <Bot className="w-48 h-48" />
              </div>
              <CardContent className="p-5 md:p-6 flex items-center gap-5 relative z-10">
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

      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-card p-2 rounded-2xl border border-border shadow-sm">
        <div className="flex gap-2 w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0">
          <button onClick={() => setActiveTab('feed')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all ${activeTab === 'feed' ? 'bg-muted text-blue-500' : 'text-muted-foreground hover:bg-muted/50'}`}>
            <Box className="w-4 h-4" /> Modelos
          </button>
          <button onClick={() => setActiveTab('doubts')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all ${activeTab === 'doubts' ? 'bg-muted text-blue-500' : 'text-muted-foreground hover:bg-muted/50'}`}>
            <HelpCircle className="w-4 h-4" /> Fórum
          </button>
        </div>

        {activeTab === 'feed' && (
          <div className="flex gap-2 w-full xl:w-auto">
            <button onClick={() => setSortBy('views')} className={`flex items-center justify-center flex-1 xl:flex-none gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${sortBy === 'views' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'border-transparent text-muted-foreground hover:bg-muted'}`}>
              <TrendingUp className="w-3 h-3" /> Populares
            </button>
            <button onClick={() => setSortBy('likes')} className={`flex items-center justify-center flex-1 xl:flex-none gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${sortBy === 'likes' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'border-transparent text-muted-foreground hover:bg-muted'}`}>
              <Flame className="w-3 h-3" /> Curtidos
            </button>
            <button onClick={() => setSortBy('newest')} className={`flex items-center justify-center flex-1 xl:flex-none gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${sortBy === 'newest' ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' : 'border-transparent text-muted-foreground hover:bg-muted'}`}>
              <Clock className="w-3 h-3" /> Novos
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'feed' ? (
          <motion.div key={`feed-${sortBy}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5">
            {posts.map((post) => (
              <STLCard key={post.id} post={post} profileId={profile?.id} onLike={() => handleInteraction(post.id, true)} onDislike={() => handleInteraction(post.id, false)} onClick={() => handleOpenPost(post)} />
            ))}
          </motion.div>
        ) : (
          <motion.div key="forum" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {doubts.map((doubt) => (
              <DoubtItem key={doubt.id} doubt={doubt} onClick={() => handleOpenDoubt(doubt)} />
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
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-sm text-white font-black uppercase">
                    {selectedDoubt.profiles?.name?.charAt(0) || 'M'}
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase italic leading-tight">{selectedDoubt.title}</h3>
                    <p className="text-xs font-bold uppercase text-muted-foreground">@{selectedDoubt.profiles?.name}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedDoubt(null)} className="rounded-full"><X className="w-5 h-5" /></Button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{selectedDoubt.content}</p>
                <div className="border-t border-border/50 pt-4">
                  <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2 mb-4">
                    <MessageSquare className="w-4 h-4"/> Respostas ({comments.length})
                  </h4>
                  <div className="space-y-4">
                    {comments.map((c) => (
                      <div key={c.id} className="bg-muted/40 p-4 rounded-2xl">
                        <p className="text-[10px] font-black uppercase text-blue-500 mb-1">@{c.profiles?.name}</p>
                        <p className="text-sm text-foreground/90">{c.content}</p>
                      </div>
                    ))}
                    {comments.length === 0 && <p className="text-sm text-muted-foreground italic">Ninguém respondeu ainda. Salve o dia!</p>}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-border/50 bg-card/90 flex flex-col gap-3">
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

      {/* MODAL DE DETALHES DO POST (NOVO DESIGN PREMIUM) */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6 pl-0 md:pl-64">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedPost(null)} className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-6xl bg-card border border-border/50 rounded-[2rem] shadow-2xl z-10 flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
              
              <Button variant="ghost" size="icon" onClick={() => setSelectedPost(null)} className="absolute top-4 right-4 z-20 bg-background/50 hover:bg-background/80 text-foreground rounded-full backdrop-blur-md transition-colors border border-border/50 shadow-sm">
                <X className="w-5 h-5" />
              </Button>

              {/* Lado Esquerdo - Imagem (Dark Theme Vibe) */}
              <div className="w-full md:w-3/5 bg-muted/30 flex flex-col relative h-[40vh] md:h-auto border-r border-border/50">
                <div className="flex-1 w-full h-full p-4 flex items-center justify-center">
                   <img src={selectedPost.post_media?.[activeImageIndex]?.media_url} className="max-w-full max-h-full object-contain drop-shadow-xl" alt="Preview" />
                </div>
                {selectedPost.post_media?.length > 1 && (
                  <div className="flex gap-2 p-4 overflow-x-auto bg-background/50 backdrop-blur-sm">
                    {selectedPost.post_media.map((media: any, index: number) => (
                      <button key={media.id} onClick={() => setActiveImageIndex(index)} className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${index === activeImageIndex ? 'border-blue-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                        <img src={media.media_url} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Lado Direito - Informações Premium */}
              <div className="w-full md:w-2/5 flex flex-col bg-background h-[50vh] md:h-auto relative">
                <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6 pb-32">
                  
                  {/* Cabeçalho do Autor */}
                  <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-lg text-white font-black uppercase shadow-inner">
                      {selectedPost.profiles?.name?.charAt(0) || 'M'}
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase text-foreground">@{selectedPost.profiles?.name || 'Maker'}</p>
                      <p className="text-xs text-muted-foreground font-medium">{new Date(selectedPost.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Título e Stats */}
                  <div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-tight mb-4">{selectedPost.title}</h2>
                    <div className="flex items-center gap-4 text-sm font-black text-muted-foreground uppercase">
                      <span className="flex items-center gap-1"><Eye className="w-4 h-4 text-blue-500" /> {selectedPost.views_count || 0}</span>
                      
                      {/* Botões de Like Integrados (Pequenos e elegantes) */}
                      <div className="flex gap-1 bg-muted/50 p-1 rounded-full border border-border/50">
                        <button onClick={() => handleInteraction(selectedPost.id, true)} className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${isLiked ? 'bg-blue-500 text-white' : 'hover:bg-blue-500/10'}`}>
                          <ThumbsUp className="w-3 h-3" /> {selectedPost.like_count || 0}
                        </button>
                        <button onClick={() => handleInteraction(selectedPost.id, false)} className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${isDisliked ? 'bg-red-500 text-white' : 'hover:bg-red-500/10'}`}>
                          <ThumbsDown className="w-3 h-3" /> {selectedPost.dislike_count || 0}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Descrição */}
                  <div className="space-y-2">
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{selectedPost.description || 'Nenhuma descrição fornecida.'}</p>
                  </div>

                  {/* Sessão de Comentários Elegante */}
                  <div className="space-y-4 pt-6 border-t border-border/50">
                    <h4 className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-500"/> Comentários ({comments.length})
                    </h4>
                    <div className="space-y-4">
                      {comments.map((c) => (
                        <div key={c.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-black uppercase flex-shrink-0">
                            {c.profiles?.name?.charAt(0)}
                          </div>
                          <div className="bg-muted/30 px-4 py-3 rounded-2xl rounded-tl-sm flex-1 border border-border/30">
                            <p className="text-[10px] font-black uppercase text-blue-500 mb-1">@{c.profiles?.name}</p>
                            <p className="text-sm text-foreground/90">{c.content}</p>
                          </div>
                        </div>
                      ))}
                      {comments.length === 0 && <p className="text-xs text-muted-foreground italic text-center py-4">Sem comentários ainda.</p>}
                    </div>
                  </div>
                </div>

                {/* Rodapé Fixo (Input estilo Chat e Botão Download) */}
                <div className="absolute bottom-0 w-full bg-background/95 backdrop-blur-md p-4 border-t border-border/50 flex flex-col gap-3">
                  <form onSubmit={handleAddComment} className="relative flex items-center">
                    <Input placeholder="Adicionar comentário..." value={newComment} onChange={e => setNewComment(e.target.value)} className="pr-12 rounded-full h-12 bg-muted/50 border-transparent focus-visible:ring-blue-500" />
                    <Button type="submit" size="icon" variant="ghost" className="absolute right-1 text-blue-500 hover:text-blue-600 hover:bg-transparent rounded-full">
                      <Send className="w-5 h-5" />
                    </Button>
                  </form>
                  <div className="flex gap-2">
                    <Button className="flex-1 h-12 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase italic rounded-full text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95" onClick={() => window.open(selectedPost.stl_url, '_blank')}>
                      <Download className="w-4 h-4 mr-2" /> Baixar Modelo STL
                    </Button>
                    {(profile?.id === selectedPost.user_id || isAdmin) && (
                      <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full text-muted-foreground hover:bg-red-500 hover:text-white border border-transparent hover:border-red-500 transition-colors" onClick={() => handleDeletePost(selectedPost.id)}>
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE UPLOAD DE STL */}
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
                  <div className="space-y-2">
                    <div className="relative border-2 border-dashed border-border hover:border-blue-500/50 rounded-2xl p-6 text-center transition-colors bg-muted/10 group">
                      <input type="file" accept="image/*,video/*" multiple required disabled={isUploading} onChange={handleMediaSelection} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <ImageIcon className={`w-6 h-6 mx-auto mb-2 ${mediaFiles.length ? 'text-blue-500' : 'text-muted-foreground'}`} />
                      <p className="text-xs font-bold px-2">{mediaFiles.length ? `${mediaFiles.length} mídia(s)` : 'Fotos (Até 5)'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="relative border-2 border-dashed border-border hover:border-blue-500/50 rounded-2xl p-6 text-center transition-colors bg-muted/10 group h-full flex flex-col justify-center">
                      <input type="file" accept=".stl,.obj" required disabled={isUploading} onChange={(e) => setStlFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <FileBox className={`w-6 h-6 mx-auto mb-2 ${stlFile ? 'text-blue-500' : 'text-muted-foreground'}`} />
                      <p className="text-xs font-bold truncate px-2">{stlFile ? stlFile.name : 'Arquivo 3D (.STL)'}</p>
                    </div>
                  </div>
                </div>
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

function STLCard({ post, onClick, onLike, onDislike, profileId }: any) {
  const mainImage = post.post_media?.[0]?.media_url || 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2070';
  const myInt = post.post_interactions?.find((i:any) => i.user_id === profileId);
  const isLiked = myInt?.is_like === true;
  const isDisliked = myInt?.is_like === false;

  return (
    <Card className="group bg-card border-border overflow-hidden rounded-2xl hover:border-blue-500/50 transition-all shadow-sm hover:shadow-xl hover:shadow-blue-500/10 flex flex-col">
      <div className="aspect-square relative overflow-hidden bg-muted cursor-pointer" onClick={onClick}>
        <img src={mainImage} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={post.title} />
      </div>
      <CardContent className="p-3 md:p-4 flex flex-col justify-between flex-1 space-y-2">
        <h4 className="font-black text-xs md:text-sm uppercase italic tracking-tighter line-clamp-2 leading-tight cursor-pointer hover:text-blue-500 transition-colors" onClick={onClick}>{post.title}</h4>
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <span className="text-[9px] md:text-[10px] font-bold uppercase text-muted-foreground truncate max-w-[50%]">@{post.profiles?.name || 'Maker'}</span>
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

function DoubtItem({ doubt, onClick }: { doubt: any, onClick: () => void }) {
  return (
    <Card onClick={onClick} className="bg-card/50 border-border hover:border-blue-500/40 rounded-2xl overflow-hidden cursor-pointer transition-colors shadow-sm">
      <div className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <h5 className="font-black uppercase italic text-sm line-clamp-1">{doubt.title}</h5>
            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{doubt.content}</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </div>
    </Card>
  );
}
