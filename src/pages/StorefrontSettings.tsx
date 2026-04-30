import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MessageCircle, 
  Instagram, 
  ShoppingBag, 
  Zap,
  Info,
  Loader2,
  Package,
  ArrowRight
} from 'lucide-react';

export default function Storefront() {
  const { id } = useParams();
  const [settings, setSettings] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        const { data: storeData } = await supabase
          .from('store_settings')
          .select('*')
          .eq('user_id', id)
          .single();

        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', id)
          .eq('is_public', true);

        setSettings(storeData);
        setProducts(productsData || []);
      } catch (e) {
        console.error("Erro ao carregar vitrine", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStoreData();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c]">
      <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
    </div>
  );

  if (!settings) return <div className="min-h-screen flex items-center justify-center font-bold">Loja não encontrada.</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-100 font-sans pb-20 selection:bg-blue-500/30">
      
      {/* BANNER DINÂMICO */}
      <div className="relative h-[40vh] md:h-[50vh] w-full overflow-hidden">
        {settings.banner_url ? (
          <img src={settings.banner_url} className="w-full h-full object-cover" alt="Banner" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1a1a1e] via-[#0a0a0c] to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent" />
        
        {/* LOGO GLASSMORPHISM */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center space-y-4">
           <div className="p-1.5 rounded-[2.5rem] bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl">
             <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2.2rem] overflow-hidden bg-[#161618] flex items-center justify-center border border-white/5">
                {settings.logo_url ? (
                  <img src={settings.logo_url} className="w-full h-full object-contain p-2" alt="Logo" />
                ) : (
                  <span className="text-3xl font-black text-blue-500">3D</span>
                )}
             </div>
           </div>
           <div className="space-y-1">
             <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white drop-shadow-xl">
               {settings.store_name}
             </h1>
             <p className="text-slate-400 font-medium max-w-lg mx-auto text-sm">
               {settings.description}
             </p>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* REDES SOCIAIS GLASS */}
        <div className="flex justify-center -mt-8 relative z-20">
          <div className="bg-[#161618]/90 backdrop-blur-xl border border-white/10 p-2 rounded-2xl flex gap-2 shadow-2xl">
            {settings.instagram_handle && (
              <Button variant="ghost" className="rounded-xl hover:bg-white/5 font-bold gap-2 text-pink-500" asChild>
                <a href={`https://instagram.com/${settings.instagram_handle}`} target="_blank" rel="noreferrer">
                  <Instagram className="w-4 h-4" /> <span className="hidden sm:inline">Instagram</span>
                </a>
              </Button>
            )}
            <Button variant="ghost" className="rounded-xl hover:bg-white/5 font-bold gap-2 text-emerald-500" asChild>
              <a href={`https://wa.me/55${settings.whatsapp_number}`} target="_blank" rel="noreferrer">
                <MessageCircle className="w-4 h-4" /> <span className="hidden sm:inline">WhatsApp</span>
              </a>
            </Button>
          </div>
        </div>

        {/* PRODUTOS */}
        <div className="mt-20 space-y-10">
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <Package className="text-blue-500 w-6 h-6" />
            Catálogo Profissional
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => {
              const hasDiscount = product.discount > 0;
              const finalPrice = product.final_price - (product.discount || 0);

              return (
                <Card key={product.id} className="group border-none bg-[#161618]/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden hover:translate-y-[-8px] transition-all duration-500 border border-white/5">
                  <div className="aspect-square relative overflow-hidden bg-[#1c1c1f]">
                    <img 
                      src={product.main_image_url || "/placeholder-3d.jpg"} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      alt={product.name} 
                    />
                    {hasDiscount && (
                      <div className="absolute top-4 left-4 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg">
                        OFERTA
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-8 space-y-4">
                    <h3 className="text-xl font-black tracking-tight text-white">{product.name}</h3>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      {settings.show_prices ? (
                        <div className="flex flex-col">
                          {hasDiscount && <span className="text-[10px] font-bold text-slate-500 line-through">R$ {product.final_price?.toFixed(2)}</span>}
                          <span className="text-2xl font-black tracking-tighter text-emerald-400">R$ {finalPrice.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest flex items-center gap-2"><Info className="w-3 h-3" /> Orçamento</span>
                      )}
                      
                      <Button className="rounded-2xl h-12 w-12 p-0 bg-white/5 hover:bg-blue-600 border border-white/10 text-white transition-all" asChild>
                        <a href={`https://wa.me/55${settings.whatsapp_number}?text=Olá! Gostaria de encomendar o item: ${product.name}`} target="_blank" rel="noreferrer">
                          <ArrowRight className="w-5 h-5" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
