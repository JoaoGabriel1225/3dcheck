import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { ProductImporter } from '../components/ProductImporter'; 
import { Card, CardContent } from '../../components/ui/card'; 
import { Input } from '../../components/ui/input';
import { Button } from '@/components/ui/button'; 
import { Label } from '@/components/ui/label'; 
import { 
  Search, ExternalLink, Trash2, Save, Pencil,
  Loader2, Sparkles, PackageSearch, Trophy, Tag,
  ArrowUpRight, Star, ChevronDown, Plus 
} from 'lucide-react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from '@/components/ui/dialog'; 
import { Switch } from '@/components/ui/switch'; 
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function Marketplace() {
  const { profile, user } = useAuth(); 
  const [importingProduct, setImportingProduct] = useState<any>(null);
  const [savedProducts, setSavedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('discount'); 
  const [activeCategory, setActiveCategory] = useState('Todos');

  const categories = [
    'Todos', 'Impressoras 3D', 'Filamentos', 'Peças e Reposição', 
    'Ferramentas', 'Adesão e Acabamento', 'Armazenamento de Filamento', 'Upgrades'
  ];

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    fetchProducts();
  }, []);

  const getDiscountValue = (discountStr: string) => {
    if (!discountStr) return 0;
    const match = String(discountStr).match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  };

  const autoCalculateDiscount = (currentPrice: string, oldPrice: string) => {
    const p = parseFloat(String(currentPrice || "0").replace(/[^\d.,]/g, '').replace(',', '.'));
    const op = parseFloat(String(oldPrice || "0").replace(/[^\d.,]/g, '').replace(',', '.'));
    if (p && op && op > p) {
      const discountPercent = Math.round(((op - p) / op) * 100);
      return `${discountPercent}% OFF`;
    }
    return '';
  };

  async function fetchProducts() {
    try {
      const { data, error } = await supabase.from('marketplace_products').select('*');
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
    await supabase.from('marketplace_products').update({ clicks: (product.clicks || 0) + 1 }).eq('id', product.id);
  }

  async function handlePost() {
    if (!importingProduct) return;
    setIsSaving(true);
    try {
      const cleanedPrice = parseFloat(String(importingProduct.price || "0").replace(/[^\d.,]/g, '').replace(',', '.'));
      const cleanedOriginalPrice = parseFloat(String(importingProduct.original_price || importingProduct.originalPrice || "0").replace(/[^\d.,]/g, '').replace(',', '.'));

      const productData = {
        title: importingProduct.title || "Produto sem título",
        description: importingProduct.description || "",
        price: isNaN(cleanedPrice) ? 0 : cleanedPrice,
        original_price: isNaN(cleanedOriginalPrice) ? (isNaN(cleanedPrice) ? 0 : cleanedPrice) : cleanedOriginalPrice,
        discount: importingProduct.discount || "",
        image: importingProduct.image || "",
        url: importingProduct.url || "",
        category: importingProduct.category || 'Todos',
        is_featured: !!importingProduct.is_featured,
        user_id: user?.id,
      };

      let error;
      if (importingProduct.id) {
        const { error: updateError } = await supabase.from('marketplace_products').update(productData).eq('id', importingProduct.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from('marketplace_products').insert([{ ...productData, clicks: 0 }]);
        error = insertError;
      }

      if (error) throw error;
      toast.success(importingProduct.id ? 'Dados atualizados!' : 'Publicado com sucesso!');
      setImportingProduct(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar no banco');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este item da vitrine?")) return;
    try {
      const { error } = await supabase.from('marketplace_products').delete().eq('id', id);
      if (error) throw error;
      setSavedProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Removido');
    } catch (err) {
      toast.error('Erro ao deletar');
    }
  }

  const filteredProducts = savedProducts
    .filter(p => {
      // CORREÇÃO: Adicionada segurança (p.title || "") para evitar que a lista suma se houver dados nulos
      const title = p.title || "";
      const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'Todos' || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      if (sortBy === 'discount') return getDiscountValue(b.discount) - getDiscountValue(a.discount);
      
      // CORREÇÃO: Segurança no sort para campos de preço antigos
      const priceA = parseFloat(String(a.price || 0).replace(/[^\d]/g, '')) || 0;
      const priceB = parseFloat(String(b.price || 0).replace(/[^\d]/g, '')) || 0;
      
      if (sortBy === 'price_asc') return priceA - priceB;
      if (sortBy === 'price_desc') return priceB - priceA;
      if (sortBy === 'popular') return (b.clicks || 0) - (a.clicks || 0);
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-8 pb-20 px-4 md:px-0">
      <div className="flex flex-col gap-6">
        <motion.div variants={itemVariants} className="space-y-2">
          <h2 className="text-4xl font-black tracking-tight text-foreground uppercase">
            Marketplace <span className="text-blue-500">Hub</span>
          </h2>
          <p className="text-muted-foreground font-medium">Curadoria de itens para alta performance 3D.</p>
        </motion.div>

        <motion.div variants={itemVariants} className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          {categories.map((cat) => {
            const count = savedProducts.filter(p => cat === 'Todos' ? true : p.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-[10px] font-black transition-all flex items-center gap-2 border-2 ${
                  activeCategory === cat ? 'bg-blue-600 border-blue-600 text-white shadow-xl scale-105' : 'bg-card border-border text-muted-foreground hover:border-blue-500/40'
                }`}
              >
                {cat.toUpperCase()}
                <span className={`px-1.5 py-0.5 rounded-md text-[8px] ${activeCategory === cat ? 'bg-white/20' : 'bg-accent text-accent-foreground'}`}>{count}</span>
              </button>
            );
          })}
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
            <Input 
              placeholder="Pesquisar por título ou marca..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 rounded-2xl bg-card border-border border-2 text-base focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>
          <div className="relative">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-14 pl-6 pr-10 rounded-2xl bg-card border-2 border-border text-sm font-black outline-none cursor-pointer appearance-none hover:border-blue-500/40 transition-all"
            >
              <option value="discount">Maior Desconto %</option>
              <option value="popular">Mais Visitados</option>
              <option value="price_asc">Menor Preço R$</option>
              <option value="price_desc">Maior Preço R$</option>
              <option value="recent">Lançamentos</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none opacity-50" />
          </div>
        </motion.div>
      </div>

      {isAdmin && (
        <motion.div variants={itemVariants} className="bg-blue-600/5 p-8 rounded-[2.5rem] border-2 border-dashed border-blue-500/20">
          <div className="flex flex-col items-center text-center space-y-4 mb-6">
             <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-600/20"><Plus /></div>
             <div>
                <h3 className="font-black uppercase text-sm tracking-widest">Painel de Curadoria</h3>
                <p className="text-xs text-muted-foreground">Insira o link do Mercado Livre, AliExpress ou Shopee.</p>
             </div>
          </div>
          <ProductImporter onImport={(data: any) => {
            // NORMALIZAÇÃO PARA ALIEXPRESS/SHOPEE: Garante que os dados sejam interpretados corretamente
            const normalizedData = {
              ...data,
              title: data.title || "Novo Produto",
              price: String(data.price || "0").replace(/[^\d.,]/g, ''),
              original_price: String(data.original_price || data.originalPrice || data.price || "0").replace(/[^\d.,]/g, ''),
              is_featured: false,
              user_id: user?.id,
            };
            setImportingProduct(normalizedData);
          }} />
        </motion.div>
      )}

      <Dialog open={!!importingProduct} onOpenChange={(open) => !open && setImportingProduct(null)}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] border-border shadow-2xl p-8 overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-2">
              <Sparkles className="text-blue-500" /> REVISÃO TÉCNICA
            </DialogTitle>
            <DialogDescription>Ajuste os detalhes finais antes de publicar na vitrine.</DialogDescription>
          </DialogHeader>

          {importingProduct && (
            <div className="space-y-6 pt-4">
               <div className="flex gap-6 p-4 bg-accent/20 rounded-3xl items-center border border-border">
                  <img src={importingProduct.image} className="w-24 h-24 rounded-2xl object-cover shadow-lg border-2 border-white" />
                  <div className="flex-1 space-y-3">
                    <Label className="text-[10px] font-black uppercase text-blue-500">Título do Produto</Label>
                    <Input value={importingProduct.title} onChange={(e) => setImportingProduct({...importingProduct, title: e.target.value})} className="font-bold h-12 rounded-xl" />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase ml-1">Categoria</Label>
                    <select 
                        value={importingProduct.category || ''} 
                        onChange={(e) => setImportingProduct({...importingProduct, category: e.target.value})}
                        className="w-full h-12 px-4 rounded-xl bg-muted border-none font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="">Selecione...</option>
                        {categories.filter(c => c !== 'Todos').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase ml-1">Destaque Manual</Label>
                    <div className="flex items-center justify-between h-12 px-4 bg-muted rounded-xl border border-blue-500/10">
                       <span className="text-xs font-bold text-blue-600 uppercase flex items-center gap-2">
                         <Star className={`w-4 h-4 ${importingProduct.is_featured ? 'fill-blue-600' : ''}`} /> TOP ESCOLHA
                       </span>
                       <Switch 
                         checked={importingProduct.is_featured} 
                         onCheckedChange={(val) => setImportingProduct({...importingProduct, is_featured: val})} 
                       />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-blue-600 ml-1">Preço com Desconto (R$)</Label>
                    <Input 
                      value={importingProduct.price} 
                      onChange={(e) => {
                        const newP = e.target.value;
                        setImportingProduct({
                          ...importingProduct, 
                          price: newP,
                          discount: autoCalculateDiscount(newP, importingProduct.original_price || importingProduct.price)
                        });
                      }} 
                      className="font-black h-12 rounded-xl border-blue-500/20" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase ml-1">Preço Original (R$)</Label>
                    <Input 
                      value={importingProduct.original_price} 
                      onChange={(e) => {
                        const newOp = e.target.value;
                        setImportingProduct({
                          ...importingProduct, 
                          original_price: newOp,
                          discount: autoCalculateDiscount(importingProduct.price, newOp)
                        });
                      }}
                      className="h-12 rounded-xl"
                    />
                  </div>
               </div>

               <div className="flex gap-4 pt-4 border-t border-border">
                  <Button onClick={() => setImportingProduct(null)} variant="outline" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest">Cancelar</Button>
                  <Button onClick={handlePost} disabled={isSaving} className="flex-[2] h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black shadow-xl shadow-blue-500/20 gap-2">
                    {isSaving ? <Loader2 className="animate-spin" /> : <><Save className="w-5 h-5" /> {importingProduct.id ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR E POSTAR'}</>}
                  </Button>
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
        <AnimatePresence mode="popLayout">
          {filteredProducts.map((item) => (
            <motion.div 
              layout
              key={item.id} 
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => handleProductClick(item)}
              className={`group bg-card border-2 rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col cursor-pointer relative ${
                item.is_featured ? 'border-blue-500/40 shadow-blue-500/5 ring-1 ring-blue-500/20' : 'border-border'
              }`}
            >
              <div className="absolute top-5 left-5 flex flex-col gap-2 z-20">
                {item.is_featured && <div className="bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-xl flex items-center gap-1.5 animate-pulse"><Trophy className="w-3.5 h-3.5" /> TOP ESCOLHA</div>}
                {item.discount && <div className="bg-emerald-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg">{item.discount}</div>}
              </div>
              <div className="relative aspect-square overflow-hidden bg-white p-6">
                <img src={item.image} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" />
              </div>
              <div className="p-6 space-y-4 flex-1 flex flex-col">
                <div className="space-y-2 flex-1">
                  <span className="text-[9px] font-black uppercase text-muted-foreground/60">{item.category}</span>
                  <h3 className="text-sm md:text-base font-black text-foreground line-clamp-2 leading-tight uppercase italic">{item.title}</h3>
                </div>
                <div className="pt-4 border-t border-border/50">
                  <div className="flex flex-col">
                    {item.original_price && item.original_price !== item.price && <span className="text-[10px] line-through text-muted-foreground/50 font-bold">R$ {item.original_price}</span>}
                    <div className="flex items-center justify-between">
                       <div className="text-2xl font-black text-blue-600">R$ {item.price}</div>
                       <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600 opacity-0 group-hover:opacity-100 transition-all"><ArrowUpRight className="w-4 h-4" /></div>
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-2 pt-2">
                    <button onClick={(e) => { e.stopPropagation(); setImportingProduct(item); }} className="flex-1 flex items-center justify-center gap-2 py-2 bg-accent/50 rounded-xl text-[10px] font-black hover:bg-blue-500 hover:text-white transition-all"><Pencil className="w-3 h-3" /> EDITAR</button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors border border-red-500/10"><Trash2 className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {!loading && filteredProducts.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-32 text-center">
          <PackageSearch className="w-24 h-24 text-muted-foreground/20 mb-8" />
          <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Nenhum tesouro encontrado</h2>
          <button onClick={() => { setSearchTerm(''); setActiveCategory('Todos'); }} className="mt-10 px-8 py-4 bg-foreground text-background rounded-2xl font-black text-[10px] uppercase">Limpar Busca</button>
        </motion.div>
      )}
    </motion.div>
  );
}
