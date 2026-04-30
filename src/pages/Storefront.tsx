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
  const { id } = useParams();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const { data: storeData } = await supabase.from('store_settings').select('*').eq('user_id', id).single();
        setStore(storeData);
        const { data: prodData } = await supabase.from('products').select(`*, product_images(url)`).eq('user_id', id).eq('is_public', true).order('created_at', { ascending: false });
        setProducts(prodData || []);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedProduct) return;
    setIsSubmitting(true);
    try {
      const { data: clientData, error: clientErr } = await supabase.from('clients').insert({ user_id: id, name, phone }).select().single();
      if (clientErr) throw clientErr;
      const finalPrice = selectedProduct.final_price - (selectedProduct.discount || 0);
      const { error: orderErr } = await supabase.from('orders').insert({
        user_id: id, client_id: clientData.id, product_id: selectedProduct.id, description, status: 'Aguardando contato', final_price: finalPrice, cost_total: selectedProduct.cost_total || 0,
      });
      if (orderErr) throw orderErr;
      toast.success('Pedido enviado com sucesso!');
      setSelectedProduct(null);
      setName(''); setPhone(''); setDescription('');
    } catch (err: any) { toast.error('Erro ao enviar pedido.'); } finally { setIsSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c]"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>;

  const theme = store?.theme_style || 'dark';
  const brandColor = store?.primary_color || '#3b82f6';
  const bgClass = theme === 'light' ? 'bg-slate-50 text-slate-900' : theme === 'colored' ? 'text-white' : 'bg-[#0a0a0c] text-white';
  const cardClass = theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#161618] border-white/5 shadow-2xl';

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 pb-20 ${bgClass}`} style={theme === 'colored' ? { backgroundColor: brandColor } : {}}>
      
      {/* HEADER: Banner e Identidade */}
      <div className="relative min-h-[45vh] flex flex-col items-center justify-center py-10 px-4 overflow-hidden">
        {store?.banner_url ? (
          <img src={store.banner_url} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="Banner" />
        ) : <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-black/60" />}
        <div className={`absolute inset-0 bg-gradient-to-t ${theme === 'light' ? 'from-slate-50' : theme === 'colored' ? 'from-black/40' : 'from-[#0a0a0c]'} to-transparent`} />
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-2xl">
           {/* Logo sem bordas brancas (Glassmorphism) */}
           <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-2 shadow-2xl flex items-center justify-center overflow-hidden">
                {store?.logo_url ? (
                  <img src={store.logo_url} className="w-full h-full object-contain" alt="Logo" />
                ) : <ShoppingBag className="w-10 h-10 text-white/20" />}
           </div>

           <div className="space-y-1">
             <h1 className="text-3xl md:text-6xl font-black tracking-tighter text-white drop-shadow-lg">{store?.store_name}</h1>
             <p className="text-zinc-300 font-medium text-sm md:text-lg drop-shadow">{store?.description}</p>
           </div>

           <div className="flex gap-3 w-full max-w-xs justify-center pt-2">
             {store?.instagram_handle && (
               <a href={`https://instagram.com/${store.instagram_handle}`} target="_blank" rel="noreferrer" className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 transition-all">
                 <Instagram className="w-6 h-6 text-pink-500" />
               </a>
             )}
             {store?.whatsapp_number && (
               <a href={`https://wa.me/55${store.whatsapp_number}`} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 px-6 bg-emerald-500 text-white font-black rounded-2xl shadow-xl transition-all text-xs uppercase tracking-widest">
                 <MessageCircle className="w-4 h-4" /> WhatsApp
               </a>
             )}
           </div>
        </div>
      </div>

      {/* CATÁLOGO: Grid de 2 colunas no mobile */}
      <div className="max-w-7xl mx-auto px-3 md:px-6 mt-6 space-y-8">
        <div className="flex items-center gap-4">
          <h2 className="text-lg md:text-3xl font-black tracking-tight text-current uppercase">Catálogo</h2>
          <div className="h-px flex-1 bg-current opacity-10" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-8">
          {products.map(prod => {
            const finalPrice = prod.final_price - (prod.discount || 0);
            return (
              <Card 
                key={prod.id} 
                className={`group cursor-pointer border-none rounded-2xl md:rounded-[2.5rem] overflow-hidden transition-all active:scale-95 ${cardClass}`}
                onClick={() => setSelectedProduct(prod)}
              >
                <div className="aspect-square relative overflow-hidden bg-zinc-900">
                  <img src={prod.main_image_url || "/placeholder.jpg"} className="w-full h-full object-cover opacity-90 group-hover:opacity-100" />
                  {prod.discount > 0 && (
                    <div className="absolute top-2 left-2 md:top-4 md:left-4 bg-emerald-500 text-white text-[8px] md:text-[10px] font-black px-2 py-0.5 md:py-1 rounded-full shadow-lg">
                      OFERTA
                    </div>
                  )}
                </div>
                
                <CardContent className="p-3 md:p-8 space-y-2">
                  <h3 className={`text-xs md:text-xl font-black line-clamp-1 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{prod.name}</h3>
                  <p className={`text-[10px] md:text-xs font-medium line-clamp-1 ${theme === 'light' ? 'text-slate-500' : 'text-zinc-400'}`}>{prod.description}</p>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className={`text-sm md:text-2xl font-black tracking-tighter ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                      R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <div className="h-7 w-7 md:h-12 md:w-12 rounded-full bg-white/5 flex items-center justify-center">
                      <ArrowRight className="w-3 h-3 md:w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* DIALOG: Imagem maior e Finalização */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-lg rounded-3xl bg-[#161618] border-white/10 p-0 overflow-hidden text-white outline-none">
          <div className="relative aspect-video w-full bg-zinc-900">
            <img src={selectedProduct?.main_image_url} className="w-full h-full object-cover" />
            <Button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/40 backdrop-blur-md border-none p-0 hover:bg-black/60">
                <X className="w-5 h-5 text-white" />
            </Button>
          </div>
          
          <form onSubmit={handleOrder} className="p-6 md:p-10 space-y-6">
            <div className="space-y-1">
                <h2 className="text-2xl font-black tracking-tight">{selectedProduct?.name}</h2>
                <p className="text-sm text-zinc-400">{selectedProduct?.description}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Nome Completo</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required className="h-12 rounded-xl bg-white/5 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">WhatsApp</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="(00) 00000-0000" className="h-12 rounded-xl bg-white/5 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Observações</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Cor, tamanho ou detalhes da peça..." className="rounded-xl bg-white/5 border-white/10 min-h-[80px]" />
              </div>
            </div>

            <Button type="submit" className="w-full h-16 text-lg font-black bg-white text-black hover:bg-zinc-200 rounded-2xl shadow-xl transition-all" disabled={isSubmitting}>
              {isSubmitting ? 'ENVIANDO...' : 'FECHAR PEDIDO'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
