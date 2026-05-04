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
  Plus, Search, Box, HelpCircle, Sparkles, LayoutGrid, Terminal
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
      setPosts(postData || []);
      setDoubts(doubtData || []);
    } catch (e) {
      toast.error("Interface de dados offline.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // FUNÇÃO DO BOTÃO NOVO POST
  const handleNewPost = () => {
    toast.info("Iniciando protocolo de upload... (Modal em desenvolvimento)");
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 p-4 md:p-8 space-y-8 pb-32">
      {/* BACKGROUND DECOR (O TOQUE TECH) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
         <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full" />
         <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      <header className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-600/20 rounded-lg border border-blue-500/30">
                <Terminal className="w-5 h-5 text-blue-400" />
             </div>
             <h2 className="text-4xl font-black uppercase tracking-tighter italic">
                CORE <span className="text-blue-500">NETWORK</span>
             </h2>
          </div>
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Protocolo de compartilhamento de dados v3.0</p>
        </div>

        {/* BOTÃO CORRIGIDO COM ONCLICK */}
        <Button 
          onClick={handleNewPost}
          className="bg-blue-600 hover:bg-blue-500 text-white font-black rounded-sm px-8 h-12 shadow-[0_0_20px_rgba(37,99,235,0.3)] uppercase italic tracking-tighter flex items-center gap-3 border-r-4 border-blue-400"
        >
          <Plus className="w-5 h-5" /> Injetar Novo STL
        </Button>
      </header>

      {/* TABS ESTILO DASHBOARD MILITAR */}
      <div className="flex gap-4 border-b border-white/5 p-1">
        {[
          { id: 'feed', label: 'Datalake STL', icon: Box },
          { id: 'doubts', label: 'Signal Debug', icon: HelpCircle }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === tab.id ? 'text-blue-400' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="tab-glow" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
            )}
          </button>
        ))}
      </div>

      <div className="relative max-w-xl group">
        <div className="absolute inset-0 bg-blue-500/5 blur-xl group-focus-within:bg-blue-500/10 transition-all" />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
        <Input 
          placeholder="Rastrear módulos de impressão..."
          className="pl-12 h-14 rounded-none bg-zinc-900/50 border-white/5 focus:border-blue-500/50 text-blue-100 font-mono text-sm placeholder:text-zinc-700"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'feed' ? (
          <motion.div 
            key="feed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {posts.map((post) => (
              <TechCard key={post.id} post={post} />
            ))}
          </motion.div>
        ) : (
          <div className="space-y-4 max-w-4xl">
            {doubts.map((doubt) => (
              <TechDoubt key={doubt.id} doubt={doubt} />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// CARD COM ESTÉTICA TECNOLÓGICA
function TechCard({ post }: { post: any }) {
  const mainImage = post.post_media?.[0]?.media_url || 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2070';

  return (
    <div className="relative group bg-zinc-900/50 border border-white/5 p-4 rounded-lg overflow-hidden hover:border-blue-500/40 transition-all">
      <div className="aspect-square mb-4 overflow-hidden rounded-md border border-white/5">
        <img src={mainImage} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono text-blue-500 uppercase tracking-tighter">ID: {post.id.substring(0,8)}</span>
          <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
        </div>
        
        <h4 className="font-black text-sm uppercase italic group-hover:text-blue-400 transition-colors">{post.title}</h4>
        
        <div className="flex gap-2">
            <Button className="flex-1 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase h-9 rounded-none border border-white/10">
                <LayoutGrid className="w-3 h-3 mr-2" /> Infos
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-500 h-9 px-3 rounded-none">
                <Download className="w-4 h-4" />
            </Button>
        </div>
      </div>
      
      {/* DETALHE DE DESIGN: LINHA DE SCAN */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-blue-500/20 translate-y-[-100%] group-hover:translate-y-[400px] transition-all duration-[2s]" />
    </div>
  );
}

function TechDoubt({ doubt }: { doubt: any }) {
    return (
      <div className="p-5 bg-zinc-900/30 border-l-2 border-zinc-800 hover:border-blue-500 hover:bg-blue-500/5 transition-all">
        <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-mono text-zinc-600 uppercase">Log_Input //</span>
            <h5 className="font-black text-sm uppercase tracking-tight text-zinc-300">{doubt.title}</h5>
        </div>
        <p className="text-xs text-zinc-500 mb-3">{doubt.content}</p>
        <div className="flex items-center gap-4 text-[9px] font-mono uppercase text-zinc-700">
            <span>Author: {doubt.profiles?.name}</span>
            <span>Status: Resolvendo...</span>
        </div>
      </div>
    );
}
