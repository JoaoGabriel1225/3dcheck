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

  if (!settings) return <div className="min-h-screen flex items-center justify-center font-bold">Vitrine não encontrada.</div>;

  const accentColor = settings.primary_color || '#3b82f6';

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-100 font-sans selection:bg-blue-500/30 pb-20">
      
      {/* HERO SECTION TECNOLÓGICA */}
      <div className="relative h-[45vh] md:h-[55vh] w-full overflow-hidden">
        {settings.banner_url ? (
          <img src={settings.banner_url} className="w-full h-full object-cover" alt="Banner" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-900 via-slate-900 to-black" />
        )}
        
        {/* Overlay de Gradiente para Profundidade */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/40 to-transparent" />
        
        {/* Conteúdo Flutuante do Hero */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center space-y-4">
           <div className="p-1.5 rounded-[2rem] bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl">
             <div className="w-28 h-28 md:w-36 md:h-36 rounded-[1.8rem] overflow-hidden bg-[#161618] flex items-center justify-center border border-white/5">
                {settings.logo_url ? (
                  <img src={settings.logo_url} className="w-full h-full object-contain" alt="Logo" />
                ) : (
                  <span className="text-3xl font-black text-blue-500">3D</span>
                )}
             </div>
           </div>
           <div className="space-y-2">
             <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white drop-shadow-2xl">
               {settings.store_name}
             </h1>
             <p className="text-slate-400 font-medium max-w-lg mx-auto text-sm md:text-base">
               {settings.description}
             </p>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* BARRA DE REDES SOCIAIS GLASS */}
        <div className="flex justify-center -mt-8 relative z-20">
          <div className="bg-[#161618]/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl flex gap-2 shadow-2xl">
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

        {/* LISTAGEM DE PRODUTOS */}
        <div className="mt-20 space-y-12">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <Package className="text-blue-500 w-6 h-6" />
              Nossas Criações
            </h2>
            <div className="h-[1px] flex-1 bg-white/5" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => {
              const hasDiscount = product.discount > 0;
              const finalPrice = product.final_price - (product.discount || 0);

              return (
                <Card key={product.id} className="group border-none bg-[#161618]/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden hover:translate-y-[-8px] transition-all duration-500 shadow-xl border border-white/5">
                  <div className="aspect-square relative overflow-hidden bg-[#1c1c1f]">
                    <img 
                      src={product.main_image_url || "/placeholder-3d.jpg"} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" 
                      alt={product.name} 
                    />
                    
                    {/* Badge de Oferta em Verde Esmeralda */}
                    {hasDiscount && (
                      <div className="absolute top-4 left-4 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                        <Zap className="w-3 h-3 fill-current" /> OFERTA
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-8 space-y-5">
                    <div className="space-y-2">
                      <h3 className="text-xl font-black tracking-tight text-white group-hover:text-blue-400 transition-colors">{product.name}</h3>
                      <p className="text-slate-500 text-xs font-medium line-clamp-2 leading-relaxed">{product.description}</p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      {settings.show_prices ? (
                        <div className="flex flex-col">
                          {hasDiscount && (
                            <span className="text-[10px] font-bold text-slate-500 line-through">R$ {product.final_price?.toFixed(2)}</span>
                          )}
                          <span className={`text-2xl font-black tracking-tighter ${hasDiscount ? 'text-emerald-400' : 'text-white'}`}>
                            R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ) : (
                        <div className="text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-1.5">
                          <Info className="w-3 h-3" /> Consultar Orçamento
                        </div>
                      )}
                      
                      <Button 
                        className="rounded-2xl h-12 w-12 p-0 bg-white/5 hover:bg-blue-600 border border-white/10 text-white transition-all shadow-xl group/btn"
                        asChild
                      >
                        <a href={`https://wa.me/55${settings.whatsapp_number}?text=Olá! Gostaria de encomendar: ${product.name}`} target="_blank" rel="noreferrer">
                          <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
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

      {/* FOOTER PREMIUM */}
      <footer className="mt-32 py-12 border-t border-white/5 bg-black/20 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="h-6 w-6 bg-blue-600 rounded flex items-center justify-center text-[10px] font-black">3D</div>
          <span className="font-black tracking-tighter text-slate-300">3DCheck</span>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600">
          Tecnologia de Gestão para Impressão 3D Profissional
        </p>
      </footer>

      {/* BOTÃO FLUTUANTE DISCRETO */}
      <a 
        href={`https://wa.me/55${settings.whatsapp_number}`} 
        target="_blank" 
        rel="noreferrer"
        className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-blue-600/40 hover:scale-110 active:scale-95 transition-all z-50 border border-white/10"
      >
        <MessageCircle className="w-8 h-8 fill-current" />
      </a>
    </div>
  );
}
