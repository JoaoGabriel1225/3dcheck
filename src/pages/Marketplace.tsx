import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { ProductImporter } from '../components/ProductImporter'; 
import { Card, CardContent } from '../../components/ui/card'; 
import { Input } from '../../components/ui/input';
import { 
  Search, ExternalLink, Trash2, Save, Pencil,
  Loader2, Sparkles, PackageSearch, Trophy
} from 'lucide-react';
import { toast } from 'sonner';

export default function Marketplace() {
  const { profile, user } = useAuth(); 
  const [importingProduct, setImportingProduct] = useState<any>(null);
  const [savedProducts, setSavedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent'); 
  const [activeCategory, setActiveCategory] = useState('Todos');

  const categories = ['Todos', 'Impressoras', 'Filamentos', 'Bicos', 'Hardware', 'Acessórios'];

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

  async function handleProductClick(product: any) {
    window.open(product.url, '_blank', 'noopener,noreferrer');
    await supabase
      .from('marketplace_products')
      .update({ clicks: (product.clicks || 0) + 1 })
      .eq('id', product.id);
  }

  // Função unificada para Postar novo ou Atualizar existente
  async function handlePost() {
    if (!importingProduct) return;
    setIsSaving(true);
    try {
      const productData = {
        title: importingProduct.title,
        description: importingProduct.description,
        price: importingProduct.price,
        original_price: importingProduct.originalPrice || importingProduct.original_price,
        discount: importingProduct.discount,
        image: importingProduct.image,
        url: importingProduct.url,
        user_id: user?.id,
      };

      let error;
      if (importingProduct.id) {
        // Se tem ID, atualiza
        const { error: updateError } = await supabase
          .from('marketplace_products')
          .update(productData)
          .eq('id', importingProduct.id);
        error = updateError;
      } else {
        // Se não tem ID, insere novo
        const { error: insertError } = await supabase
          .from('marketplace_products')
          .insert([{ ...productData, clicks: 0 }]);
        error = insertError;
      }

      if (error) throw error;
      toast.success(importingProduct.id ? 'Produto atualizado!' : 'Produto postado!');
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

  const filteredProducts = savedProducts
    .filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'Todos' || 
                             p.title.toLowerCase().includes(activeCategory.toLowerCase()) ||
                             (p.description && p.description.toLowerCase().includes(activeCategory.toLowerCase()));
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const priceA = parseFloat(a.price.replace(/[^\d]/g, ''));
      const priceB = parseFloat(b.price.replace(/[^\d]/g, ''));
      if (sortBy === 'price_asc') return priceA - priceB;
      if (sortBy === 'price_desc') return priceB - priceA;
      if (sortBy === 'popular') return (b.clicks || 0) - (a.clicks || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const topProductId = filteredProducts.length > 0 
    ? [...filteredProducts].sort((a, b) => (b.clicks || 0) - (a.clicks || 0))[0].id 
    : null;

  return (
    <div className="space-y-8 pb-20 px-4 md:px-0">
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tight text-foreground uppercase">
            Marketplace <span className="text-blue-500">Hub</span>
          </h2>
          <p className="text-muted-foreground font-medium">Curadoria técnica de equipamentos e insumos.</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-full text-xs font-black transition-all whitespace-nowrap border-2 ${
                activeCategory === cat 
                ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                : 'bg-transparent border-accent/20 text-muted-foreground hover:border-blue-500/30'
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
            <Input 
              placeholder="Buscar no catálogo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 rounded-2xl bg-accent/20 border-none text-base focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-14 px-6 rounded-2xl bg-accent/20 text-sm font-bold outline-none border-none cursor-pointer hover:bg-accent/30 transition-colors"
          >
            <option value="recent">Adicionados recentemente</option>
            <option value="popular">Mais procurados</option>
            <option value="price_asc">Menor preço</option>
            <option value="price_desc">Maior preço</option>
          </select>
        </div>
      </div>

      {/* ÁREA ADMINISTRATIVA: Importador e Edição */}
      {isAdmin && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500 bg-blue-500/5 p-6 rounded-[2.5rem] border border-dashed border-blue-500/20">
          <ProductImporter onImport={(data: any) => setImportingProduct(data)} />
          {importingProduct && (
            <div className="mt-6 p-6 bg-background rounded-3xl border border-blue-500/20 space-y-6">
               <div className="flex gap-6 items-center">
                  <img src={importingProduct.image} className="w-24 h-24 rounded-2xl object-cover shadow-lg" />
                  <div className="flex-1 space-y-2">
                    <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest">
                      {importingProduct.id ? 'Editando Produto' : 'Revisão de Título'}
                    </span>
                    <Input value={importingProduct.title} onChange={(e) => setImportingProduct({...importingProduct, title: e.target.value})} className="font-bold" />
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-muted-foreground ml-1">Preço Atual</span>
                    <Input value={importingProduct.price} onChange={(e) => setImportingProduct({...importingProduct, price: e.target.value})} className="font-black text-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-muted-foreground ml-1">Preço Original</span>
                    <Input value={importingProduct.originalPrice || importingProduct.original_price} onChange={(e) => setImportingProduct({...importingProduct, originalPrice: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-muted-foreground ml-1">Tag de Desconto</span>
                    <Input value={importingProduct.discount} onChange={(e) => setImportingProduct({...importingProduct, discount: e.target.value})} className="text-green-500 font-bold" />
                  </div>
               </div>
               <div className="flex gap-3">
                 <button onClick={handlePost} disabled={isSaving} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black flex justify-center items-center gap-2 hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20">
                   {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <><Save className="w-5 h-5" /> {importingProduct.id ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR POSTAGEM'}</>}
                 </button>
                 <button onClick={() => setImportingProduct(null)} className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all">
                   <Trash2 className="w-6 h-6" />
                 </button>
               </div>
            </div>
          )}
        </div>
      )}

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filteredProducts.map((item) => (
            <div 
              key={item.id} 
              onClick={() => handleProductClick(item)}
              className={`group bg-card border rounded-[2rem] overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col cursor-pointer relative ${
                item.id === topProductId ? 'border-blue-500/40 shadow-blue-500/5' : 'border-border'
              }`}
            >
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                {item.id === topProductId && (
                  <div className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> TOP ESCOLHA
                  </div>
                )}
                {item.discount && (
                  <div className="bg-green-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg">
                    {item.discount}
                  </div>
                )}
              </div>

              <div className="relative aspect-square overflow-hidden bg-white p-4">
                <img src={item.image} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" />
              </div>
              
              <div className="p-5 space-y-3 flex-1 flex flex-col">
                <h3 className="text-sm md:text-base font-black text-foreground line-clamp-2 leading-tight flex-1">
                  {item.title}
                </h3>
                
                <div className="space-y-1">
                  {(item.original_price || item.originalPrice) && (
                    <span className="text-[10px] md:text-xs line-through text-muted-foreground/60 font-bold">R$ {item.original_price || item.originalPrice}</span>
                  )}
                  <div className="text-xl md:text-2xl font-black text-blue-500 tracking-tighter leading-none">R$ {item.price}</div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <div className="h-4">
                    {(item.clicks || 0) > 100 && (
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-black">
                        <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                        {item.clicks} VISITAS
                      </div>
                    )}
                  </div>
                  
                  {/* BOTÕES DE ADMIN: Apenas visíveis para o ADM */}
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setImportingProduct(item); // Carrega o produto no formulário superior
                          window.scrollTo({ top: 0, behavior: 'smooth' }); // Sobe a página para editar
                        }} 
                        className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} 
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {!isAdmin && <ExternalLink className="w-4 h-4 text-muted-foreground/30 group-hover:text-blue-500 transition-colors" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !loading && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="bg-blue-500/10 p-10 rounded-full mb-8">
            <PackageSearch className="w-20 h-20 text-blue-500 opacity-40" />
          </div>
          <h2 className="text-3xl font-black text-foreground uppercase tracking-tight">Pesquisa sem resultados</h2>
          <button 
            onClick={() => { setSearchTerm(''); setActiveCategory('Todos'); }}
            className="mt-10 px-10 py-4 bg-foreground text-background rounded-2xl font-black text-xs hover:scale-105 transition-all shadow-2xl active:scale-95 uppercase tracking-widest"
          >
            Ver catálogo completo
          </button>
        </div>
      )}
    </div>
  );
}
