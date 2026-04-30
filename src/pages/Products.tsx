import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  PackageSearch, 
  Plus, 
  Image as ImageIcon, 
  Trash2, 
  Eye, 
  EyeOff, 
  Edit2, 
  Wand2, 
  Settings2, 
  Coins, 
  Clock, 
  Zap,
  Tag
} from 'lucide-react';

export default function Products() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [file, setFile] = useState<File | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [discount, setDiscount] = useState('');
  
  const [filamentPrice, setFilamentPrice] = useState('');
  const [gramsUsed, setGramsUsed] = useState('');
  const [energyCost, setEnergyCost] = useState('');
  const [machineCost, setMachineCost] = useState('');
  const [printTime, setPrintTime] = useState('');
  const [otherCosts, setOtherCosts] = useState('');
  const [profitMargin, setProfitMargin] = useState('');
  const [calculatedCost, setCalculatedCost] = useState(0);
  const [suggestedPrice, setSuggestedPrice] = useState('0.00');

  const fetchProducts = async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`*, product_images(url)`)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, [profile]);

  useEffect(() => {
    const fPrice = parseFloat(filamentPrice) || 0;
    const gUsed = parseFloat(gramsUsed) || 0;
    const materialCost = (fPrice / 1000) * gUsed;
    const eCost = parseFloat(energyCost) || 0;
    const mCost = parseFloat(machineCost) || 0;
    const pTime = parseFloat(printTime) || 0;
    const oCosts = parseFloat(otherCosts) || 0;
    const extraCost = (eCost + mCost) * pTime + oCosts;
    const cTotal = materialCost + extraCost;
    setCalculatedCost(cTotal);
    const margin = parseFloat(profitMargin) || 0;
    const calcPrice = cTotal * (1 + margin / 100);
    setSuggestedPrice(calcPrice.toFixed(2));
  }, [filamentPrice, gramsUsed, energyCost, machineCost, printTime, otherCosts, profitMargin]);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      const productPayload = {
        name,
        description,
        final_price: parseFloat(price.toString().replace(',', '.')) || 0,
        cost_total: calculatedCost,
        profit_margin: parseFloat(profitMargin) || 0,
        discount: parseFloat(discount.toString().replace(',', '.')) || 0,
        stock_quantity: parseInt(stock, 10) || 0,
        is_public: isPublic
      };

      let productData, productError;
      if (editingProductId) {
        const result = await supabase.from('products').update(productPayload).eq('id', editingProductId).select().single();
        productData = result.data; productError = result.error;
      } else {
        const result = await supabase.from('products').insert({ user_id: profile.id, ...productPayload }).select().single();
        productData = result.data; productError = result.error;
      }
      if (productError) throw productError;

      if (file) {
        const fileName = `${productData.id}-${Math.random()}.${file.name.split('.').pop()}`;
        const filePath = `${profile.id}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, file);
        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
          await supabase.from('product_images').insert({ product_id: productData.id, url: publicUrlData.publicUrl });
          await supabase.from('products').update({ main_image_url: publicUrlData.publicUrl }).eq('id', productData.id);
        }
      }
      toast.success('Produto salvo!'); setIsDialogOpen(false); resetForm(); fetchProducts();
    } catch (err: any) { toast.error('Erro: ' + err.message); }
  };

  const deleteProduct = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Excluir este produto?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast.success('Produto removido.'); fetchProducts();
    } catch (err: any) { toast.error('Erro ao excluir.'); }
  };

  const handleEditClick = (product: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingProductId(product.id);
    setName(product.name || '');
    setDescription(product.description || '');
    setPrice(product.final_price?.toString() || '');
    setStock(product.stock_quantity?.toString() || '0');
    setIsPublic(product.is_public ?? true);
    setDiscount(product.discount?.toString() || '');
    setProfitMargin(product.profit_margin?.toString() || '');
    setCalculatedCost(product.cost_total || 0);
    setIsDialogOpen(true);
  };

  const toggleVisibility = async (product: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const { error } = await supabase.from('products').update({ is_public: !product.is_public }).eq('id', product.id);
      if (error) throw error;
      toast.success(product.is_public ? 'Produto ocultado.' : 'Produto visível.');
      fetchProducts();
    } catch (err: any) { toast.error('Erro ao alterar visibilidade.'); }
  };

  const resetForm = () => {
    setEditingProductId(null); setName(''); setDescription(''); setPrice(''); setStock('0');
    setFile(null); setIsPublic(true); setDiscount(''); setFilamentPrice(''); setGramsUsed('');
    setEnergyCost(''); setMachineCost(''); setPrintTime(''); setOtherCosts(''); setProfitMargin('');
    setCalculatedCost(0); setSuggestedPrice('0.00');
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-[0.2em]">
            <PackageSearch className="w-4 h-4" />
            Catálogo
          </div>
          <h2 className="text-4xl font-black tracking-tight text-foreground">Produtos</h2>
          <p className="text-muted-foreground font-medium">Cadastre suas peças e use a calculadora inteligente.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="h-12 px-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-lg shadow-blue-500/20 gap-2 transition-all hover:scale-105 active:scale-95">
              <Plus className="w-5 h-5" /> Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-border bg-card shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Configurar Produto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveProduct} className="space-y-8 pt-4">
               {/* INFO BÁSICA */}
               <div className="grid gap-4">
                 <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Nome da Peça</Label>
                   <Input value={name} onChange={(e) => setName(e.target.value)} required className="h-11 rounded-xl" placeholder="Ex: Action Figure Batman" />
                 </div>
                 <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Descrição Técnica</Label>
                   <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl min-h-[100px]" placeholder="Material, escala, tempo médio..." />
                 </div>
                 <div className="flex items-center gap-3 bg-accent/30 p-3 rounded-xl border border-border">
                   <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                   <Label className="font-bold text-sm">Disponível no Catálogo Público</Label>
                 </div>
               </div>

               {/* CALCULADORA INTELIGENTE */}
               <div className="bg-accent/50 p-6 rounded-2xl border border-border space-y-6">
                 <div className="flex items-center gap-2 text-blue-500 font-black text-[11px] uppercase tracking-widest">
                   <Settings2 className="w-4 h-4" /> Calculadora de Custos
                 </div>
                 
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                   <div className="space-y-2">
                     <Label className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1"><Coins className="w-3 h-3" /> Filamento/KG</Label>
                     <Input type="number" value={filamentPrice} onChange={(e) => setFilamentPrice(e.target.value)} className="h-10 rounded-lg bg-background" placeholder="R$ 120.00" />
                   </div>
                   <div className="space-y-2">
                     <Label className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1"><Tag className="w-3 h-3" /> Peso (G)</Label>
                     <Input type="number" value={gramsUsed} onChange={(e) => setGramsUsed(e.target.value)} className="h-10 rounded-lg bg-background" placeholder="150g" />
                   </div>
                   <div className="space-y-2">
                     <Label className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Horas</Label>
                     <Input type="number" value={printTime} onChange={(e) => setPrintTime(e.target.value)} className="h-10 rounded-lg bg-background" placeholder="8h" />
                   </div>
                 </div>

                 <div className="flex flex-col sm:flex-row justify-between items-center gap-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                   <div>
                     <Label className="text-[10px] font-black uppercase text-emerald-600 block mb-1">Preço Sugerido (Custo + Margem)</Label>
                     <div className="text-3xl font-black text-emerald-500">R$ {suggestedPrice}</div>
                   </div>
                   <div className="flex gap-4 items-end">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-blue-600">Margem %</Label>
                        <Input type="number" value={profitMargin} onChange={(e) => setProfitMargin(e.target.value)} className="h-10 w-24 border-blue-500/30 bg-background font-bold" />
                      </div>
                      <Button type="button" onClick={() => setPrice(suggestedPrice)} className="h-10 bg-emerald-500 hover:bg-emerald-600 text-white font-black px-4 rounded-lg gap-2">
                        <Wand2 className="w-4 h-4" /> Usar
                      </Button>
                   </div>
                 </div>
               </div>

               {/* FINALIZAÇÃO */}
               <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Preço de Venda Final (R$)</Label>
                    <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required className="h-12 text-lg font-black rounded-xl border-blue-500/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Upload de Foto</Label>
                    <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="h-12 pt-3 rounded-xl border-dashed" />
                  </div>
               </div>

               <Button type="submit" className="w-full h-14 text-lg font-black bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xl shadow-blue-500/20 transition-all">
                  Finalizar e Salvar
               </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* PRODUCT GRID */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          <div className="col-span-full py-20 text-center text-muted-foreground font-bold tracking-widest animate-pulse">Lendo catálogo...</div>
        ) : products.length === 0 ? (
          <div className="col-span-full py-20 text-center text-muted-foreground font-medium bg-accent/20 rounded-3xl border border-dashed border-border">Seu catálogo está vazio. Comece clicando em "Novo Produto".</div>
        ) : (
          products.map((product) => {
             const hasDiscount = product.discount > 0;
             const finalPrice = product.final_price - (product.discount || 0);

             return (
              <Card key={product.id} className="overflow-hidden flex flex-col group rounded-3xl border-border bg-card/40 backdrop-blur-sm hover:shadow-2xl hover:shadow-blue-500/5 hover:translate-y-[-4px] transition-all duration-300">
                  <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
                    {product.main_image_url ? (
                      <img src={product.main_image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-muted-foreground/20" />
                    )}
                    
                    <div className="absolute top-3 left-3">
                      {product.is_public ? (
                        <div className="bg-emerald-500/90 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg border border-white/20 text-white">
                          <Eye className="w-3 h-3" /> <span className="text-[9px] font-black uppercase tracking-wider">Visível</span>
                        </div>
                      ) : (
                        <div className="bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg border border-white/10 text-white">
                          <EyeOff className="w-3 h-3" /> <span className="text-[9px] font-black uppercase tracking-wider">Oculto</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <div className="flex-1 space-y-2 mb-4">
                      <h3 className="font-black text-lg text-foreground tracking-tight line-clamp-1">{product.name}</h3>
                      <p className="text-muted-foreground text-xs font-medium line-clamp-2 leading-relaxed">{product.description || 'Sem descrição técnica.'}</p>
                    </div>
                    
                    <div className="flex items-end justify-between py-4 border-t border-border/50">
                      <div>
                        {hasDiscount && <span className="text-[10px] font-bold text-muted-foreground line-through block">R$ {product.final_price?.toFixed(2)}</span>}
                        <span className={`text-2xl font-black tracking-tighter ${hasDiscount ? 'text-red-500' : 'text-foreground'}`}>
                          R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Estoque</span>
                        <span className="bg-accent px-2 py-1 rounded-lg font-bold text-xs">{product.stock_quantity} un.</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-4">
                      <Button variant="ghost" size="sm" onClick={(e) => toggleVisibility(product, e)} className="h-10 rounded-xl bg-accent/50 hover:bg-accent flex-col gap-0.5 text-[9px] font-black uppercase transition-all">
                        {product.is_public ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        {product.is_public ? 'Ocultar' : 'Mostrar'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={(e) => handleEditClick(product, e)} className="h-10 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white flex-col gap-0.5 text-[9px] font-black uppercase transition-all">
                        <Edit2 className="h-3.5 w-3.5" />
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={(e) => deleteProduct(product.id, e)} className="h-10 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex-col gap-0.5 text-[9px] font-black uppercase transition-all">
                        <Trash2 className="h-3.5 w-3.5" />
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
             );
          })
        )}
      </div>
    </div>
  );
}
