import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { communityService } from '../../lib/communityService'; 
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Share2, Download, ThumbsUp, MessageSquare, 
  Plus, Search, Box, HelpCircle, Sparkles, ChevronRight, X, UploadCloud, FileBox, ImageIcon, Loader2
} from 'lucide-react';

export default function Community() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'doubts'>('feed');
  const [posts, setPosts] = useState<any[]>([]);
  const [doubts, setDoubts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // ESTADOS DO MODAL E FORMULÁRIO
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stlFile, setStlFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [postData, doubtData] = await Promise.all([
        communityService.getPosts(),
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

  useEffect(() => { loadData(); }, []);

  // FUNÇÃO QUE RODA QUANDO CLICA EM ENVIAR
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return toast.error("Você precisa estar logado.");
    if (!title || !stlFile || !imageFile) return toast.error("Preencha o título e anexe os dois arquivos!");

    try {
      setIsUploading(true);
      toast.info("Fazendo upload dos arquivos... Aguarde.");
      
      await communityService.createPost(profile.id, title, description, stlFile, imageFile);
      
      toast.success("Modelo publicado com sucesso!");
      setIsModalOpen(false); // Fecha o modal
      
      // Limpa os campos
      setTitle('');
      setDescription('');
      setStlFile(null);
      setImageFile(null);
      
      loadData(); // Recarrega o feed para mostrar o post novo
    } catch (error) {
      console.error(error);
      toast.error("Erro ao publicar modelo. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 pb-32">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-foreground">
                STL's da <span className="text-blue-500">Comunidade</span>
             </h2>
             <div className="bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full flex items-center gap-2">
               <Sparkles className="w-3 h-3 text-blue-500 fill-blue-500" />
               <span className="text-[10px] font-black uppercase text-blue-600">Ecossistema Vivo</span>
             </div>
          </div>
          <p className="text-muted-foreground font-medium italic">Compartilhe arquivos e evolua com outros makers.</p>
        </div>

        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl px-6 h-12 shadow-lg shadow-blue-600/20 uppercase italic flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" /> Novo Post
        </Button>
      </header>

      <div className="flex bg-muted/50 p-1.5 rounded-2xl border border-border w-fit">
        <button 
          onClick={() => setActiveTab('feed')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'feed' ? 'bg-background shadow-sm text-blue-500' : 'text-muted-foreground'}`}
        >
          <Box className="w-4 h-4" /> Feed de Modelos
        </button>
        <button 
          onClick={() => setActiveTab('doubts')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'doubts' ? 'bg-background shadow-sm text-blue-500' : 'text-muted-foreground'}`}
        >
          <HelpCircle className="w-4 h-4" /> Central de Dúvidas
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar modelos STL..."
          className="pl-11 h-12 rounded-2xl bg-card border-border font-bold italic"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'feed' ? (
          <motion.div 
            key="feed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {posts.map((post) => (
              <STLCard key={post.id} post={post} />
            ))}
          </motion.div>
        ) : (
          <div className="space-y-4">
            {doubts.map((doubt) => (
              <DoubtItem key={doubt.id} doubt={doubt} />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE NOVO POST REFORMULADO */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isUploading && setIsModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-card border border-border rounded-[2rem] shadow-2xl overflow-hidden z-10"
            >
              <div className="flex items-center justify-between p-6 border-b border-border/50 bg-muted/20">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                  Compartilhar <span className="text-blue-500">Modelo</span>
                </h3>
                <Button disabled={isUploading} variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-full">
                  <X className="w-5 h-5 text-muted-foreground" />
                </Button>
              </div>
              
              <form onSubmit={handleUploadSubmit} className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-muted-foreground ml-1">Título do Modelo *</label>
                    <Input 
                      disabled={isUploading}
                      required
                      placeholder="Ex: Suporte de Fone Articulado"
                      className="h-12 rounded-xl font-bold italic bg-background"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-muted-foreground ml-1">Descrição (Opcional)</label>
                    <Input 
                      disabled={isUploading}
                      placeholder="Dicas de impressão, material recomendado..."
                      className="h-12 rounded-xl font-medium bg-background"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* UPLOAD DA IMAGEM */}
                  <div className="relative border-2 border-dashed border-border hover:border-blue-500/50 rounded-2xl p-6 text-center transition-colors bg-muted/10 group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      required
                      disabled={isUploading}
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                    />
                    <ImageIcon className={`w-8 h-8 mx-auto mb-3 transition-colors ${imageFile ? 'text-blue-500' : 'text-muted-foreground group-hover:text-blue-400'}`} />
                    <p className="text-sm font-bold truncate px-2">{imageFile ? imageFile.name : '1. Foto de Capa'}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">JPG, PNG ou WEBP</p>
                  </div>

                  {/* UPLOAD DO STL */}
                  <div className="relative border-2 border-dashed border-border hover:border-blue-500/50 rounded-2xl p-6 text-center transition-colors bg-muted/10 group">
                    <input 
                      type="file" 
                      accept=".stl,.obj" 
                      required
                      disabled={isUploading}
                      onChange={(e) => setStlFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                    />
                    <FileBox className={`w-8 h-8 mx-auto mb-3 transition-colors ${stlFile ? 'text-blue-500' : 'text-muted-foreground group-hover:text-blue-400'}`} />
                    <p className="text-sm font-bold truncate px-2">{stlFile ? stlFile.name : '2. Arquivo 3D'}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">Apenas .STL ou .OBJ</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <Button 
                    type="submit" 
                    disabled={isUploading}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase italic rounded-xl text-sm"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Injetando no Servidor...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-5 h-5 mr-2" />
                        Publicar Modelo
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function STLCard({ post }: { post: any }) {
  const mainImage = post.post_media?.[0]?.media_url || 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2070';

  return (
    <Card className="group bg-card border-border overflow-hidden rounded-[2.5rem] hover:border-blue-500/30 transition-all shadow-xl">
      <div className="aspect-square relative overflow-hidden">
        <img src={mainImage} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt={post.title} />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-6">
           <Button className="bg-white text-black hover:bg-white/90 font-black uppercase italic rounded-xl gap-2 h-11" onClick={() => window.open(post.stl_url, '_blank')}>
              <Download className="w-4 h-4" /> Baixar STL
           </Button>
        </div>
      </div>
      
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase text-blue-500 italic">@{post.profiles?.name || 'Maker'}</span>
          <span className="text-[10px] font-bold opacity-30 uppercase italic">{new Date(post.created_at).toLocaleDateString()}</span>
        </div>
        <h4 className="font-black text-lg uppercase italic tracking-tighter">{post.title}</h4>
      </CardContent>
    </Card>
  );
}

function DoubtItem({ doubt }: { doubt: any }) {
  return (
    <Card className="bg-card/50 border-border hover:border-blue-500/20 rounded-3xl overflow-hidden">
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-start gap-4">
          <HelpCircle className="w-6 h-6 text-blue-500 mt-1" />
          <div>
            <h5 className="font-black uppercase italic text-sm">{doubt.title}</h5>
            <p className="text-xs text-muted-foreground line-clamp-1">{doubt.content}</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </div>
    </Card>
  );
}
