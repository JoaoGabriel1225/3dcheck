import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Image as ImageIcon, 
  MessageCircle, 
  Instagram, 
  Zap, 
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  User,
  Phone,
  FileText,
  X,
  PackageOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Variantes para animação em cascata
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function Storefront() {
  const { id, storeSlug } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let targetUserId = id;

        if (!id && storeSlug) {
          const { data: storeSearch } = await supabase
            .from('store_settings')
            .select('user_id, store_name')
            .not('store_name', 'is', null);

          const matchedStore = storeSearch?.find(s => 
            s.store_name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') === storeSlug
          );

          if (matchedStore) {
            targetUserId = matchedStore.user_id;
          }
        }

        if (!targetUserId) {
          setLoading(false);
          return;
        }

        const [storeRes, prodRes] = await Promise.all([
          supabase.from('store_settings').select('*').eq('user_id', targetUserId).single(),
          supabase.from('products')
            .select(`*`) // Removido product_images para economizar banda, já usamos main_image_url
            .eq('user_id', targetUserId)
            .eq('is_public', true)
            .order('created_at', { ascending: false })
        ]);

        if (storeRes.data) {
          setStore(storeRes.data);
          // SEO: Atualiza o título da página
          document.title = `${storeRes.data.store_name} | Vitrine 3D`;
        }
        if (prodRes.data) setProducts(prodRes.data);

      } catch (err) { 
        console.error('Erro ao buscar dados:', err); 
        toast.error("Erro ao carregar a vitrine.");
      } finally { 
        setLoading(false); 
      }
    };

    fetchData();
  }, [id, storeSlug]);

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.user_id || !selectedProduct) return;
    setIsSubmitting(true);
    
    let cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('55')) {
      cleanPhone = `55${cleanPhone}`;
    }

    try {
      const { data: clientData, error: clientErr } = await supabase.from('clients').insert({ 
        user_id: store.user_id, 
        name, 
        phone: cleanPhone 
      }).select().single();
      
      if (clientErr) throw clientErr;
      
      const finalOrderPrice = selectedProduct.final_price - (selectedProduct.discount || 0);
      
      const { error: orderErr } = await supabase.from('orders').insert({
        user_id: store.user_id, 
        client_id: clientData.id, 
        product_id: selectedProduct.id, 
        description: description || "Sem observações", 
        status: 'Aguardando contato', 
        final_price: finalOrderPrice, 
        cost_total: selectedProduct.cost_total || 0,
      });
      
      if (orderErr) throw orderErr;
      
      toast.success('Pedido enviado com sucesso!');
      setSelectedProduct(null);
      setName(''); setPhone(''); setDescription('');
    } catch (err: any) { 
      toast.error(`Erro ao enviar pedido: ${err.message}`); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] p-8 space-y-12 overflow-hidden flex flex-col items-center justify-center">
        <div className="w-24 h-24 rounded-full border-4 border-t-blue-600 border-white/5 animate-spin" />
        <p className="text-zinc-500 font-black uppercase tracking-widest text-[10px]">Carregando Vitrine...</p>
      </div>
    );
  }

  const theme = store?.theme_style || 'dark';
  const brandColor = store?.primary_color || '#3b82f6';
  const isLight = theme === 'light';
  const isColored = theme === 'colored';
  
  const textTitle = isLight ? 'text-slate-900' : 'text-zinc-100';
  const textSub = isLight ? 'text-slate-500' : 'text-zinc-400';
  const cardClass = isLight ? 'bg-white border-slate-200 shadow-xl' : 'bg-white/5 border-white/10 backdrop-blur-md shadow-2xl';

  return (
    <div className={`relative min-h-screen font-sans pb-20 transition-colors duration-700 ${isLight ? 'bg-slate-50 text-slate-900' : 'text-white'}`}>
      
      {/* BOTÃO ADMIN VOLTAR */}
      {profile?.id === store?.user_id && (
        <Button 
          onClick={() => navigate('/app/storefront-settings')}
          className="fixed top-6 left-6 z-[100] gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-2xl h-12 px-6 uppercase text-[10px] tracking-widest transition-all hover:scale-105"
        >
          <ArrowLeft className="w-4 h-4" /> Painel Admin
        </Button>
      )}

      {/* BACKGROUND DINÂMICO */}
      <div className={`fixed inset-0 z-[-1] transition-all duration-1000 ${isColored ? '' : isLight ? 'bg-slate-50' : 'bg-[#0f0f12]'}`} 
           style={isColored ? { backgroundColor: brandColor } : {}} />
      
      {/* HEADER PREMIUM */}
      <div className="relative min-h-[50vh] flex flex-col items-center justify-center py-20 px-4 overflow-hidden z-10">
        {store?.banner_url && (
          <img src={store.banner_url} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isLight ? 'opacity-20' : 'opacity-40'}`} alt="Banner" />
        )}
        
        <div className="absolute inset-0" 
             style={{ 
               background: `linear-gradient(to top, ${isColored ? brandColor : isLight ? '#f8fafc' : '#0f0f12'} 0%, transparent 100%)` 
             }} 
        />
        
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-2xl">
           <div className={`w-28 h-28 md:w-36 md:h-38 rounded-[2.5rem] backdrop-blur-2xl border-2 shadow-2xl flex items-center justify-center overflow-hidden transition-all hover:rotate-3 ${isLight ? 'bg-white/90 border-white' : 'bg-white/10 border-white/20'}`}>
                {store?.logo_url ? (
                  <img src={store.logo_url} className="w-full h-full object-contain p-2" alt="Logo" />
                ) : <ShoppingBag className={`w-12 h-12 ${isLight ? 'text-slate-800' : 'text-white/80'}`} />}
           </div>

           <div className="space-y-2">
             <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic">{store?.store_name || "Minha Loja"}</h1>
             <p className="font-bold text-sm md:text-xl opacity-80 max-w-lg mx-auto">{store?.description || "Bem-vindo à nossa vitrine!"}</p>
           </div>

           <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center pt-4 px-4">
             {store?.instagram_handle && (
               <a href={`https://instagram.com/${store.instagram_handle}`} target="_blank" rel="noreferrer" 
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:scale-105 shadow-xl ${isLight ? 'bg-white text-slate-800 border border-slate-200' : 'bg-white/10 text-white border border-white/10 backdrop-blur-md'}`}>
                 <Instagram className="w-4 h-4 text-pink-500" /> Instagram
               </a>
             )}
             {store?.whatsapp_number && (
               <a href={`https://wa.me/55${store.whatsapp_number}`} target="_blank" rel="noreferrer" 
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-xl hover:scale-105 transition-all text-[10px] uppercase tracking-widest">
                 <MessageCircle className="w-4 h-4" /> WhatsApp
               </a>
             )}
           </div>
        </motion.div>
      </div>

      {/* CATÁLOGO COM ANIMAÇÃO EM CASCATA */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 mt-12 space-y-10">
        <div className="flex items-center gap-6">
          <h2 className={`text-3xl md:text-5xl font-black tracking-tighter uppercase italic ${textTitle}`}>Catálogo</h2>
          <div className="h-[2px] flex-1 bg-current opacity-10 rounded-full" />
        </div>
        
        {products.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10"
          >
            {products.map(prod => {
              const finalPrice = prod.final_price - (prod.discount || 0);
              return (
                <motion.div key={prod.id} variants={itemVariants}>
                  <Card 
                    className={`group cursor-pointer border-2 transition-all hover:shadow-blue-500/10 active:scale-95 rounded-[2.5rem] overflow-hidden ${cardClass}`}
                    onClick={() => setSelectedProduct(prod)}
                  >
                    <div className="aspect-[4/5] relative overflow-hidden bg-white">
                      <img src={prod.main_image_url || "/placeholder.jpg"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      {prod.discount > 0 && (
                        <div className="absolute top-4 left-4 bg-emerald-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                          <Zap className="w-3 h-3 fill-current" /> OFERTA
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-6 space-y-4">
                      <div className="space-y-1">
                        <h3 className={`text-lg font-black line-clamp-1 uppercase tracking-tight ${textTitle}`}>{prod.name}</h3>
                        <p className={`text-[11px] font-medium line-clamp-2 opacity-60 leading-relaxed ${textSub}`}>{prod.description}</p>
                      </div>
                      
                      <div className="pt-4 border-t border-current/5">
                        <div className="flex flex-col">
                           {prod.discount > 0 && (
                             <span className="text-xs font-bold line-through opacity-40">R$ {prod.final_price?.toFixed(2)}</span>
                           )}
                           <span className={`text-2xl font-black tracking-tighter ${prod.discount > 0 ? 'text-emerald-500' : textTitle}`}>
                             R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                           </span>
                        </div>
                        <div className="mt-4 w-full h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                           Ver Detalhes <ArrowRight className="w-4 h-4 ml-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-40 text-center space-y-4">
             <PackageOpen className="w-20 h-20 opacity-10" />
             <h3 className="text-xl font-black opacity-30 uppercase tracking-widest">Nenhum item disponível no momento</h3>
          </motion.div>
        )}
      </div>

      {/* MODAL DE PEDIDO - DESIGNER CLEAN */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-xl rounded-[3rem] bg-[#16161a] border-white/5 p-0 overflow-hidden text-zinc-100 shadow-2xl">
          <div className="overflow-y-auto max-h-[90vh]">
            <div className="relative aspect-video w-full bg-zinc-900">
              <img src={selectedProduct?.main_image_url} className="w-full h-full object-cover" />
              <Button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 h-12 w-12 rounded-full bg-black/60 backdrop-blur-xl border-white/10 hover:bg-black/80 z-50">
                  <X className="w-6 h-6 text-white" />
              </Button>
            </div>

            <form onSubmit={handleOrder} className="p-8 md:p-12 space-y-8">
              <div className="space-y-2">
                  <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-none">{selectedProduct?.name}</h2>
                  <p className="text-zinc-400 text-sm leading-relaxed">{selectedProduct?.description}</p>
                  
                  <div className="flex items-center gap-3 pt-4">
                    <p className="text-4xl font-black text-emerald-400 tracking-tighter">
                      R$ {(selectedProduct?.final_price - (selectedProduct?.discount || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    {selectedProduct?.discount > 0 && (
                      <span className="text-sm text-zinc-500 line-through font-bold">R$ {selectedProduct?.final_price?.toFixed(2)}</span>
                    )}
                  </div>
              </div>

              <div className="space-y-5 pt-6 border-t border-white/5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2"><User className="w-3 h-3"/> Nome Completo</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required className="h-14 rounded-2xl bg-zinc-900/50 border-white/10 focus:ring-blue-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2"><Phone className="w-3 h-3"/> WhatsApp (Com DDD)</Label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 font-black text-sm">+55</span>
                    <Input 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} 
                      required 
                      placeholder="11 99999-8888" 
                      className="h-14 pl-14 rounded-2xl bg-zinc-900/50 border-white/10" 
                      maxLength={15} // Aumentado para suportar colagem de números formatados
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2"><FileText className="w-3 h-3"/> Preferências</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Cor preta, tamanho grande..." className="rounded-2xl bg-zinc-900/50 border-white/10 min-h-[100px]" />
                </div>
              </div>

              <Button type="submit" className="w-full h-18 text-xl font-black bg-blue-600 hover:bg-blue-500 text-white rounded-[1.5rem] shadow-2xl shadow-blue-600/20 transition-all py-8 uppercase tracking-widest" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Finalizar Pedido'}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Loader2(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
