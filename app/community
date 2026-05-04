import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { communityService } from '@/lib/communityService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Share2, Download, ThumbsUp, ThumbsDown, MessageSquare, 
  Plus, Search, Filter, Box, HelpCircle, Trophy, ExternalLink,
  ChevronRight, Camera, FileCode, Bot, Sparkles
} from 'lucide-react';

export default function Community() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'doubts'>('feed');
  const [posts, setPosts] = useState<any[]>([]);
  const [doubts, setDoubts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [postData, doubtData] = await Promise.all([
        communityService.getPosts(),
        communityService.getDoubts()
      ]);
      setPosts(postData);
      setDoubts(doubtData);
    } catch (e) {
      toast.error("Erro ao carregar comunidade.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleLike = async (postId: string, isLike: boolean) => {
    if (!profile) return toast.error("Faça login para interagir.");
    try {
      await communityService.toggleLike(postId, profile.id, isLike);
      loadData(); // Recarrega para atualizar contagem
    } catch (e) {
      toast.error("Erro na interação.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 pb-32">
      {/* HEADER DA COMUNIDADE */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter">
                STL's da <span className="text-blue-500">Comunidade</span>
             </h2>
             <div className="bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full flex items-center gap-2">
               <Sparkles className="w-3 h-3 text-blue-500 fill-blue-500" />
               <span className="text-[10px] font-black uppercase text-blue-600">Ecossistema Vivo</span>
             </div>
          </div>
          <p className="text-muted-foreground font-medium italic">Compartilhe arquivos, tire dúvidas e evolua com outros makers.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button className="bg-blue-600 hover:bg-blue-500 font-black rounded-2xl px-6 h-12 shadow-lg shadow-blue-600/20 uppercase italic flex items-center gap-2">
            <Plus className="w-5 h-5" /> Novo Post
          </Button>
        </div>
      </header>

      {/* SELETOR DE ABAS ESTILO ELITE */}
      <div className="flex bg-muted/50 p-1.5 rounded-2xl border border-border w-fit">
        <button 
          onClick={() => setActiveTab('feed')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'feed' ? 'bg-card shadow-md text-blue-500' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Box className="w-4 h-4" /> Feed de Modelos
        </button>
        <button 
          onClick={() => setActiveTab('doubts')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'doubts' ? 'bg-card shadow-md text-blue-500' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <HelpCircle className="w-4 h-4" /> Central de Dúvidas
        </button>
      </div>

      {/* BARRA DE PESQUISA */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder={activeTab === 'feed' ? "Buscar modelos STL..." : "Buscar dúvidas ou problemas..."}
          className="pl-11 h-12 rounded-2xl bg-card/50 border-border focus:ring-blue-500/20 font-bold italic"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* CONTEÚDO DINÂMICO */}
      <AnimatePresence mode="wait">
        {activeTab === 'feed' ? (
          <motion.div 
            key="feed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {posts.map((post) => (
              <STLCard key={post.id} post={post} onLike={handleLike} />
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="doubts"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {doubts.map((doubt) => (
              <DoubtItem key={doubt.id} doubt={doubt} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- SUB-COMPONENTE: CARD DE STL ---
function STLCard({ post, onLike }: { post: any, onLike: any }) {
  const mainImage = post.post_media?.[0]?.media_url || 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80';
  const likeCount = post.post_interactions?.filter((i: any) => i.is_like).length || 0;

  return (
    <Card className="group bg-card/40 backdrop-blur-sm border-border overflow-hidden rounded-[2.5rem] hover:border-blue-500/30 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-blue-500/5">
      <div className="aspect-square relative overflow-hidden">
        <img src={mainImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={post.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
           <Button className="w-full bg-white text-black hover:bg-white/90 font-black uppercase italic rounded-xl gap-2 h-12 shadow-xl" onClick={() => window.open(post.stl_url, '_blank')}>
              <Download className="w-4 h-4" /> Baixar Arquivo
           </Button>
        </div>
        {post.profiles?.plan_status === 'pro' && (
          <div className="absolute top-4 left-4 bg-amber-500 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase italic tracking-widest shadow-lg">
            Elite Maker
          </div>
        )}
      </div>
      
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white font-black uppercase">
              {post.profiles?.name?.charAt(0)}
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground italic">{post.profiles?.name}</span>
          </div>
          <span className="text-[10px] font-bold opacity-40 uppercase italic">{new Date(post.created_at).toLocaleDateString()}</span>
        </div>

        <h4 className="font-black text-lg uppercase italic tracking-tighter leading-tight">{post.title}</h4>
        
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-4">
            <button onClick={() => onLike(post.id, true)} className="flex items-center gap-1.5 text-blue-500 hover:scale-110 transition-transform">
              <ThumbsUp className="w-4 h-4" /> <span className="text-xs font-black">{likeCount}</span>
            </button>
            <div className="flex items-center gap-1.5 text-muted-foreground opacity-50">
              <Download className="w-4 h-4" /> <span className="text-xs font-black">{post.download_count}</span>
            </div>
          </div>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// --- SUB-COMPONENTE: ITEM DO FÓRUM ---
function DoubtItem({ doubt }: { doubt: any }) {
  return (
    <Card className="bg-card/40 border-border hover:border-blue-500/20 transition-all rounded-3xl group overflow-hidden">
      <div className="p-6 flex items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-muted rounded-2xl group-hover:bg-blue-500/10 transition-colors">
            <HelpCircle className="w-6 h-6 text-muted-foreground group-hover:text-blue-500" />
          </div>
          <div className="space-y-1">
            <h5 className="font-black uppercase italic text-sm md:text-base">{doubt.title}</h5>
            <p className="text-xs text-muted-foreground font-medium line-clamp-1">{doubt.content}</p>
            <div className="flex items-center gap-3 pt-2">
              <span className="text-[10px] font-black uppercase text-blue-500 italic">{doubt.profiles?.name}</span>
              <span className="text-[10px] font-bold opacity-30 uppercase">{new Date(doubt.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" className="rounded-xl h-10 w-10 p-0 flex-shrink-0">
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </Button>
      </div>
    </Card>
  );
}
