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
  Info, 
  Loader2, 
  ArrowRight,
  ShoppingBag,
  User,
  Phone,
  Mail,
  FileText
} from 'lucide-react';

export default function Storefront() {
  const { id } = useParams();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Checkout Modal
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      try {
        const { data: storeData } = await supabase
          .from('store_settings')
          .select('*')
          .eq('user_id', id)
          .single();
          
        setStore(storeData);

        const { data: prodData } = await supabase
          .from('products')
          .select(`*, product_images(url)`)
          .eq('user_id', id)
          .eq('is_public', true)
          .order('created_at', { ascending: false });
          
        setProducts(prodData || []);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedProduct) return;
    setIsSubmitting(true);
    
    try {
      const { data: clientData, error: clientErr } = await supabase
        .from('clients')
        .insert({
          user_id: id,
          name,
          phone,
          email
        })
        .select()
        .single();
        
      if (clientErr) throw clientErr;

      const finalOrderPrice = selectedProduct.final_price - (selectedProduct.discount || 0);

      const { error: orderErr } = await supabase
        .from('orders')
        .insert({
          user_id: id,
          client_id: clientData.id,
          product_id: selectedProduct.id,
          description: description,
          status: 'Aguardando contato',
          final_price: finalOrderPrice,
          cost_total: selectedProduct.cost_total || 0,
        });

      if (orderErr) throw orderErr;

      toast.success('Pedido enviado! O vendedor entrará em contato.');
      setSelectedProduct(null);
      
      setName('');
      setPhone('');
      setEmail('');
      setDescription('');
    } catch (err: any) {
      toast.error('Erro ao enviar pedido: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c]">
      <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
    </div>
  );

  if (!store && products.length === 0) return (
    <div className="min-h-screen flex items-center justify-center text-slate-500 font-bold">
      Loja não encontrada ou sem produtos disponíveis.
    </div>
  );

  const hexColor = store?.primary_color || '#3b82f6';

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-100 font-sans selection:bg-blue-500/30 pb-20">
      
      {/* HEADER PREMIUM (BANNER + LOGO) */}
      <div className="relative h-[40vh] md:h-[50vh] w-full overflow-hidden">
        {store?.banner_url ? (
          <img src={store.banner_url} className="w-full h-full object-cover opacity-60" alt="Banner" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-900/20 via-slate-900 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center space-y-6">
           <div className="p-1.5 rounded-[2.5rem] bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl">
             <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2.2rem] overflow-hidden bg-[#161618] flex items-center justify-center border border-white/5">
                {store?.logo_url ? (
                  <img src={store.logo_url} className="w-full h-full object-contain p-2" alt="Logo" />
                ) : (
                  <ShoppingBag className="w-10 h-10 text-slate-700" />
                )}
             </div>
           </div>
           <div className="space-y-2">
             <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white drop-shadow-xl">
               {store?.store_name || 'Minha Loja 3D'}
             </h1>
             <p className="text-slate-400 font-medium max-w-lg mx-auto text-sm md:text-base leading-relaxed">
               {store?.description}
             </p>
           </div>

           {/* REDES SOCIAIS GLASS */}
           <div className="flex gap-3 pt-4">
             {store?.instagram_handle && (
               <Button variant="ghost" className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 font-bold gap-2 text-pink-500" asChild>
                 <a href={`https://instagram.com/${store.instagram_handle}`} target="_blank" rel="noreferrer">
                   <Instagram className="w-4 h-4" /> Instagram
                 </a>
               </Button>
             )}
             {store?.whatsapp_number && (
               <Button variant="ghost" className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 font-bold gap-2 text-emerald-500" asChild>
                 <a href={`https://wa.me/55${store.whatsapp_number}`} target="_blank" rel="noreferrer">
                   <MessageCircle className="w-4 h-4" /> WhatsApp
                 </a>
               </Button>
             )}
           </div>
        </div>
      </div>

      {/* CATALOG GRID */}
      <div className="max-w-7xl mx-auto px-6 mt-20">
        <div className="flex items-center gap-4 mb-12">
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <PackageSearch className="w-6 h-6 text-blue-500" />
            Catálogo Profissional
          </h2>
          <div className="h-[1px] flex-1 bg-white/5" />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map(prod => {
            const hasDiscount = prod.discount > 0;
            const finalPrice = prod.final_price - (prod.discount || 0);

            return (
              <Card key={prod.id} className="group border-none bg-[#161618]/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden hover:translate-y-[-8px] transition-all duration-500 border border-white/5 shadow-xl">
                <div className="aspect-square relative overflow-hidden bg-[#1c1c1f]">
                  {prod.main_image_url || (prod.product_images && prod.product_images[0]) ? (
                    <img src={prod.main_image_url || prod.product_images[0].url} alt={prod.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-white/5" />
                  )}
                  
                  {hasDiscount && (
                    <div className="absolute top-4 left-4 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                      <Zap className="w-3 h-3 fill-current" /> OFERTA
                    </div>
                  )}
                </div>
                
                <CardContent className="p-8 space-y-5 flex flex-col flex-1">
                  <div className="space-y-2 flex-1">
                    <h3 className="text-xl font-black tracking-tight text-white group-hover:text-blue-400 transition-colors">{prod.name}</h3>
                    <p className="text-slate-500 text-xs font-medium line-clamp-2 leading-relaxed">{prod.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex flex-col">
                      {hasDiscount && (
                        <span className="text-[10px] font-bold text-slate-500 line-through">R$ {prod.final_price?.toFixed(2)}</span>
                      )}
                      <span className={`text-2xl font-black tracking-tighter ${hasDiscount ? 'text-emerald-400' : 'text-white'}`}>
                        R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    <Button 
                      className="rounded-2xl h-12 w-12 p-0 bg-white/5 hover:bg-blue-600 border border-white/10 text-white transition-all shadow-xl group/btn"
                      disabled={prod.stock_quantity <= 0}
                      onClick={() => setSelectedProduct(prod)}
                    >
                      <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* CHECKOUT DIALOG PREMIUM */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-lg rounded-[2.5rem] bg-[#161618] border-white/5 p-0 overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight">Finalizar Pedido</DialogTitle>
            </DialogHeader>
            <div className="mt-2 text-sm font-bold opacity-80 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" /> {selectedProduct?.name} 
              <span className="bg-white/20 px-2 py-0.5 rounded-lg ml-auto">
                R$ {(selectedProduct?.final_price - (selectedProduct?.discount || 0)).toFixed(2)}
              </span>
            </div>
          </div>

          <form onSubmit={handleOrder} className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <User className="w-3 h-3" /> Nome Completo
                </Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required className="h-12 rounded-xl bg-white/5 border-white/10 text-white" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Phone className="w-3 h-3" /> WhatsApp
                  </Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="(00) 00000-0000" className="h-12 rounded-xl bg-white/5 border-white/10 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Mail className="w-3 h-3" /> Email (Opcional)
                  </Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl bg-white/5 border-white/10 text-white" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <FileText className="w-3 h-3" /> Detalhes (Cor, Tamanho...)
                </Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl bg-white/5 border-white/10 text-white min-h-[100px]" />
              </div>
            </div>

            <Button type="submit" className="w-full h-14 text-lg font-black bg-white text-black hover:bg-slate-200 rounded-2xl shadow-xl transition-all" disabled={isSubmitting}>
              {isSubmitting ? 'Processando...' : 'Confirmar Pedido'}
            </Button>
            <p className="text-[11px] font-bold text-center text-slate-500 uppercase tracking-widest">
              O vendedor entrará em contato via WhatsApp.
            </p>
          </form>
        </DialogContent>
      </Dialog>

      {/* WHATSAPP FLOAT BUTTON */}
      {store?.whatsapp_number && (
        <a 
          href={`https://wa.me/55${store.whatsapp_number}`} 
          target="_blank" 
          rel="noreferrer"
          className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-blue-600/40 hover:scale-110 active:scale-95 transition-all z-50 border border-white/10"
        >
          <MessageCircle className="w-8 h-8 fill-current" />
        </a>
      )}
    </div>
  );
}
