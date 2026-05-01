import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { ProductImporter } from '../components/ProductImporter'; 
import { Card, CardContent } from '../../components/ui/card'; 
import { Input } from '../../components/ui/input';
import { 
  ShoppingBag, Search, ArrowUpDown, ExternalLink, 
  Trash2, Save, Loader2, Sparkles, PackageSearch 
} from 'lucide-react';
import { toast } from 'sonner';

export default function Marketplace() {
  const { profile, user } = useAuth(); 
  const [importingProduct, setImportingProduct] = useState<any>(null);
  const [savedProducts, setSavedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados para Busca e Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // recent, popular, price_asc, price_desc

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('marketplace_products')
        .select('*');
      if (error) throw error;
      setSavedProducts(data || []);
    } catch (err) {
      toast.error('Erro ao carregar vitrine');
    } finally {
      setLoading(false);
    }
  }

  // Função para contar cliques e abrir link
  async function handleProductClick(product: any) {
    window.open(product.url, '_blank', 'noopener,noreferrer');
    await supabase
      .from('marketplace_products')
      .update({ clicks: (product.clicks || 0) + 1 })
      .eq('id', product.id);
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
          original_price: importingProduct.originalPrice,
          discount: importingProduct.discount,
          image: importingProduct.image,
          url: importingProduct.url,
          user_id: user?.id,
          clicks: 0
        }]);
      if (error) throw error;
      toast.success('Produto postado com sucesso!');
      setImportingProduct(null);
      fetchProducts();
    } catch (err) {
      toast.error('Erro ao salvar no banco de dados');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase.from('marketplace_products').delete().eq('id', id);
      if (error) throw error;
      setSavedProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Removido da vitrine');
    } catch (err) {
      toast.error('Erro ao deletar');
    }
  }

  // Lógica de Filtragem e Ordenação
  const filteredProducts = savedProducts
    .filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'price_asc') return parseFloat(a.price.replace('.','')) - parseFloat(b.price.replace('.',''));
      if (sortBy === 'price_desc') return parseFloat(b.price.replace('.','')) - parseFloat(a.price.replace('.',''));
      if (sortBy === 'popular') return (b.clicks || 0) - (a.clicks || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="space-y-6 pb-20 px-2 md:px-0">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight">Marketplace <span className="text-blue-500">Hub</span></h2>
          <p className="text-muted-foreground text-xs font-medium">Equipamentos e filamentos de alta performance.</p>
        </div>

        {/* Barra de Busca e Filtros */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="O que você está procurando hoje?" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-accent/20 border-none text-sm"
            />
          </div>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-11 px-4 rounded-xl bg-accent/20 text-xs font-bold outline-none border-none cursor-pointer"
          >
            <option value="recent">Recém adicionados</option>
            <option value="popular">Mais visitados</option>
            <option value="price_asc">Menor preço</option>
            <option value="price_desc">Maior preço</option>
          </select>
        </div>
      </div>

      {isAdmin && (
        <div className="animate-in fade-in duration-500 bg-blue-500/5 p-4 rounded-[2rem] border border-dashed border-blue-500/20">
          <ProductImporter onImport={(data: any) => setImportingProduct(data)} />
          {importingProduct && (
            <div className="mt-4 p-4 bg-background rounded-2xl border border-blue-500/20 space-y-4">
               <div className="flex gap-4 items-center">
                  <img src={importingProduct.image} className="w-16 h-16 rounded-xl object-cover" />
                  <Input value={importingProduct.title} onChange={(e) => setImportingProduct({...importingProduct, title: e.target.value})} className="font-bold text-sm" />
               </div>
               <div className="grid grid-cols-3 gap-2">
                  <Input value={importingProduct.price} onChange={(e) => setImportingProduct({...importingProduct, price: e.target.value})} placeholder="Preço" className="text-xs" />
                  <Input value={importingProduct.originalPrice} onChange={(e) => setImportingProduct({...importingProduct, originalPrice: e.target.value})} placeholder="Original" className="text-xs" />
                  <Input value={importingProduct.discount} onChange={(e) => setImportingProduct({...importingProduct, discount: e.target.value})} placeholder="Tag" className="text-xs" />
               </div>
               <button onClick={handlePost} disabled={isSaving} className="w-full bg-blue-600 text-white py-3 rounded-xl font-black text-xs flex justify-center items-center gap-2">
                 {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <><Save className="w-4 h-4" /> POSTAR NA VITRINE</>}
               </button>
            </div>
          )}
        </div>
      )}

      {/* Grid de Itens: 4 colunas mobile / 8 colunas desktop */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 md:gap-4">
          {filteredProducts.map((item) => (
            <div 
              key={item.id} 
              onClick={() => handleProductClick(item)}
              className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer relative"
            >
              <div className="relative aspect-square overflow-hidden bg-white">
                <img src={item.image} className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500" />
                {item.discount && (
                  <div className="absolute top-1 left-1 bg-green-500 text-white text-[8px] font-black px-1 rounded shadow-sm">
                    {item.discount}
                  </div>
                )}
              </div>
              
              <div className="p-2 space-y-1 flex-1 flex flex-col">
                <h3 className="text-[10px] md:text-xs font-bold text-foreground line-clamp-2 leading-tight flex-1">
                  {item.title}
                </h3>
                
                <div>
                  {item.original_price && (
                    <span className="text-[8px] line-through text-muted-foreground block">R$ {item.original_price}</span>
                  )}
                  <div className="text-xs md:text-sm font-black text-blue-500 leading-none">R$ {item.price}</div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                  <div className="flex items-center gap-0.5 text-[8px] text-muted-foreground">
                    <Sparkles className="w-2 h-2 text-amber-500 fill-amber-500" />
                    {item.clicks || 0}
                  </div>
                  {isAdmin && (
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="p-1 text-red-500 hover:bg-red-500/10 rounded-md">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !loading && (
        /* Estado Vazio Amigável */
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-700">
          <div className="bg-accent/20 p-6 rounded-full mb-4">
            <PackageSearch className="w-12 h-12 text-muted-foreground opacity-30" />
          </div>
          <h3 className="text-xl font-black text-foreground">Puxa, esse bico tá difícil de achar!</h3>
          <p className="text-muted-foreground text-sm max-w-[250px] mt-2 font-medium leading-relaxed">
            Não encontramos nada para "<span className="text-blue-500 font-bold">{searchTerm}</span>". 
            Mas relaxa! Todo dia garimpamos as melhores ofertas de hardware para você.
          </p>
          <button 
            onClick={() => setSearchTerm('')}
            className="mt-6 px-6 py-3 bg-foreground text-background rounded-xl font-black text-xs hover:scale-105 transition-all shadow-lg active:scale-95"
          >
            VER TUDO NOVAMENTE
          </button>
        </div>
      )}
    </div>
  );
}
