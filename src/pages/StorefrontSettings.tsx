import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MessageCircle, 
  Instagram, 
  Package, 
  ShoppingBag, 
  Info,
  Loader2
} from 'lucide-react';

export default function Storefront() {
  const { id } = useParams();
  const [settings, setSettings] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        // Busca configurações da loja
        const { data: storeData } = await supabase
          .from('store_settings')
          .select('*')
          .eq('user_id', id)
          .single();

        // Busca produtos públicos
        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', id)
          .eq('is_public', true);

        setSettings(storeData);
        setProducts(productsData || []);
      } catch (e) {
        console.error("Erro ao carregar loja", e);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
    </div>
  );

  if (!settings) return <div className="text-center py-20 font-bold">Loja não encontrada.</div>;

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans selection:bg-blue-100">
      
      {/* BANNER PREMIUM */}
      <div className="h-[30vh] md:h-[40vh] w-full relative overflow-hidden bg-slate-200">
        {settings.banner_url ? (
          <img src={settings.banner_url} className="w-full h-full object-cover" alt="Banner" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-slate-200 to-slate-300" />
        )}
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* HEADER DA LOJA */}
      <div className="max-w-6xl mx-auto px-6 -mt-16 relative z-10">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-32 h-32 rounded-3xl bg-white p-2 shadow-2xl shadow-black/5 border border-white">
            <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center">
              {settings.logo_url ? (
                <img src={settings.logo_url} className="w-full h-full object-contain" alt="Logo" />
              ) : (
                <ShoppingBag className="w-10 h-10 text-slate-300" />
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight">{settings.store_name}</h1>
            <p className="max-w-xl text-slate-500 font-medium leading-relaxed">
              {settings.description || "Bem-vindo à nossa vitrine de impressões 3D profissionais."}
            </p>
          </div>

          {/* REDES SOCIAIS */}
          <div className="flex gap-3 pt-2">
            {settings.instagram_handle && (
              <Button variant="outline" className="rounded-full border-slate-200 gap-2 font-bold" asChild>
                <a href={`https://instagram.com/${settings.instagram_handle}`} target="_blank" rel="noreferrer">
                  <Instagram className="w-4 h-4 text-pink-500" /> Instagram
                </a>
              </Button>
            )}
            <Button variant="outline" className="rounded-full border-slate-200 gap-2 font-bold" asChild>
              <a href={`https://wa.me/55${settings.whatsapp_number}`} target="_blank" rel="noreferrer">
                <MessageCircle className="w-4 h-4 text-emerald-500" /> Contato
              </a>
            </Button>
          </div>
        </div>

        {/* GRADE DE PRODUTOS */}
        <div className="py-20">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-[1px] flex-1 bg-slate-200" />
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Catálogo Disponível</h2>
            <div className="h-[1px] flex-1 bg-slate-200" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <Card key={product.id} className="group border-none bg-white shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 rounded-[2.5rem] overflow-hidden">
                <div className="aspect-square relative overflow-hidden bg-slate-100">
                  <img 
                    src={product.main_image_url || "/placeholder-3d.jpg"} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    alt={product.name} 
                  />
                  {settings.show_stock && product.stock_quantity <= 0 && (
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                      Esgotado
                    </div>
                  )}
                </div>
                <CardContent className="p-8 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold tracking-tight">{product.name}</h3>
                    <p className="text-slate-400 text-sm line-clamp-2 font-medium">{product.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    {settings.show_prices ? (
                      <div className="text-2xl font-black tracking-tighter">
                        R$ {product.final_price?.toFixed(2)}
                      </div>
                    ) : (
                      <div className="text-xs font-bold uppercase tracking-widest text-blue-500 flex items-center gap-1">
                        <Info className="w-3 h-3" /> Sob Consulta
                      </div>
                    )}
                    
                    <Button 
                      className="bg-slate-900 hover:bg-blue-600 text-white rounded-2xl h-12 px-6 font-bold transition-colors"
                      asChild
                    >
                      <a href={`https://wa.me/55${settings.whatsapp_number}?text=Olá! Tenho interesse no produto: ${product.name}`} target="_blank" rel="noreferrer">
                        Pedir Agora
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="py-12 border-t border-slate-100 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
        &copy; {new Date().getFullYear()} {settings.store_name} • Powered by 3dCheck
      </footer>

      {/* WHATSAPP FLUTUANTE */}
      <a 
        href={`https://wa.me/55${settings.whatsapp_number}`} 
        target="_blank" 
        rel="noreferrer"
        className="fixed bottom-8 right-8 w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40 hover:scale-110 active:scale-95 transition-all z-50"
      >
        <MessageCircle className="w-8 h-8 fill-current" />
      </a>
    </div>
  );
}
