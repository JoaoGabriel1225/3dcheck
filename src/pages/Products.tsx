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
import { PackageSearch, Plus, Image as ImageIcon, Trash2, Eye, EyeOff, Edit2, Wand2 } from 'lucide-react';

export default function Products() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [file, setFile] = useState<File | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [discount, setDiscount] = useState('');
  
  // Calculator state
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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [profile]);

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
      let finalPriceNum = parseFloat(price.toString().replace(',', '.')) || 0;
      let costTotalNum = calculatedCost;
      let profitMarginNum = parseFloat(profitMargin) || 0;
      let discountNum = parseFloat(discount.toString().replace(',', '.')) || 0;

      const productPayload = {
        name,
        description,
        final_price: finalPriceNum,
        cost_total: costTotalNum,
        profit_margin: profitMarginNum,
        discount: discountNum,
        stock_quantity: parseInt(stock, 10) || 0,
        is_public: isPublic
      };

      let productData;
      let productError;

      if (editingProductId) {
        const result = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', editingProductId)
          .select()
          .single();
        productData = result.data;
        productError = result.error;
      } else {
        const result = await supabase
          .from('products')
          .insert({
            user_id: profile.id,
            ...productPayload
          })
          .select()
          .single();
        productData = result.data;
        productError = result.error;
      }
        
      if (productError) throw productError;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${productData.id}-${Math.random()}.${fileExt}`;
        const filePath = `${profile.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

          await supabase
            .from('product_images')
            .insert({
              product_id: productData.id,
              url: publicUrlData.publicUrl
            });
            
          await supabase
            .from('products')
            .update({ main_image_url: publicUrlData.publicUrl })
            .eq('id', productData.id);
        }
      }

      toast.success('Produto salvo com sucesso!');
      setIsDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (err: any) {
      toast.error('Erro ao salvar produto: ' + err.message);
    }
  };

  const deleteProduct = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Deseja realmente excluir este produto?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast.success('Produto excluído com sucesso.');
      fetchProducts();
    } catch (err: any) {
      toast.error('Erro ao excluir produto: ' + err.message);
    }
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

    if (product.cost_total > 0 && product.profit_margin > 0) {
      setOtherCosts(product.cost_total.toString());
    }

    setIsDialogOpen(true);
  };

  const toggleVisibility = async (product: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_public: !product.is_public })
        .eq('id', product.id);
      
      if (error) throw error;
      toast.success(product.is_public ? 'Produto ocultado da loja.' : 'Produto visível na loja.');
      fetchProducts();
    } catch (err: any) {
      toast.error('Erro ao alterar visibilidade: ' + err.message);
    }
  };

  const resetForm = () => {
    setEditingProductId(null);
    setName('');
    setDescription('');
    setPrice('');
    setStock('0');
    setFile(null);
    setIsPublic(true);
    setDiscount('');
    setFilamentPrice('');
    setGramsUsed('');
    setEnergyCost('');
    setMachineCost('');
    setPrintTime('');
    setOtherCosts('');
    setProfitMargin('');
    setCalculatedCost(0);
    setSuggestedPrice('0.00');
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Produtos</h2>
          <p className="text-muted-foreground font-medium mt-1">Gerencie seu catálogo de impressão 3D.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if(!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="h-11 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 gap-2 transition-all hover:scale-105 active:scale-95">
              <Plus className="w-5 h-5" /> Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border-border bg-card shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Configurar Produto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveProduct} className="space-y-6 pt-2">
               <div className="space-y-4">
                 <div className="space-y-2">
                   <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Nome do Produto</Label>
                   <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="h-11 rounded-xl border-slate-200" />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Descrição</Label>
                   <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required className="rounded-xl border-slate-200 min-h-[80px]" />
                 </div>
                 
                 <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-border">
                   <Switch id="is-public" checked={isPublic} onCheckedChange={setIsPublic} />
                   <Label htmlFor="is-public" className="font-bold text-slate-600 text-sm">Visível na Loja Pública</Label>
                 </div>
               </div>

              <div className="space-y-4 pt-4 border-t border-border/50">
                <Label className="font-bold text-foreground text-base">Custos e Precificação</Label>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl space-y-4 border border-border">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="filPrice" className="font-black text-slate-500 text-[9px] uppercase tracking-wider">Custo Filamento / KG</Label>
                      <Input id="filPrice" type="number" step="0.01" value={filamentPrice} onChange={(e) => setFilamentPrice(e.target.value)} required className="h-9 bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gUsed" className="font-black text-slate-500 text-[9px] uppercase tracking-wider">Gramas Utilizadas</Label>
                      <Input id="gUsed" type="number" step="0.01" value={gramsUsed} onChange={(e) => setGramsUsed(e.target.value)} required className="h-9 bg-background" />
                    </div>
                  </div>
                  
                  <div className="border-t border-border pt-4 flex flex-col gap-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-slate-500">Custo Total:</span>
                      <span className="font-bold">R$ {calculatedCost.toFixed(2)}</span>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pMargin" className="font-black text-blue-600 text-[9px] uppercase tracking-wider">Margem de Lucro (%)</Label>
                      <Input id="pMargin" type="number" step="0.01" value={profitMargin} onChange={(e) => setProfitMargin(e.target.value)} required className="bg-blue-50/50 border-blue-100 h-10 font-bold" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 items-end">
                  <div className="space-y-3">
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-500/20 p-2.5 rounded-xl flex justify-between items-center">
                       <div>
                         <Label className="font-black text-emerald-700 text-[9px] uppercase tracking-wider block">Sugestão</Label>
                         <span className="font-black text-emerald-600 text-sm">R$ {suggestedPrice}</span>
                       </div>
                       <Button 
                         type="button" 
                         variant="outline" 
                         size="sm" 
                         onClick={() => setPrice(suggestedPrice)} 
                         className="h-7 px-2 text-[10px] border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                       >
                         <Wand2 className="w-3 h-3 mr-1" /> Usar
                       </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-[10px] font-black uppercase text-slate-500">Preço Final (R$)</Label>
                      <Input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required className="h-11 rounded-xl border-slate-300 font-bold" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discount" className="text-[10px] font-black uppercase text-slate-500">Desconto (R$)</Label>
                    <Input id="discount" type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} className="h-11 rounded-xl" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="space-y-2">
                  <Label htmlFor="stock" className="text-[10px] font-black uppercase text-slate-500">Estoque</Label>
                  <Input id="stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} required className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Imagem</Label>
                  <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="h-11 rounded-xl border-dashed pt-2 text-xs" />
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full h-12 font-black bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xl shadow-blue-500/20">
                  {editingProductId ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          <p className="font-bold text-slate-400 animate-pulse tracking-widest py-10 col-span-full text-center">CARREGANDO CATÁLOGO...</p>
        ) : products.length === 0 ? (
          <p className="text-slate-500 font-medium col-span-full py-10 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">Comece adicionando seu primeiro produto!</p>
        ) : (
          products.map((product) => {
             const hasDiscount = product.discount > 0;
             const finalPriceWithDiscount = product.final_price - (product.discount || 0);

             return (
              <Card key={product.id} className="overflow-hidden flex flex-col group rounded-3xl border-border bg-card/40 backdrop-blur-sm hover:border-blue-500/30 hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300">
                  <div className="aspect-square bg-slate-100 dark:bg-slate-900 flex items-center justify-center relative overflow-hidden">
                    {product.main_image_url || (product.product_images && product.product_images[0]) ? (
                      <img src={product.main_image_url || product.product_images[0].url} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-slate-300" />
                    )}
                    
                    <div className="absolute top-3 left-3">
                        <div className="bg-white/80 dark:bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-border shadow-sm">
                          {product.is_public ? 'Visível' : 'Oculto'}
                        </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <h3 className="font-black text-lg text-foreground tracking-tight line-clamp-1 mb-1">{product.name}</h3>
                    <p className="text-muted-foreground text-xs font-medium line-clamp-2 leading-relaxed mb-4 flex-1">{product.description}</p>
                    
                    <div className="flex items-center justify-between mb-6 pt-4 border-t border-border/30">
                      <div className="flex flex-col">
                        {hasDiscount && (
                          <span className="text-[10px] font-bold text-slate-400 line-through">R$ {product.final_price?.toFixed(2)}</span>
                        )}
                        <span className={`text-xl font-black tracking-tighter ${hasDiscount ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                          R$ {hasDiscount ? finalPriceWithDiscount.toFixed(2) : product.final_price?.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Estoque</span>
                        <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{product.stock_quantity} un</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" size="sm" onClick={(e) => toggleVisibility(product, e)} className="h-9 rounded-xl border-border text-slate-500 hover:text-foreground text-[10px] font-black uppercase">
                        {product.is_public ? <EyeOff className="h-3.5 w-3.5 mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
                        {product.is_public ? 'Ocultar' : 'Exibir'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={(e) => handleEditClick(product, e)} className="h-9 rounded-xl border-border text-slate-500 hover:text-blue-600 text-[10px] font-black uppercase">
                        <Edit2 className="h-3.5 w-3.5 mr-1" /> Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={(e) => deleteProduct(product.id, e)} className="h-9 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors text-[10px] font-black uppercase">
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
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
