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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  PackageSearch, Plus, Image as ImageIcon, Trash2, Eye, EyeOff, 
  Edit2, Wand2, Calculator, Zap, Clock, RotateCcw, ShieldAlert 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // Adicionado para animações

// Variantes para animação em cascata
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function Products() {
  const { profile, user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [globalSettings, setGlobalSettings] = useState<any>(null);

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
  const [printTime, setPrintTime] = useState('');
  const [profitMargin, setProfitMargin] = useState('');
  
  const [kwhPrice, setKwhPrice] = useState('');
  const [depreciation, setDepreciation] = useState('');
  const [setupFee, setSetupFee] = useState('');
  const [failureBuffer, setFailureBuffer] = useState('');

  const [calculatedCost, setCalculatedCost] = useState(0);
  const [suggestedPrice, setSuggestedPrice] = useState('0.00');

  const fetchGlobalSettings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('store_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (data) setGlobalSettings(data);
  };

  const applyGlobalDefaults = () => {
    if (globalSettings) {
      setFilamentPrice(globalSettings.filament_avg_price?.toString() || '120.00');
      setProfitMargin(globalSettings.profit_margin_pct?.toString() || '100');
      setKwhPrice(globalSettings.kwh_price?.toString() || '0.85');
      setDepreciation(globalSettings.machine_depreciation_hour?.toString() || '1.50');
      setSetupFee(globalSettings.setup_fee?.toString() || '5.00');
      setFailureBuffer(globalSettings.failure_buffer_pct?.toString() || '5');
      toast.info('Padrões globais aplicados à calculadora.');
    }
  };

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
    fetchGlobalSettings();
  }, [profile]);

  useEffect(() => {
    const fPrice = parseFloat(filamentPrice) || 0;
    const gUsed = parseFloat(gramsUsed) || 0;
    const pTime = parseFloat(printTime) || 0;
    const margin = parseFloat(profitMargin) || 0;
    const sFee = parseFloat(setupFee) || 0;
    const dep = parseFloat(depreciation) || 0;
    const kwh = parseFloat(kwhPrice) || 0;
    const buff = 1 + (parseFloat(failureBuffer) || 0) / 100;

    const materialCost = ((fPrice / 1000) * gUsed) * buff;
    const energyCost = (kwh * 0.15) * pTime; 
    const depreciationCost = dep * pTime;
    
    const cTotal = materialCost + energyCost + depreciationCost + sFee;
    
    setCalculatedCost(cTotal);
    const calcPrice = cTotal * (1 + margin / 100);
    setSuggestedPrice(calcPrice.toFixed(2));
  }, [filamentPrice, gramsUsed, printTime, profitMargin, kwhPrice, depreciation, setupFee, failureBuffer]);

  const handleOpenNewProduct = () => {
    resetForm();
    if (globalSettings) {
      applyGlobalDefaults();
    }
    setIsDialogOpen(true);
  };

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
    
    if (globalSettings) {
        setKwhPrice(globalSettings.kwh_price?.toString());
        setDepreciation(globalSettings.machine_depreciation_hour?.toString());
        setSetupFee(globalSettings.setup_fee?.toString());
        setFailureBuffer(globalSettings.failure_buffer_pct?.toString());
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
    setPrintTime('');
    setProfitMargin('');
    setKwhPrice('');
    setDepreciation('');
    setSetupFee('');
    setFailureBuffer('');
    setCalculatedCost(0);
    setSuggestedPrice('0.00');
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 max-w-6xl"
    >
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Produtos</h2>
          <p className="text-muted-foreground font-medium mt-1">Gerencie seu catálogo de impressão 3D.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if(!open) resetForm();
        }}>
          <Button onClick={handleOpenNewProduct} className="h-11 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 gap-2 transition-all hover:scale-105 active:scale-95">
            <Plus className="w-5 h-5" /> Novo Produto
          </Button>

          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border-border bg-card shadow-2xl p-0">
            <DialogHeader className="p-8 pb-0">
              <DialogTitle className="text-2xl font-black flex items-center gap-2">
                <PackageSearch className="w-6 h-6 text-blue-500" /> Configurar Produto
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSaveProduct} className="p-8 space-y-6">
               <div className="space-y-4">
                 <div className="space-y-2">
                   <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Nome do Produto</Label>
                   <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="h-12 rounded-2xl border-border bg-muted/30" placeholder="Ex: Action Figure Batman" />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Descrição Detalhada</Label>
                   <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required className="rounded-2xl border-border bg-muted/30 min-h-[100px]" placeholder="Fale sobre o material, escala e acabamento..." />
                 </div>
                 
                 <div className="flex items-center space-x-3 bg-muted/20 p-4 rounded-2xl border border-border">
                   <Switch id="is-public" checked={isPublic} onCheckedChange={setIsPublic} />
                   <Label htmlFor="is-public" className="font-bold text-sm cursor-pointer">Visível na Vitrine Pública</Label>
                 </div>
               </div>

              <div className="space-y-4 pt-6 border-t border-border">
                <div className="flex items-center justify-between">
                  <Label className="font-black text-foreground text-base flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-blue-500" /> Custos de Produção
                  </Label>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={applyGlobalDefaults}
                    className="text-[9px] font-black bg-blue-500/10 text-blue-600 px-2 py-1 rounded-md hover:bg-blue-500/20"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" /> RESETAR PADRÕES
                  </Button>
                </div>

                <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-[10px] font-bold text-blue-700/80 leading-relaxed italic">
                        Os valores abaixo refletem suas <strong className="underline">Configurações Globais</strong>. Altere manualmente para este produto ou ajuste os padrões no menu de configurações para todo o catálogo.
                    </p>
                </div>

                <div className="bg-muted/30 p-6 rounded-[2rem] space-y-5 border border-border">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="filPrice" className="font-black text-muted-foreground text-[9px] uppercase tracking-wider">Filamento (R$ / KG)</Label>
                      <Input id="filPrice" type="number" step="0.01" value={filamentPrice} onChange={(e) => setFilamentPrice(e.target.value)} required className="h-11 bg-background rounded-xl border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gUsed" className="font-black text-muted-foreground text-[9px] uppercase tracking-wider">Peso da Peça (g)</Label>
                      <Input id="gUsed" type="number" step="0.1" value={gramsUsed} onChange={(e) => setGramsUsed(e.target.value)} required className="h-11 bg-background rounded-xl border-border" placeholder="Ex: 150" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 bg-background/50 rounded-2xl border border-dashed border-border/50">
                    <div className="space-y-1">
                      <Label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Energia (R$/kWh)</Label>
                      <Input type="number" value={kwhPrice} onChange={(e) => setKwhPrice(e.target.value)} className="h-8 text-xs rounded-lg" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Depreciação (R$/h)</Label>
                      <Input type="number" value={depreciation} onChange={(e) => setDepreciation(e.target.value)} className="h-8 text-xs rounded-lg" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Taxa Setup (R$)</Label>
                      <Input type="number" value={setupFee} onChange={(e) => setSetupFee(e.target.value)} className="h-8 text-xs rounded-lg" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Buffer Falha (%)</Label>
                      <Input type="number" value={failureBuffer} onChange={(e) => setFailureBuffer(e.target.value)} className="h-8 text-xs rounded-lg" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pTime" className="font-black text-muted-foreground text-[9px] uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Tempo (Horas)
                      </Label>
                      <Input id="pTime" type="number" step="0.1" value={printTime} onChange={(e) => setPrintTime(e.target.value)} required className="h-11 bg-background rounded-xl border-border" placeholder="Ex: 4.5" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pMargin" className="font-black text-blue-600 text-[9px] uppercase tracking-wider">Lucro Desejado (%)</Label>
                      <Input id="pMargin" type="number" value={profitMargin} onChange={(e) => setProfitMargin(e.target.value)} required className="h-11 bg-blue-500/5 border-blue-500/20 text-blue-600 font-bold rounded-xl" />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-border/50 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-muted-foreground uppercase">Custo de Fabricação</span>
                      <span className="text-xl font-black text-foreground tracking-tighter">R$ {calculatedCost.toFixed(2)}</span>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl text-right">
                       <span className="block text-[9px] font-black text-emerald-600 uppercase">Preço Sugerido</span>
                       <span className="text-lg font-black text-emerald-600 tracking-tighter leading-none">R$ {suggestedPrice}</span>
                       <Button 
                         type="button"
                         variant="ghost" 
                         size="sm" 
                         onClick={() => setPrice(suggestedPrice)}
                         className="h-6 mt-1 text-[9px] font-black text-emerald-700 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg px-2"
                       >
                         <Wand2 className="w-3 h-3 mr-1" /> APLICAR
                       </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-[10px] font-black uppercase text-muted-foreground">Preço Final de Venda</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">R$</span>
                      <Input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required className="h-12 pl-10 rounded-2xl border-blue-500/30 bg-blue-500/5 font-black text-lg" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount" className="text-[10px] font-black uppercase text-muted-foreground">Desconto Especial</Label>
                    <Input id="discount" type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} className="h-12 rounded-2xl border-border" placeholder="0.00" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="space-y-2">
                  <Label htmlFor="stock" className="text-[10px] font-black uppercase text-muted-foreground">Estoque Disponível</Label>
                  <Input id="stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} required className="h-12 rounded-2xl border-border bg-muted/30" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Foto do Produto</Label>
                  <div className="relative h-12">
                    <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <div className="h-full border-2 border-dashed border-border rounded-2xl flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                      <ImageIcon className="w-4 h-4 mr-2" /> SELECIONAR IMAGEM
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full h-14 font-black bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-xl shadow-blue-500/20 text-lg transition-all active:scale-[0.98]">
                  {editingProductId ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR NA VITRINE'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {loading ? (
          <p className="font-black text-muted-foreground animate-pulse tracking-[0.3em] py-20 col-span-full text-center uppercase">Sincronizando Catálogo...</p>
        ) : products.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-muted/20 rounded-[3rem] border-2 border-dashed border-border flex flex-col items-center gap-4">
             <PackageSearch className="w-12 h-12 text-muted-foreground/30" />
             <p className="text-muted-foreground font-bold">Sua vitrine está vazia. Comece a lucrar agora!</p>
          </div>
        ) : (
          <AnimatePresence>
            {products.map((product) => {
                const hasDiscount = product.discount > 0;
                const finalPriceWithDiscount = product.final_price - (product.discount || 0);

                return (
                 <motion.div
                   layout
                   key={product.id}
                   variants={itemVariants}
                   whileHover={{ y: -5 }} // Efeito sutil ao passar o mouse
                   transition={{ duration: 0.2 }}
                 >
                   <Card className="overflow-hidden h-full flex flex-col group rounded-[2.5rem] border-border bg-card/40 backdrop-blur-sm hover:border-blue-500/30 hover:shadow-2xl transition-all duration-500">
                      <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
                        {product.main_image_url || (product.product_images && product.product_images[0]) ? (
                          <img src={product.main_image_url || product.product_images[0].url} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        ) : (
                          <ImageIcon className="h-16 w-16 text-muted-foreground/20" />
                        )}
                        
                        <div className="absolute top-4 left-4">
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm backdrop-blur-md ${product.is_public ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
                              {product.is_public ? 'Ativo' : 'Pausado'}
                            </div>
                        </div>
                      </div>
                      
                      <CardContent className="p-8 flex-1 flex flex-col">
                        <h3 className="font-black text-xl text-foreground tracking-tight line-clamp-1 mb-2 italic uppercase tracking-tighter">{product.name}</h3>
                        <p className="text-muted-foreground text-sm font-medium line-clamp-2 leading-relaxed mb-6 flex-1">{product.description}</p>
                        
                        <div className="flex items-center justify-between mb-8 pt-6 border-t border-border">
                          <div className="flex flex-col">
                            {hasDiscount && (
                              <span className="text-[10px] font-bold text-muted-foreground line-through decoration-red-500/50 tracking-tighter">R$ {product.final_price?.toFixed(2)}</span>
                            )}
                            <span className={`text-2xl font-black tracking-tighter italic ${hasDiscount ? 'text-emerald-500' : 'text-foreground'}`}>
                              R$ {hasDiscount ? finalPriceWithDiscount.toFixed(2) : product.final_price?.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="block text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Estoque</span>
                            <span className="text-xs font-black bg-blue-500/10 text-blue-600 px-3 py-1 rounded-full border border-blue-500/10">{product.stock_quantity} un</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <Button variant="outline" size="sm" onClick={(e) => toggleVisibility(product, e)} className="h-10 rounded-2xl border-border bg-muted/20 text-muted-foreground hover:text-foreground text-[10px] font-black uppercase tracking-tighter">
                            {product.is_public ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                            {product.is_public ? 'Ocultar' : 'Exibir'}
                          </Button>
                          <Button variant="outline" size="sm" onClick={(e) => handleEditClick(product, e)} className="h-10 rounded-2xl border-border bg-muted/20 text-muted-foreground hover:text-blue-500 text-[10px] font-black uppercase tracking-tighter">
                            <Edit2 className="h-4 w-4 mr-1" /> Editar
                          </Button>
                          <Button variant="ghost" size="sm" onClick={(e) => deleteProduct(product.id, e)} className="h-10 rounded-2xl text-muted-foreground hover:text-red-500 hover:bg-red-500/5 text-[10px] font-black uppercase tracking-tighter">
                            <Trash2 className="h-4 w-4 mr-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                 </motion.div>
                );
            })}
          </AnimatePresence>
        )}
      </motion.div>
    </motion.div>
  );
}
