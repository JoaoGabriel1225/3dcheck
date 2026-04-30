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
  FileText,
  CheckCircle2
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

  // LÓGICA DE TEMAS E CORES
  const theme = store?.theme_style || 'dark';
  const brandColor = store?.primary_color || '#3b82f6';
  
  const bgClass = theme === 'light' ? 'bg-slate-50 text-slate-900' : theme === 'colored' ? 'text-white' : 'bg-[#0a0a0c] text-slate-100';
  const bgStyle = theme === 'colored' ? { backgroundColor: brandColor } : {};
  const cardClass = theme === 'light' ? 'bg-white border-slate-200 shadow-xl' : 'bg-white/5 border-white/10 backdrop-blur-md shadow-2xl';

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 pb-20 ${bgClass}`} style={bgStyle}>
      
      {/* HEADER ULTRA PREMIUM */}
      <div className="relative h-[55vh] md:h-[65vh] w-full overflow-hidden">
        {store?.banner_url ? (
          <img src={store.banner_url} className="w-full h-full object-cover opacity-60" alt="Banner" />
        ) : (
          <div className="w-full h-full bg-black/40" />
        )}
        <div className={`absolute inset-0 bg-gradient-to-t ${theme === 'light' ? 'from-slate-50' : theme === 'colored' ? 'from-black/40' : 'from-[#0a0a0c]'} via-transparent to-transparent opacity-90`} />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center space-y-8 mt-10">
           
           {/* LOGO EM DESTAQUE */}
           <div className="p-2 rounded-[3rem] bg-white/10 backdrop-blur-3xl border border-white/20 shadow-2xl">
             <div className="w-28 h-28 md:w-36 md:h-36 rounded-[2.8rem] overflow-hidden bg-white flex items-center justify-center shadow-inner">
                {store?.logo_url ? (
                  <img src={store.logo_url} className="w-full h-full object-contain p-2" alt="Logo" />
                ) : (
                  <ShoppingBag className="w-12 h-12 text-slate-800" />
                )}
             </div>
           </div>

           <div className="space-y-3">
             <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white drop-shadow-2xl">
               {store?.store_name || 'Minha Loja 3D'}
             </h1>
             <p className="text-white/90 font-bold max-w-lg mx-auto text-sm md:text-lg drop-shadow-md leading-relaxed">
               {store?.description}
             </p>
           </div>

           {/* REDES SOCIAIS GIGANTES E CHAMATIVAS */}
           <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md px-4 pt-4">
             {store?.instagram_handle && (
               <a href={`https://instagram.com/${store.instagram_handle}`} target="_blank" rel="noreferrer" 
                  className="flex-1 flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-black rounded-[2rem] shadow-2xl hover:scale-105 transition-transform text-lg uppercase tracking-widest">
                 <Instagram className="w-6 h-6" /> Instagram
               </a>
             )}
             {store?.whatsapp_number && (
               <a href={`https://wa.me/55${store.whatsapp_number}`} target="_blank" rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-3 px-8 py-5 bg-emerald-500 text-white font-black rounded-[2rem] shadow-2xl hover:scale-105 transition-transform text-lg uppercase tracking-widest">
                 <MessageCircle className="w-6 h-6" /> WhatsApp
               </a>
             )}
           </div>
        </div>
      </div>

      {/* CATÁLOGO ESTILO APPLE */}
      <div className="max-w-7xl mx-auto px-6 mt-20 space-y-12">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-black tracking-tight">Catálogo Profissional</h2>
          <div className="h-1 flex-1 bg-current opacity-10 rounded-full" />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {products.map(prod => {
            const hasDiscount = prod.discount > 0;
            const finalPrice = prod.final_price - (prod.discount || 0);

            return (
              <Card key={prod.id} className={`group border-none rounded-[3rem] overflow-hidden hover:scale-105 transition-all duration-500 ${cardClass}`}>
                <div className="aspect-square relative overflow-hidden bg-white/5">
                  {prod.main_image_url || (prod.product_images && prod.product_images[0]) ? (
                    <img src={prod.main_image_url || prod.product_images[0].url} alt={prod.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-200/10"><ImageIcon className="h-10 w-10 text-slate-400" /></div>
                  )}
                  
                  {hasDiscount && (
                    <div className="absolute top-4 left-4 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                      <Zap className="w-3 h-3 fill-current" /> OFERTA
                    </div>
                  )}
                </div>
                
                <CardContent className="p-8 space-y-6">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight leading-none mb-2 line-clamp-1">{prod.name}</h3>
                    <p className="text-[13px] opacity-60 font-bold uppercase tracking-widest line-clamp-2 leading-relaxed">{prod.description}</p>
                  </div>
                  
                  <div className={`flex items-center justify-between pt-6 border-t ${theme === 'light' ? 'border-slate-100' : 'border-white/10'}`}>
                    <div className="flex flex-col">
                      {hasDiscount && (
                        <span className={`text-[10px] font-bold line-through ${theme === 'light' ? 'text-slate-400' : 'text-white/50'}`}>
                          R$ {prod.final_price?.toFixed(2)}
                        </span>
                      )}
                      <span className={`text-3xl font-black tracking-tighter ${hasDiscount ? 'text-emerald-500' : theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                        R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    <Button 
                      className="h-14 w-14 rounded-full text-white shadow-xl hover:scale-110 transition-transform"
                      style={{ backgroundColor: theme === 'colored' ? 'rgba(0,0,0,0.4)' : brandColor }}
                      disabled={prod.stock_quantity <= 0}
                      onClick={() => setSelectedProduct(prod)}
                    >
                      <ArrowRight className="w-6 h-6" />
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
        <DialogContent className="sm:max-w-lg rounded-[2.5rem] bg-[#161618] border-white/10 p-0 overflow-hidden shadow-2xl text-white">
          <div className="p-8 pb-4" style={{ backgroundColor: brandColor }}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <ShoppingBag className="w-6 h-6" /> Finalizar Pedido
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 text-sm font-bold opacity-90 bg-black/20 p-3 rounded-xl flex justify-between items-center">
              <span>{selectedProduct?.name}</span>
              <span className="text-white">R$ {(selectedProduct?.final_price - (selectedProduct?.discount || 0)).toFixed(2)}</span>
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

            <Button type="submit" className="w-full h-14 text-lg font-black text-white rounded-2xl shadow-xl transition-all" style={{ backgroundColor: brandColor }} disabled={isSubmitting}>
              {isSubmitting ? 'Processando...' : 'Confirmar Pedido'}
            </Button>
            <p className="text-[11px] font-bold text-center text-slate-500 uppercase tracking-widest">
              O vendedor entrará em contato via WhatsApp.
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
