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
        .insert({ user_id: id, name, phone, email })
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
      setName(''); setPhone(''); setEmail(''); setDescription('');
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

  // LÓGICA DE TEMAS E CORES DEFINITIVA
  const theme = store?.theme_style || 'dark';
  const brandColor = store?.primary_color || '#3b82f6';
  
  // Define as classes de fundo baseadas no tema selecionado
  const bgClass = theme === 'light' ? 'bg-white text-slate-900' : theme === 'colored' ? 'text-white' : 'bg-[#0a0a0c] text-slate-100';
  const bgStyle = theme === 'colored' ? { backgroundColor: brandColor } : {};
  const cardClass = theme === 'light' ? 'bg-white border-slate-200 shadow-xl' : 'bg-white/5 border-white/10 backdrop-blur-md shadow-2xl';

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 pb-32 ${bgClass}`} style={bgStyle}>
      
      {/* HEADER: Ajustado para nunca cortar os botões */}
      <div className="relative min-h-[60vh] md:min-h-[70vh] w-full flex flex-col items-center justify-center py-20 px-6 overflow-hidden">
        
        {/* Banner com opacidade para legibilidade */}
        {store?.banner_url ? (
          <img src={store.banner_url} className="absolute inset-0 w-full h-full object-cover opacity-50" alt="Banner" />
        ) : (
          <div className="absolute inset-0 bg-black/40" />
        )}
        
        {/* Gradiente de transição para o catálogo */}
        <div className={`absolute inset-0 bg-gradient-to-t ${theme === 'light' ? 'from-white' : theme === 'colored' ? 'from-black/40' : 'from-[#0a0a0c]'} via-transparent to-transparent opacity-100`} />
        
        {/* Conteúdo Centralizado */}
        <div className="relative z-10 flex flex-col items-center text-center space-y-8 max-w-4xl">
           
           {/* Logo em destaque com moldura Apple-style */}
           <div className="p-2 rounded-[3.5rem] bg-white/10 backdrop-blur-3xl border border-white/20 shadow-2xl transition-transform hover:scale-105">
             <div className="w-32 h-32 md:w-40 md:h-40 rounded-[3.2rem] overflow-hidden bg-white flex items-center justify-center shadow-inner">
                {store?.logo_url ? (
                  <img src={store.logo_url} className="w-full h-full object-contain p-2" alt="Logo" />
                ) : (
                  <ShoppingBag className="w-12 h-12 text-slate-800" />
                )}
             </div>
           </div>

           <div className="space-y-4">
             <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-white drop-shadow-2xl leading-none">
               {store?.store_name || 'Minha Loja 3D'}
             </h1>
             <p className="text-white/90 font-bold max-w-2xl mx-auto text-base md:text-xl drop-shadow-md leading-relaxed px-4">
               {store?.description}
             </p>
           </div>

           {/* BOTÕES SOCIAIS: Sólidos, visíveis e táteis */}
           <div className="flex flex-col sm:flex-row gap-5 w-full max-w-lg px-4 pt-6">
             {store?.instagram_handle && (
               <a href={`https://instagram.com/${store.instagram_handle}`} target="_blank" rel="noreferrer" 
                  className="flex-1 flex items-center justify-center gap-3 px-10 py-6 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white font-black rounded-[2.5rem] shadow-2xl hover:scale-105 active:scale-95 transition-all text-xl uppercase tracking-widest border border-white/20">
                 <Instagram className="w-7 h-7" /> Instagram
               </a>
             )}
             {store?.whatsapp_number && (
               <a href={`https://wa.me/55${store.whatsapp_number}`} target="_blank" rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-3 px-10 py-6 bg-emerald-500 text-white font-black rounded-[2.5rem] shadow-2xl hover:scale-105 active:scale-95 transition-all text-xl uppercase tracking-widest border border-white/20">
                 <MessageCircle className="w-7 h-7" /> WhatsApp
               </a>
             )}
           </div>
        </div>
      </div>

      {/* CATÁLOGO: Padding aumentado para respiro total */}
      <div className="max-w-7xl mx-auto px-6 mt-16 space-y-16">
        <div className="flex items-center gap-6">
          <h2 className="text-4xl font-black tracking-tight uppercase tracking-[0.2em]">Catálogo</h2>
          <div className="h-1.5 flex-1 bg-current opacity-10 rounded-full" />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
          {products.map(prod => {
            const hasDiscount = prod.discount > 0;
            const finalPrice = prod.final_price - (prod.discount || 0);

            return (
              <Card key={prod.id} className={`group border-none rounded-[3.5rem] overflow-hidden hover:scale-[1.03] transition-all duration-500 ${cardClass}`}>
                <div className="aspect-square relative overflow-hidden bg-white/5">
                  {prod.main_image_url || (prod.product_images && prod.product_images[0]) ? (
                    <img src={prod.main_image_url || prod.product_images[0].url} alt={prod.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-200/10"><ImageIcon className="h-12 w-12 text-slate-400" /></div>
                  )}
                  
                  {hasDiscount && (
                    <div className="absolute top-6 left-6 bg-emerald-500 text-white text-xs font-black px-4 py-2 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                      <Zap className="w-3 h-3 fill-current" /> OFERTA
                    </div>
                  )}
                </div>
                
                <CardContent className="p-10 space-y-8 flex flex-col flex-1">
                  <div className="flex-1 space-y-3">
                    <h3 className="text-3xl font-black tracking-tight leading-none text-current line-clamp-1">{prod.name}</h3>
                    <p className="text-sm opacity-60 font-bold uppercase tracking-widest line-clamp-2 leading-relaxed">{prod.description}</p>
                  </div>
                  
                  <div className={`flex items-center justify-between pt-8 border-t ${theme === 'light' ? 'border-slate-100' : 'border-white/10'}`}>
                    <div className="flex flex-col">
                      {hasDiscount && (
                        <span className={`text-xs font-bold line-through ${theme === 'light' ? 'text-slate-400' : 'text-white/50'}`}>R$ {prod.final_price?.toFixed(2)}</span>
                      )}
                      <span className={`text-3xl font-black tracking-tighter ${hasDiscount ? 'text-emerald-500' : theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                        R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    <Button 
                      className="h-16 w-16 rounded-full text-white shadow-2xl transition-transform hover:scale-110 active:scale-95"
                      style={{ backgroundColor: theme === 'colored' ? 'rgba(0,0,0,0.5)' : brandColor }}
                      disabled={prod.stock_quantity <= 0}
                      onClick={() => setSelectedProduct(prod)}
                    >
                      <ArrowRight className="w-7 h-7" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* DIALOG DE CHECKOUT (Tema fixo escuro para foco total no pedido) */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-lg rounded-[3rem] bg-[#161618] border-white/10 p-0 overflow-hidden shadow-2xl text-white">
          <div className="p-10 pb-6" style={{ backgroundColor: brandColor }}>
            <DialogHeader>
              <DialogTitle className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                <ShoppingBag className="w-8 h-8" /> Finalizar Pedido
              </DialogTitle>
            </DialogHeader>
            <div className="mt-6 text-sm font-bold opacity-95 bg-black/20 p-4 rounded-2xl flex justify-between items-center">
              <span>{selectedProduct?.name}</span>
              <span className="text-white text-lg">R$ {(selectedProduct?.final_price - (selectedProduct?.discount || 0)).toFixed(2)}</span>
            </div>
          </div>

          <form onSubmit={handleOrder} className="p-10 space-y-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <User className="w-3 h-3" /> Seu Nome
                </Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required className="h-14 rounded-2xl bg-white/5 border-white/10 text-white focus:ring-brandColor" />
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Phone className="w-3 h-3" /> WhatsApp
                  </Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="(00) 00000-0000" className="h-14 rounded-2xl bg-white/5 border-white/10 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Mail className="w-3 h-3" /> Email
                  </Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 rounded-2xl bg-white/5 border-white/10 text-white" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <FileText className="w-3 h-3" /> Observações (Cor, tamanho...)
                </Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-2xl bg-white/5 border-white/10 text-white min-h-[120px]" />
              </div>
            </div>

            <Button type="submit" className="w-full h-16 text-xl font-black text-white rounded-3xl shadow-xl transition-all hover:opacity-90 active:scale-95" style={{ backgroundColor: brandColor }} disabled={isSubmitting}>
              {isSubmitting ? 'ENVIANDO...' : 'CONFIRMAR PEDIDO'}
            </Button>
            <p className="text-[11px] font-bold text-center text-slate-500 uppercase tracking-widest leading-relaxed px-4">
              Ao clicar em confirmar, seu pedido será registrado e o vendedor entrará em contato.
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
