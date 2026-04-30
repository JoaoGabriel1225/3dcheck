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
import { PackageSearch, Image as ImageIcon } from 'lucide-react';

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
      // Create or get client
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

      // Create Order
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

      toast.success('Pedido enviado com sucesso! O vendedor entrará em contato.');
      setSelectedProduct(null);
      
      // Reset form
      setName('');
      setPhone('');
      setEmail('');
      setDescription('');
    } catch (err: any) {
      toast.error('Erro ao enviar pedido', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Carregando loja...</div>;
  if (!store && products.length === 0) return <div className="p-8 text-center text-slate-500">Loja não encontrada ou sem produtos disponíveis.</div>;

  const hexColor = store?.primary_color || '#1E3A8A';

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      {/* Banner */}
      <div 
        className="h-72 w-full bg-cover bg-center flex items-center justify-center relative"
        style={{ 
          backgroundColor: hexColor,
          backgroundImage: store?.banner_url ? `url(${store.banner_url})` : 'none'
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center text-white p-6 rounded-xl max-w-3xl mx-4">
          {store?.logo_url && (
            <div className="w-24 h-24 mx-auto bg-white rounded-xl p-2 mb-6 flex items-center justify-center overflow-hidden shadow-lg">
              <img src={store.logo_url} alt="Logo" className="w-full h-full object-contain" />
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">{store?.store_name || 'Loja de Impressão 3D'}</h1>
          <p className="font-medium text-lg md:text-xl text-white/90 max-w-2xl mx-auto">{store?.description}</p>
        </div>
      </div>

      {/* Catalog */}
      <div className="max-w-6xl mx-auto py-16 px-6 w-full flex-1">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-10 flex items-center gap-3">
          <span className="w-5 h-5 rounded-md" style={{ backgroundColor: hexColor }}></span>
          Nossos Produtos
        </h2>
        
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map(prod => {
            const hasDiscount = prod.discount > 0;
            const finalPriceWithDiscount = prod.final_price - (prod.discount || 0);

            return (
              <Card key={prod.id} className="overflow-hidden flex flex-col group border-slate-200 shadow-none rounded-xl">
                <div className="aspect-square bg-slate-100 flex items-center justify-center relative">
                  {prod.main_image_url || (prod.product_images && prod.product_images[0]) ? (
                    <img src={prod.main_image_url || prod.product_images[0].url} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-slate-300" />
                  )}
                  {hasDiscount && (
                    <div className="absolute top-2 right-2 bg-red-600 text-white font-extrabold text-[10px] uppercase tracking-wider px-2 py-1 rounded-md shadow-sm">
                      Oferta
                    </div>
                  )}
                </div>
                <CardContent className="p-6 flex-1 flex flex-col">
                  <h3 className="font-extrabold text-[16px] text-slate-900 line-clamp-1 mb-1">{prod.name}</h3>
                  <p className="text-slate-500 font-medium text-[13px] line-clamp-2 mb-5 flex-1">{prod.description}</p>
                  
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex flex-col">
                      {hasDiscount && (
                         <span className="text-[12px] font-bold text-slate-400 line-through">R$ {prod.final_price?.toFixed(2)}</span>
                       )}
                       <span className={`font-extrabold text-xl ${hasDiscount ? 'text-red-600' : 'text-slate-900'}`}>
                         R$ {hasDiscount ? finalPriceWithDiscount.toFixed(2) : prod.final_price?.toFixed(2)}
                       </span>
                    </div>
                    {prod.stock_quantity > 0 ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 uppercase tracking-widest px-2.5 py-1 rounded-md">
                        Disponível
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-red-700 bg-red-100 uppercase tracking-widest px-2.5 py-1 rounded-md">
                        Esgotado
                      </span>
                    )}
                  </div>
                  
                  <Button 
                    className="w-full font-bold h-11 rounded-md text-[14px]" 
                    style={{ backgroundColor: hexColor, color: '#fff' }} 
                    disabled={prod.stock_quantity <= 0}
                    onClick={() => setSelectedProduct(prod)}
                  >
                    Fazer Pedido
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-md rounded-xl p-0 overflow-hidden">
          <div className="bg-slate-50 p-6 border-b border-slate-200">
            <DialogHeader>
              <DialogTitle className="font-extrabold text-xl text-slate-900">Finalizar Pedido</DialogTitle>
            </DialogHeader>
            <div className="mt-2 text-sm font-medium text-slate-500">
              Produto selecionado: <strong className="text-slate-900">{selectedProduct?.name}</strong> 
              <span className="ml-1 text-emerald-600 font-bold">
                (R$ {(selectedProduct?.final_price - (selectedProduct?.discount || 0)).toFixed(2)})
              </span>
            </div>
          </div>
          <form onSubmit={handleOrder} className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="c_name" className="font-bold text-slate-700 text-xs uppercase tracking-wider">Seu Nome</Label>
              <Input id="c_name" value={name} onChange={(e) => setName(e.target.value)} required className="h-11 border-slate-200" />
            </div>
            
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="c_phone" className="font-bold text-slate-700 text-xs uppercase tracking-wider">WhatsApp</Label>
                <Input id="c_phone" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="(11) 99999-9999" className="h-11 border-slate-200"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="c_email" className="font-bold text-slate-700 text-xs uppercase tracking-wider">Email (Opcional)</Label>
                <Input id="c_email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 border-slate-200" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="c_desc" className="font-bold text-slate-700 text-xs uppercase tracking-wider">Detalhes do Pedido</Label>
              <Textarea id="c_desc" placeholder="Cores, tamanho, observações..." value={description} onChange={(e) => setDescription(e.target.value)} className="border-slate-200 min-h-[100px]" />
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full font-bold h-12 text-[15px] rounded-md" disabled={isSubmitting} style={{ backgroundColor: hexColor, color: '#fff' }}>
                {isSubmitting ? 'Enviando Pedido...' : 'Confirmar Pedido'}
              </Button>
              <p className="text-[13px] font-medium text-center text-slate-500 mt-4">
                O vendedor entrará em contato para alinhar os detalhes e o pagamento.
              </p>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
