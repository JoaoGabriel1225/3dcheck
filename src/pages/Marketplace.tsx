import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { ProductImporter } from '../components/ProductImporter'; 
import { Card, CardContent } from '../../components/ui/card'; 
import { Input } from '../../components/ui/input';
import { ShoppingBag, Zap, ExternalLink, Trash2, Save, Loader2, Tag } from 'lucide-react';
import { toast } from 'sonner';

export default function Marketplace() {
  const { profile, user } = useAuth(); 
  const [importingProduct, setImportingProduct] = useState<any>(null);
  const [savedProducts, setSavedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('marketplace_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedProducts(data || []);
    } catch (err) {
      toast.error('Erro ao carregar vitrine');
    } finally {
      setLoading(false);
    }
  }

  async function handlePost() {
    if (!importingProduct) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('marketplace_products')
        .insert([{
          title: importingProduct.title,
          description: importingProduct.description,
          price: importingProduct.price,
          original_price: importingProduct.originalPrice, // Salvando preço antigo
          discount: importingProduct.discount,           // Salvando tag de desconto
          image: importingProduct.image,
          url: importingProduct.url,
          user_id: user?.id
        }]);

      if (error) throw error;

      toast.success('Produto postado com sucesso!');
      setImportingProduct(null); // Corrigido: limpa a prévia
      fetchProducts();
    } catch (err) {
      toast.error('Erro ao salvar no banco de dados');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from('marketplace_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSavedProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Removido da vitrine');
    } catch (err) {
      toast.error('Erro ao deletar');
    }
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-black tracking-tight text-foreground">
          Marketplace <span className="text-blue-500">Hub</span>
        </h2>
        <p className="text-muted-foreground font-medium">Hardware e filamentos selecionados para sua produção.</p>
      </div>

      {isAdmin && (
        <div className="animate-in fade-in duration-500">
          <ProductImporter onImport={(data: any) => setImportingProduct(data)} />
          
          {importingProduct && (
            <div className="mt-6 p-8 border-2 border-dashed border-blue-500/30 rounded-[3rem] bg-blue-500/5 space-y-6">
               <div className="flex flex-col md:flex-row gap-8 items-start">
                  <img src={importingProduct.image} className="w-40 h-40 rounded-3xl object-cover shadow-2xl" />
                  <div className="flex-1 space-y-4 w-full">
                    <div className="grid grid-cols-1 gap-4">
                      <Input 
                        value={importingProduct.title} 
                        onChange={(e) => setImportingProduct({...importingProduct, title: e.target.value})}
                        placeholder="Título do Produto"
                        className="font-bold text-lg bg-background"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-blue-500 ml-1">Preço Atual (R$)</span>
                        <Input 
                          value={importingProduct.price} 
                          onChange={(e) => setImportingProduct({...importingProduct, price: e.target.value})}
                          className="font-black text-blue-500 bg-background"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-muted-foreground ml-1">Preço Original</span>
                        <Input 
                          value={importingProduct.originalPrice} 
                          onChange={(e) => setImportingProduct({...importingProduct, originalPrice: e.target.value})}
                          placeholder="Ex: 7.999"
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-green-500 ml-1">Tag de Desconto</span>
                        <Input 
                          value={importingProduct.discount} 
                          onChange={(e) => setImportingProduct({...importingProduct, discount: e.target.value})}
                          placeholder="Ex: 29% OFF"
                          className="bg-background text-green-500 font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button 
                        onClick={handlePost}
                        disabled={isSaving}
                        className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
                      >
                        {isSaving ? <Loader2 className="animate-spin" /> : <><Save className="w-5 h-5" /> CONFIRMAR E POSTAR</>}
                      </button>
                      <button onClick={() => setImportingProduct(null)} className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all">
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-8">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>
        ) : savedProducts.map((item) => (
          <Card key={item.id} className="rounded-[2.5rem] border-border bg-card shadow-xl overflow-hidden hover:border-blue-500/30 transition-colors">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <img src={item.image} className="w-44 h-44 rounded-[2rem] object-cover shadow-sm" alt="Produto" />
                <div className="flex-1 space-y-4 w-full">
                  <h3 className="text-2xl font-black text-foreground leading-tight">{item.title}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2">{item.description}</p>
                  
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {item.original_price && (
                          <span className="text-sm line-through text-muted-foreground font-medium">R$ {item.original_price}</span>
                        )}
                        {item.discount && (
                          <span className="text-green-500 text-xs font-black bg-green-500/10 px-2 py-0.5 rounded-md uppercase">
                            {item.discount}
                          </span>
                        )}
                      </div>
                      <div className="text-4xl font-black text-blue-500 tracking-tighter">R$ {item.price}</div>
                    </div>

                    <div className="flex gap-2">
                      {isAdmin && (
                        <button onClick={() => handleDelete(item.id)} className="p-4 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all border border-transparent hover:border-red-500/20">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 md:flex-none bg-foreground text-background px-10 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-md"
                      >
                        COMPRAR AGORA <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
