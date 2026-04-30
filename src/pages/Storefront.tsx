import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  PackageSearch, 
  Image as ImageIcon, 
  MessageCircle, 
  Instagram, 
  Zap, 
  Loader2, 
  ArrowRight,
  ShoppingBag,
  User,
  Phone,
  FileText,
  X
} from 'lucide-react';

export default function Storefront() {
  // Capturamos tanto o ID técnico quanto o Nome Amigável (slug) da URL
  const { id, storeSlug } = useParams();
  
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

        // LÓGICA AUTOMÁTICA: Se não temos ID, buscamos pelo nome da loja (slug)
        if (!id && storeSlug) {
          const { data: storeSearch } = await supabase
            .from('store_settings')
            .select('user_id, store_name')
            .filter('store_name', 'not.is', null);

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

        // Busca as configurações da vitrine
        const { data: storeData } = await supabase
          .from('store_settings')
          .select('*')
          .eq('user_id', targetUserId)
          .single();
        
        setStore(storeData);

        // Busca os produtos vinculados a esse usuário
        const { data: prodData } = await supabase
          .from('products')
          .select(`*, product_images(url)`)
          .eq('user_id', targetUserId)
          .eq('is_public', true)
          .order('created_at', { ascending: false });
          
        setProducts(prodData || []);
      } catch (err) { 
        console.error(err); 
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
        description, 
        status: 'Aguardando contato', 
        final_price: finalOrderPrice, 
        cost_total: selectedProduct.cost_total || 0,
      });
      
      if (orderErr) throw orderErr;
      
      toast.success('Pedido enviado com sucesso!');
      setSelectedProduct(null);
      setName(''); setPhone(''); setDescription('');
    } catch (err: any) { 
      toast.error('Erro ao enviar pedido.'); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c]"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>;

  const theme = store?.theme_style || 'dark';
  const brandColor = store?.primary_color || '#3b82f6';
  const isLight = theme === 'light';
  const isColored = theme === 'colored';
  
  const textTitle = isLight ? 'text-slate-900' : 'text-zinc-100';
  const textSub = isLight ? 'text-slate-500' : 'text-zinc-400';
  const cardClass = isLight ? 'bg-white border-slate-200 shadow-xl' : 'bg-white/5 border-white/10 backdrop-blur-md shadow-2xl';

  return (
    <div className={`relative min-h-screen font-sans pb-20 ${isLight ? 'bg-slate-50 text-slate-900' : 'text-white'}`}>
      
      {isColored ? (
        <div className="fixed inset-0 z-[-1] transition-colors duration-500" style={{ backgroundColor: brandColor }} />
      ) : (
        <div className={`fixed inset-0 z-[-1] transition-colors duration-500 ${isLight ? 'bg-slate-50' : 'bg-[#0f0f12]'}`} />
      )}
      
      {/* HEADER */}
      <div className="relative min-h-[45vh] flex flex-col items-center justify-center py-10 px-4 overflow-hidden z-10">
        {store?.banner_url ? (
          <img src={store.banner_url} className={`absolute inset-0 w-full h-full object-cover ${isLight ? 'opacity-20' : 'opacity-30'}`} alt="Banner" />
        ) : <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/60" />}
        
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-transparent" 
             style={{ 
               background: `linear-gradient(to top, ${isColored ? brandColor : isLight ? '#f8fafc' : '#0f0f12'} 0%, transparent 100%)` 
             }} 
        />
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-2xl mt-8">
           <div className={`w-24 h-24 md:w-32 md:h-32 rounded-[2rem] backdrop-blur-xl border p-2 shadow-2xl flex items-center justify-center overflow-hidden ${isLight ? 'bg-white/80 border-slate-200' : 'bg-white/10 border-white/20'}`}>
                {store?.logo_url ? (
                  <img src={store.logo_url} className="w-full h-full object-contain" alt="Logo" />
                ) : <ShoppingBag className={`w-10 h-10 ${isLight ? 'text-slate-800' : 'text-white/80'}`} />}
           </div>

           <div className="space-y-1">
             <h1 className={`text-4xl md:text-6xl font-black tracking-tighter drop-shadow-md ${isLight ? 'text-slate-900' : 'text-white'}`}>{store?.store_name}</h1>
             <p className={`font-bold text-sm md:text-lg drop-shadow ${isLight ? 'text-slate-600' : 'text-zinc-200'}`}>{store?.description}</p>
           </div>

           <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md justify-center pt-4 px-4">
             {store?.instagram_handle && (
               <a href={`https://instagram.com/${store.instagram_handle}`} target="_blank" rel="noreferrer" 
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-transform hover:scale-105 shadow-xl ${isLight ? 'bg-white text-slate-800 border border-slate-200' : 'bg-white/10 text-white border border-white/10 backdrop-blur-md'}`}>
                 <Instagram className="w-5 h-5 text-pink-500" /> Instagram
               </a>
             )}
             {store?.whatsapp_number && (
               <a href={`https://wa.me/55${store.whatsapp_number}`} target="_blank" rel="noreferrer" 
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-xl hover:scale-105 transition-transform text-xs uppercase tracking-widest">
                 <MessageCircle className="w-5 h-5" /> WhatsApp
               </a>
             )}
           </div>
        </div>
      </div>

      {/* CATÁLOGO */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 mt-12 space-y-8">
        <div className="flex items-center gap-4">
          <h2 className={`text-2xl md:text-4xl font-black tracking-tight uppercase ${textTitle}`}>Catálogo</h2>
          <div className="h-1 flex-1 bg-current opacity-10 rounded-full" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {products.map(prod => {
            const hasDiscount = prod.discount > 0;
            const finalPrice = prod.final_price - (prod.discount || 0);
            
            return (
              <Card 
                key={prod.id} 
                className={`group cursor-pointer border-none rounded-[2rem] overflow-hidden transition-all active:scale-95 ${cardClass}`}
                onClick={() => setSelectedProduct(prod)}
              >
                <div className={`aspect-square relative overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-zinc-900/50'}`}>
                  <img src={prod.main_image_url || "/placeholder.jpg"} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                  {hasDiscount && (
                    <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[9px] md:text-xs font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                      <Zap className="w-3 h-3 fill-current hidden sm:block" /> OFERTA
                    </div>
                  )}
                </div>
                
                <CardContent className="p-4 md:p-8 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className={`text-sm md:text-xl font-black line-clamp-1 ${textTitle}`}>{prod.name}</h3>
                    <p className={`text-[10px] md:text-xs font-medium line-clamp-2 leading-relaxed ${textSub}`}>{prod.description}</p>
                  </div>
                  
                  <div className={`pt-3 border-t ${isLight ? 'border-slate-100' : 'border-white/10'}`}>
                    <div className="flex flex-col mb-1">
                       {hasDiscount && (
                         <span className={`text-[10px] md:text-xs font-bold line-through ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
                           R$ {prod.final_price?.toFixed(2)}
                         </span>
                       )}
                       <span className={`text-lg md:text-3xl font-black tracking-tighter ${hasDiscount ? 'text-emerald-500' : textTitle}`}>
                         R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                       </span>
                    </div>
                    
                    <div className={`w-full h-10 mt-2 rounded-xl flex items-center justify-center font-black text-xs uppercase tracking-widest transition-colors ${isLight ? 'bg-slate-100 text-slate-800 group-hover:bg-blue-600 group-hover:text-white' : 'bg-white/10 text-white group-hover:bg-blue-500'}`}>
                      Comprar <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-lg rounded-[2.5rem] bg-[#16161a] border-white/10 p-0 overflow-hidden text-zinc-100 outline-none max-h-[90vh] flex flex-col shadow-2xl">
          
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            <div className="relative aspect-video w-full bg-zinc-900 md:hidden">
              <img src={selectedProduct?.main_image_url} className="w-full h-full object-cover" />
              <Button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/60 backdrop-blur-md border-none p-0 hover:bg-black/80 z-50">
                  <X className="w-5 h-5 text-white" />
              </Button>
            </div>

            <div className="hidden md:flex items-center justify-between p-6 border-b border-white/5 bg-zinc-900/50">
                <h2 className="text-xl font-black tracking-tight flex items-center gap-2"><ShoppingBag className="w-5 h-5" /> Detalhes do Pedido</h2>
                <Button onClick={() => setSelectedProduct(null)} variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-white/10">
                   <X className="w-5 h-5" />
                </Button>
            </div>
            
            <form onSubmit={handleOrder} className="p-6 md:p-10 space-y-6">
              <div className="space-y-1">
                  <h2 className="text-2xl font-black tracking-tight leading-none">{selectedProduct?.name}</h2>
                  <p className="text-sm text-zinc-400 pt-1 leading-relaxed">{selectedProduct?.description}</p>
                  
                  <div className="flex items-end gap-2 pt-2">
                    {selectedProduct?.discount > 0 && (
                      <span className="text-xs text-zinc-500 line-through mb-1">R$ {selectedProduct?.final_price?.toFixed(2)}</span>
                    )}
                    <p className="text-3xl font-black text-emerald-400">
                      R$ {(selectedProduct?.final_price - (selectedProduct?.discount || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2"><User className="w-3 h-3"/> Nome Completo</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required className="h-12 rounded-xl bg-zinc-900/80 border-white/10 text-zinc-100" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2"><Phone className="w-3 h-3"/> WhatsApp (Com DDD)</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">+55</span>
                    <Input 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} 
                      required 
                      placeholder="11999998888" 
                      className="h-12 pl-12 rounded-xl bg-zinc-900/80 border-white/10 text-zinc-100" 
                      maxLength={11}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2"><FileText className="w-3 h-3"/> Preferências</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tamanho, cor de filamento ou detalhes..." className="rounded-xl bg-zinc-900/80 border-white/10 text-zinc-100 min-h-[80px]" />
                </div>
              </div>

              <Button type="submit" className="w-full h-16 text-lg font-black bg-emerald-500 text-white hover:bg-emerald-400 rounded-2xl shadow-xl transition-all" disabled={isSubmitting}>
                {isSubmitting ? 'ENVIANDO...' : 'ENVIAR PEDIDO'}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
