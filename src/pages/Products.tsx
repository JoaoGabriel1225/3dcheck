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
import { PackageSearch, Plus, Image as ImageIcon, Trash2, Eye, EyeOff, Edit2 } from 'lucide-react';

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
  const [useCalculator, setUseCalculator] = useState(false);
  const [filamentPrice, setFilamentPrice] = useState('');
  const [gramsUsed, setGramsUsed] = useState('');
  const [energyCost, setEnergyCost] = useState('');
  const [machineCost, setMachineCost] = useState('');
  const [printTime, setPrintTime] = useState('');
  const [otherCosts, setOtherCosts] = useState('');
  const [profitMargin, setProfitMargin] = useState('');
  const [calculatedCost, setCalculatedCost] = useState(0);

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
  if (!useCalculator) return;

  const fPrice = parseFloat(filamentPrice);
  const gUsed = parseFloat(gramsUsed);
  const eCost = parseFloat(energyCost);
  const mCost = parseFloat(machineCost);
  const pTime = parseFloat(printTime);
  const oCosts = parseFloat(otherCosts);
  const margin = parseFloat(profitMargin);

  const materialCost = (fPrice || 0) / 1000 * (gUsed || 0);
  const extraCost = ((eCost || 0) + (mCost || 0)) * (pTime || 0) + (oCosts || 0);
  const cTotal = materialCost + extraCost;

  setCalculatedCost(cTotal);

  const calcPrice = cTotal * (1 + (margin || 0) / 100);

  // só altera preço se estiver criando produto
  if (!editingProductId && isFinite(calcPrice)) {
    setPrice(calcPrice.toFixed(2));
  }
}, [
  useCalculator,
  filamentPrice,
  gramsUsed,
  energyCost,
  machineCost,
  printTime,
  otherCosts,
  profitMargin,
  editingProductId
]);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    try {
      let finalPriceNum = parseFloat(price.replace(',', '.')) || 0;
      let costTotalNum = useCalculator ? calculatedCost : 0;
      let profitMarginNum = parseFloat(profitMargin) || 0;
      let discountNum = parseFloat(discount.replace(',', '.')) || 0;

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

      // 2. Upload image if exists
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
      toast.error('Erro ao salvar produto', err.message);
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
      setUseCalculator(true);
      // We don't have all calculator fields saved, just final cost and margin,
      // so we can put the total cost in "otherCosts" or a similar field if we want to reverse engineer it, 
      // but for simplicity let's just place it in otherCosts to keep the math working.
      setOtherCosts(product.cost_total.toString());
    } else {
      setUseCalculator(false);
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
    setUseCalculator(false);
    setFilamentPrice('');
    setGramsUsed('');
    setEnergyCost('');
    setMachineCost('');
    setPrintTime('');
    setOtherCosts('');
    setProfitMargin('');
    setCalculatedCost(0);
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
            <Button className="font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 h-auto text-[13px]"><Plus className="mr-2 h-4 w-4" /> Novo Produto</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-xl">
            <DialogHeader>
              <DialogTitle className="font-extrabold text-foreground">Cadastrar Produto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveProduct} className="space-y-6 pt-2">
               {/* Informações Básicas */}
               <div className="space-y-4">
                 <div className="space-y-2">
                   <Label htmlFor="name" className="font-bold text-slate-700 text-xs uppercase tracking-wider">Nome do Produto</Label>
                   <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="border-slate-200" />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="description" className="font-bold text-slate-700 text-xs uppercase tracking-wider">Descrição</Label>
                   <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required className="border-slate-200" />
                 </div>
                 
                 <div className="flex items-center space-x-2">
                   <Switch id="is-public" checked={isPublic} onCheckedChange={setIsPublic} />
                   <Label htmlFor="is-public" className="font-bold text-slate-700 text-sm">Visível na Loja</Label>
                 </div>
               </div>

              {/* Precificação */}
              <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-foreground text-base">Precificação</Label>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="use-calc" className="font-medium text-muted-foreground text-xs uppercase">Usar Calculadora</Label>
                    <Switch id="use-calc" checked={useCalculator} onCheckedChange={setUseCalculator} />
                  </div>
                </div>

                {useCalculator && (
                  <div className="bg-muted/50 p-4 rounded-xl space-y-4 border border-border">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="filPrice" className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">Custo do Filamento por KG (R$)*</Label>
                        <Input id="filPrice" type="number" step="0.01" value={filamentPrice} onChange={(e) => setFilamentPrice(e.target.value)} required={useCalculator} className="border-slate-200 h-9" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gUsed" className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">Gramas Utilizadas*</Label>
                        <Input id="gUsed" type="number" step="0.01" value={gramsUsed} onChange={(e) => setGramsUsed(e.target.value)} required={useCalculator} className="border-slate-200 h-9" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="eCost" className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">Custo Energia / Hr (R$)</Label>
                        <Input id="eCost" type="number" step="0.01" value={energyCost} onChange={(e) => setEnergyCost(e.target.value)} className="border-slate-200 h-9" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mCost" className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">Custo Máquina / Hr (R$)</Label>
                        <Input id="mCost" type="number" step="0.01" value={machineCost} onChange={(e) => setMachineCost(e.target.value)} className="border-slate-200 h-9" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pTime" className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">Tempo (Horas)</Label>
                        <Input id="pTime" type="number" step="0.01" value={printTime} onChange={(e) => setPrintTime(e.target.value)} className="border-slate-200 h-9" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="oCosts" className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">Outros Custos (R$)</Label>
                        <Input id="oCosts" type="number" step="0.01" value={otherCosts} onChange={(e) => setOtherCosts(e.target.value)} className="border-slate-200 h-9" />
                      </div>
                    </div>
                    
                    <div className="border-t border-border pt-4 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-muted-foreground">Custo Total Calculado:</span>
                        <span className="font-bold text-foreground">R$ {calculatedCost.toFixed(2)}</span>
                      </div>
                      <div className="space-y-2 mt-2">
                        <Label htmlFor="pMargin" className="font-bold text-blue-700 text-[10px] uppercase tracking-wider">Margem de Lucro (%)*</Label>
                        <Input id="pMargin" type="number" step="0.01" value={profitMargin} onChange={(e) => setProfitMargin(e.target.value)} required={useCalculator} className="border-blue-200 bg-blue-50/50" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="font-bold text-slate-700 text-xs uppercase tracking-wider">Preço Final (R$)</Label>
                    <Input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required readOnly={useCalculator} className={`border-slate-200 ${useCalculator ? 'bg-slate-50 text-slate-500' : ''}`} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount" className="font-bold text-slate-700 text-xs uppercase tracking-wider">Desconto (R$ Opcional)</Label>
                    <Input id="discount" type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} className="border-slate-200" />
                  </div>
                </div>
              </div>

              {/* Estoque e Imagem */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="space-y-2">
                  <Label htmlFor="stock" className="font-bold text-foreground text-xs uppercase tracking-wider">Estoque Atual</Label>
                  <Input id="stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} required className="border-border" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-foreground text-xs uppercase tracking-wider">Imagem</Label>
                  <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="border-border cursor-pointer text-xs" />
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full font-bold bg-primary text-primary-foreground hover:opacity-90 rounded-md">Salvar Produto</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          <p className="font-medium text-slate-500">Carregando produtos...</p>
        ) : products.length === 0 ? (
          <p className="text-slate-500 font-medium col-span-full">Nenhum produto cadastrado. Comece adicionando um novo.</p>
        ) : (
          products.map((product) => {
             const hasDiscount = product.discount > 0;
             const finalPriceWithDiscount = product.final_price - (product.discount || 0);

             return (
              <Card key={product.id} className="overflow-hidden flex flex-col group rounded-xl border-border shadow-sm hover:shadow-md transition-shadow bg-card">
                 <div className="aspect-square bg-muted flex items-center justify-center relative">
                   {product.main_image_url || (product.product_images && product.product_images[0]) ? (
                     <img src={product.main_image_url || product.product_images[0].url} alt={product.name} className="w-full h-full object-cover" />
                   ) : (
                     <ImageIcon className="h-10 w-10 text-slate-300" />
                   )}
                   {/* Visibility Badge */}
                   <div className="absolute top-2 left-2">
                     {product.is_public ? (
                        <div className="bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 shadow-sm text-muted-foreground border border-border">
                          <Eye className="w-3 h-3" /> <span className="text-[10px] font-bold uppercase">Visível</span>
                        </div>
                     ) : (
                        <div className="bg-foreground/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 shadow-sm text-background">
                          <EyeOff className="w-3 h-3" /> <span className="text-[10px] font-bold uppercase">Oculto</span>
                        </div>
                     )}
                   </div>
                 </div>
                 
                 <CardContent className="p-5 flex-1 flex flex-col">
                   <h3 className="font-extrabold text-[15px] text-foreground line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
                   <p className="text-muted-foreground text-[13px] font-medium line-clamp-2 mt-1 mb-4 flex-1">{product.description}</p>
                   
                   <div className="flex items-center justify-between mb-4">
                     <div className="flex flex-col">
                       {hasDiscount && (
                         <span className="text-[11px] font-bold text-muted-foreground line-through">R$ {product.final_price?.toFixed(2)}</span>
                       )}
                       <span className={`font-extrabold text-[16px] ${hasDiscount ? 'text-destructive' : 'text-foreground'}`}>
                         R$ {hasDiscount ? finalPriceWithDiscount.toFixed(2) : product.final_price?.toFixed(2)}
                       </span>
                     </div>
                     <span className="font-bold text-[11px] text-muted-foreground bg-muted px-2.5 py-1 rounded-md border border-border uppercase tracking-widest">
                       QTD {product.stock_quantity}
                     </span>
                   </div>

                   <div className="mt-auto grid grid-cols-3 gap-2 pt-4 border-t border-border">
                     <Button variant="secondary" size="sm" onClick={(e) => toggleVisibility(product, e)} className="w-full flex-col h-auto py-2 gap-1 text-[10px] font-bold uppercase" title={product.is_public ? 'Ocultar' : 'Mostrar'}>
                       {product.is_public ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                       {product.is_public ? 'Ocultar' : 'Mostrar'}
                     </Button>
                     <Button variant="secondary" size="sm" onClick={(e) => handleEditClick(product, e)} className="w-full flex-col h-auto py-2 gap-1 text-[10px] font-bold uppercase" title="Editar">
                       <Edit2 className="h-4 w-4" />
                       Editar
                     </Button>
                     <Button variant="destructive" size="sm" onClick={(e) => deleteProduct(product.id, e)} className="w-full flex-col h-auto py-2 gap-1 text-[10px] font-bold uppercase" title="Excluir">
                       <Trash2 className="h-4 w-4" />
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
