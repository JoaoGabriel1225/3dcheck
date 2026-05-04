import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { communityService } from '../../lib/communityService'; 
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Download, ThumbsUp, Plus, Search, Box, HelpCircle, Sparkles, 
  ChevronRight, X, UploadCloud, FileBox, ImageIcon, Loader2, 
  Eye, Trash2, Clock, Flame, TrendingUp
} from 'lucide-react';

export default function Community() {
  const { profile } = useAuth();
  
  // ESTADOS PRINCIPAIS
  const [activeTab, setActiveTab] = useState<'feed' | 'doubts'>('feed');
  const [sortBy, setSortBy] = useState<'newest' | 'likes' | 'views'>('newest');
  const [posts, setPosts] = useState<any[]>([]);
  const [doubts, setDoubts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // ESTADOS DOS MODAIS
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // ESTADOS DO FORMULÁRIO DE UPLOAD
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stlFile, setStlFile] = useState<File | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);

  // CARREGAR DADOS (AGORA COM FILTROS)
  const loadData = async () => {
    try {
      setLoading(true);
      const [postData, doubtData] = await Promise.all([
        communityService.getPosts(sortBy), // Passando o filtro para o serviço
        communityService.getDoubts()
      ]);
      setPosts(postData || []);
      setDoubts(doubtData || []);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao sincronizar com o banco.");
    } finally {
      setLoading(false);
    }
  };

  // Recarrega sempre que o filtro (sortBy) mudar
  useEffect(() => { loadData(); }, [sortBy]);

  // PREVIEW DE IMAGENS NO UPLOAD
  const handleMediaSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).slice(0, 5); // Limite de 5 arquivos
      setMediaFiles(filesArray);
      
      // Gera os links temporários para preview
      const previews = filesArray.map(file => URL.createObjectURL(file));
      setMediaPreviews(previews);
    }
  };

  // ENVIO DO POST
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return toast.error("Você precisa estar logado.");
    if (!title || !stlFile || mediaFiles.length === 0) return toast.error("Preencha o título e anexe o STL e pelo menos 1 foto!");

    try {
      setIsUploading(true);
      toast.info("Injetando modelo no servidor... Aguarde.");
      
      await communityService.createPost(profile.id, title, description, stlFile, mediaFiles);
      
      toast.success("Modelo publicado com sucesso!");
      setIsUploadModalOpen(false);
      
      // Resetar form
      setTitle(''); setDescription(''); setStlFile(null); setMediaFiles([]); setMediaPreviews([]);
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao publicar modelo.");
    } finally {
      setIsUploading(false);
    }
  };

  // ABRIR POST E CONTAR VISUALIZAÇÃO
  const handleOpenPost = async (post: any) => {
    setSelectedPost(post);
    setActiveImageIndex(0);
    // Incrementa no banco de dados sem travar a tela
    communityService.incrementViews(post.id, post.views_count || 0);
  };

  // EXCLUIR POST
  const handleDeletePost = async (postId: string) => {
    if (!confirm("Tem certeza que deseja apagar este modelo permanentemente?")) return;
    try {
      await communityService.deletePost(postId);
      toast.success("Modelo apagado!");
      setSelectedPost(null);
      loadData();
    } catch (error) {
      toast.error("Erro ao apagar modelo.");
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-6 pb-32">
      {/* HEADER PRINCIPAL */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-foreground">
                Datalake <span className="text-blue-500">Makers</span>
             </h2>
             <div className="bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full flex items-center gap-2">
               <Sparkles className="w-3 h-3 text-blue-500 fill-blue-500" />
               <span className="text-[10px] font-black uppercase text-blue-600">Ecossistema Vivo</span>
             </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium italic">Explore, baixe e compartilhe arquivos 3D com a comunidade.</p>
        </div>

        <Button 
          onClick={() => setIsUploadModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl px-6 h-12 shadow-lg shadow-blue-600/20 uppercase italic flex items-center gap-2 transition-all active:scale-95 w-full md:w-auto"
        >
          <Plus className="w-5 h-5" /> Novo Modelo
        </Button>
      </header>

      {/* BARRA DE CONTROLES (TABS E FILTROS) */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-card p-2 rounded-2xl border border-border shadow-sm">
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button onClick={() => setActiveTab('feed')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all ${activeTab === 'feed' ? 'bg-muted text-blue-500' : 'text-muted-foreground hover:bg-muted/50'}`}>
            <Box className="w-4 h-4" /> Modelos
          </button>
          <button onClick={() => setActiveTab('doubts')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all ${activeTab === 'doubts' ? 'bg-muted text-blue-500' : 'text-muted-foreground hover:bg-muted/50'}`}>
            <HelpCircle className="w-4 h-4" /> Fórum
          </button>
        </div>

        {activeTab === 'feed' && (
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={() => setSortBy('newest')} className={`flex items-center justify-center flex-1 md:flex-none gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${sortBy === 'newest' ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' : 'border-transparent text-muted-foreground hover:bg-muted'}`}>
              <Clock className="w-3 h-3" /> Recentes
            </button>
            <button onClick={() => setSortBy('likes')} className={`flex items-center justify-center flex-1 md:flex-none gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${sortBy === 'likes' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'border-transparent text-muted-foreground hover:bg-muted'}`}>
              <Flame className="w-3 h-3" /> Populares
            </button>
            <button onClick={() => setSortBy('views')} className={`flex items-center justify-center flex-1 md:flex-none gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${sortBy === 'views' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'border-transparent text-muted-foreground hover:bg-muted'}`}>
              <TrendingUp className="w-3 h-3" /> Mais Vistos
            </button>
          </div>
        )}
      </div>

      {/* FEED GRID COMPACTO */}
      <AnimatePresence mode="wait">
        {activeTab === 'feed' ? (
          <motion.div 
            key={`feed-${sortBy}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5"
          >
            {posts.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase())).map((post) => (
              <STLCard key={post.id} post={post} onClick={() => handleOpenPost(post)} />
            ))}
          </motion.div>
        ) : (
          <div className="space-y-3">
            {doubts.map((doubt) => (
              <DoubtItem key={doubt.id} doubt={doubt} />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE UPLOAD (Múltiplas Fotos + Previews) */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                    <textarea disabled={isUploading} placeholder="Detalhes, material, preenchimento..." className="w-full min-h-[100px] p-4 rounded-xl font-medium border border-border bg-background resize-none focus:ring-2 focus:ring-blue-500 outline-none" value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* FOTOS / VÍDEOS */}
                  <div className="space-y-2">
                    <div className="relative border-2 border-dashed border-border hover:border-blue-500/50 rounded-2xl p-6 text-center transition-colors bg-muted/10 group">
                      <input type="file" accept="image/*,video/*" multiple required disabled={isUploading} onChange={handleMediaSelection} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <ImageIcon className={`w-6 h-6 mx-auto mb-2 ${mediaFiles.length ? 'text-blue-500' : 'text-muted-foreground'}`} />
                      <p className="text-xs font-bold px-2">{mediaFiles.length ? `${mediaFiles.length} mídia(s) selecionada(s)` : 'Fotos do Projeto (Até 5)'}</p>
                    </div>
                    {/* Previews das Imagens */}
                    {mediaPreviews.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto py-2">
                        {mediaPreviews.map((src, i) => (
                          <img key={i} src={src} className="w-12 h-12 object-cover rounded-lg border border-border flex-shrink-0" alt={`preview-${i}`} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ARQUIVO STL */}
                  <div className="space-y-2">
                    <div className="relative border-2 border-dashed border-border hover:border-blue-500/50 rounded-2xl p-6 text-center transition-colors bg-muted/10 group h-full flex flex-col justify-center">
                      <input type="file" accept=".stl,.obj" required disabled={isUploading} onChange={(e) => setStlFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <FileBox className={`w-6 h-6 mx-auto mb-2 ${stlFile ? 'text-blue-500' : 'text-muted-foreground'}`} />
                      <p className="text-xs font-bold truncate px-2">{stlFile ? stlFile.name : 'Arquivo 3D (.STL)'}</p>
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={isUploading} className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase italic rounded-xl text-sm">
                  {isUploading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Injetando...</> : <><UploadCloud className="w-5 h-5 mr-2" /> Publicar</>}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE DETALHES DO POST (VISUALIZAÇÃO COMPLETA) */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedPost(null)} className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-5xl bg-card border border-border rounded-3xl shadow-2xl z-10 flex flex-col md:flex-row overflow-hidden max-h-[95vh]">
              
              {/* Botão Fechar Mobile/Desktop */}
              <Button variant="ghost" size="icon" onClick={() => setSelectedPost(null)} className="absolute top-4 right-4 z-20 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md">
                <X className="w-5 h-5" />
              </Button>

              {/* Lado Esquerdo: Galeria de Imagens */}
              <div className="w-full md:w-3/5 bg-zinc-950 flex flex-col relative h-[40vh] md:h-auto">
                <div className="flex-1 w-full h-full p-2 flex items-center justify-center">
                   <img 
                      src={selectedPost.post_media?.[activeImageIndex]?.media_url} 
                      className="w-full h-full object-contain rounded-xl" 
                      alt="Preview" 
                   />
                </div>
                {selectedPost.post_media?.length > 1 && (
                  <div className="flex gap-2 p-4 overflow-x-auto bg-black/40">
                    {selectedPost.post_media.map((media: any, index: number) => (
                      <button key={media.id} onClick={() => setActiveImageIndex(index)} className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${index === activeImageIndex ? 'border-blue-500 opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}>
                        <img src={media.media_url} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Lado Direito: Informações e Ações */}
              <div className="w-full md:w-2/5 p-6 md:p-8 flex flex-col overflow-y-auto custom-scrollbar">
                <div className="flex-1 space-y-6">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter leading-tight mb-2">{selectedPost.title}</h2>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white font-black uppercase">
                        {selectedPost.profiles?.name?.charAt(0) || 'M'}
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase text-blue-500 italic">@{selectedPost.profiles?.name || 'Maker'}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">{new Date(selectedPost.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status Bar */}
                  <div className="flex gap-4 p-4 bg-muted/30 rounded-2xl border border-border/50">
                     <div className="flex flex-col items-center flex-1">
                        <Eye className="w-4 h-4 text-muted-foreground mb-1" />
                        <span className="text-sm font-black">{selectedPost.views_count || 0}</span>
                     </div>
                     <div className="flex flex-col items-center flex-1 border-l border-border/50">
                        <ThumbsUp className="w-4 h-4 text-muted-foreground mb-1" />
                        <span className="text-sm font-black">{selectedPost.like_count || 0}</span>
                     </div>
                     <div className="flex flex-col items-center flex-1 border-l border-border/50">
                        <Download className="w-4 h-4 text-muted-foreground mb-1" />
                        <span className="text-sm font-black">{selectedPost.download_count || 0}</span>
                     </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase text-muted-foreground">Descrição do Projeto</h4>
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{selectedPost.description || 'Nenhuma descrição fornecida pelo autor.'}</p>
                  </div>
                </div>

                {/* Área de Botões (Download e Excluir se for dono) */}
                <div className="pt-8 space-y-3 mt-auto">
                  <Button className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase italic rounded-2xl text-lg shadow-xl shadow-blue-500/20 transition-all active:scale-95" onClick={() => window.open(selectedPost.stl_url, '_blank')}>
                    <Download className="w-5 h-5 mr-2" /> Baixar Arquivo STL
                  </Button>
                  
                  {/* BOTÃO DE EXCLUIR (Aparece só para o dono do post) */}
                  {profile?.id === selectedPost.user_id && (
                    <Button variant="destructive" className="w-full h-12 font-black uppercase italic rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20" onClick={() => handleDeletePost(selectedPost.id)}>
                      <Trash2 className="w-4 h-4 mr-2" /> Excluir Meu Post
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// COMPONENTE DO CARD COMPACTO (Para caber muitos na tela)
function STLCard({ post, onClick }: { post: any, onClick: () => void }) {
  const mainImage = post.post_media?.[0]?.media_url || 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2070';

  return (
    <Card onClick={onClick} className="group bg-card border-border overflow-hidden rounded-2xl hover:border-blue-500/50 transition-all shadow-md hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer flex flex-col">
      <div className="aspect-square relative overflow-hidden bg-muted">
        <img src={mainImage} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={post.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
           <span className="text-white text-xs font-black uppercase italic flex items-center gap-1">
             <Eye className="w-3 h-3" /> Ver Detalhes
           </span>
        </div>
      </div>
      
      <CardContent className="p-3 md:p-4 flex flex-col justify-between flex-1 space-y-2">
        <h4 className="font-black text-xs md:text-sm uppercase italic tracking-tighter line-clamp-2 leading-tight">{post.title}</h4>
        
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <span className="text-[9px] md:text-[10px] font-bold uppercase text-muted-foreground truncate max-w-[60%]">
            @{post.profiles?.name || 'Maker'}
          </span>
          <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-muted-foreground">
            <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {post.views_count || 0}</span>
            <span className="flex items-center gap-0.5"><ThumbsUp className="w-3 h-3" /> {post.like_count || 0}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DoubtItem({ doubt }: { doubt: any }) {
  return (
    <Card className="bg-card/50 border-border hover:border-blue-500/20 rounded-2xl overflow-hidden cursor-pointer">
      <div className="p-4 md:p-6 flex items-center justify-between gap-4">
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
