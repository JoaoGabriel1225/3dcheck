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
  Edit2, Wand2, Calculator, Zap, Clock, RotateCcw, ShieldAlert,
  TrendingUp, DollarSign, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Variantes para animação em cascata
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export default function Products() {
  const { profile, user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalSettings, setGlobalSettings] = useState<any>(null);

  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // Novo: Preview
  const [isPublic, setIsPublic] = useState(true);
  const [discount, setDiscount] = useState('');
  
  // Calculator state
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
  const [showCosts, setShowCosts] = useState(false); // Novo: Accordion para mobile

  const fetchGlobalSettings = async () => {
    if (!user) return;
    const { data } = await supabase.from('store_settings').select('*').eq('user_id', user.id).single();
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
      toast.info('Padrões globais aplicados.');
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
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); fetchGlobalSettings(); }, [profile]);

  // Lógica da Calculadora (Base preservada)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (selectedFile) {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const loadingToast = toast.loading('Salvando produto...');
    
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

      let productData;
      if (editingProductId) {
        const { data } = await supabase.from('products').update(productPayload).eq('id', editingProductId).select().single();
        productData = data;
      } else {
        const { data } = await supabase.from('products').insert({ user_id: profile.id, ...productPayload }).select().single();
        productData = data;
      }

      if (file && productData) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${productData.id}-${Date.now()}.${fileExt}`;
        const filePath = `${profile.id}/${fileName}`;
        await supabase.storage.from('product-images').upload(filePath, file);
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
        await supabase.from('product_images').insert({ product_id: productData.id, url: publicUrl });
        await supabase.from('products').update({ main_image_url: publicUrl }).eq('id', productData.id);
      }

      toast.success('Produto salvo!', { id: loadingToast });
      setIsDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (err: any) { toast.error('Erro: ' + err.message, { id: loadingToast }); }
  };

  const handleEditClick = (product: any) => {
    setEditingProductId(product.id);
    setName(product.name || '');
    setDescription(product.description || '');
    setPrice(product.final_price?.toString() || '');
    setStock(product.stock_quantity?.toString() || '0');
    setIsPublic(product.is_public ?? true);
    setDiscount(product.discount?.toString() || '');
    setProfitMargin(product.profit_margin?.toString() || '');
    setCalculatedCost(product.cost_total || 0);
    setPreviewUrl(product.main_image_url || null);
    if (globalSettings) {
        setKwhPrice(globalSettings.kwh_price?.toString());
        setDepreciation(globalSettings.machine_depreciation_hour?.toString());
        setSetupFee(globalSettings.setup_fee?.toString());
        setFailureBuffer(globalSettings.failure_buffer_pct?.toString());
    }
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProductId(null); setName(''); setDescription(''); setPrice(''); setStock('0');
    setFile(null); setPreviewUrl(null); setIsPublic(true); setDiscount('');
    setFilamentPrice(''); setGramsUsed(''); setPrintTime(''); setProfitMargin('');
    setCalculatedCost(0); setSuggestedPrice('0.00');
  };

  const toggleVisibility = async (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.from('products').update({ is_public: !product.is_public }).eq('id', product.id);
    if (!error) {
      toast.success(product.is_public ? 'Ocultado' : 'Visível');
      fetchProducts();
    }
  };

  const realProfit = (parseFloat(price) || 0) - (calculatedCost || 0);

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-8 max-w-6xl pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div variants={itemVariants}>
          <h2 className="text-3xl font-black tracking-tight text-foreground italic uppercase">Catálogo <span className="text-blue-500">Pro</span></h2>
          <p className="text-muted-foreground font-medium">Gerencie sua produção e precificação inteligente.</p>
        </motion.div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
          <Button asChild onClick={() => { resetForm(); if(globalSettings) applyGlobalDefaults(); setIsDialogOpen(true); }}>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="h-12 px-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 gap-2">
              <Plus className="w-5 h-5" /> NOVO PRODUTO
            </motion.button>
          </Button>

          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border-border bg-card shadow-2xl p-0 scrollbar-hide">
            <div className="p-8 space-y-6">
              <DialogTitle className="text-2xl font-black flex items-center gap-2 uppercase italic">
                <PackageSearch className="w-6 h-6 text-blue-500" /> {editingProductId ? 'Editar Peça' : 'Nova Peça'}
              </DialogTitle>

              <form onSubmit={handleSaveProduct} className="space-y-6">
                {/* PREVIEW DE IMAGEM */}
                <div className="relative group w-full aspect-video bg-muted/30 rounded-[2rem] border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                  {previewUrl ? (
                    <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <div className="text-center space-y-2">
                      <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground/40" />
                      <p className="text-[10px] font-black uppercase text-muted-foreground">Sem imagem selecionada</p>
                    </div>
                  )}
                  <Input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Identificação</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} required className="h-12 rounded-2xl bg-muted/20" placeholder="Nome do modelo..." />
                  </div>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-2xl bg-muted/20 min-h-[80px]" placeholder="Especificações técnicas..." />
                </div>

                {/* CALCULADORA (Base preservada e visual melhorado) */}
                <div className="bg-muted/30 p-6 rounded-[2rem] border border-border space-y-4">
                  <button type="button" onClick={() => setShowCosts(!showCosts)} className="w-full flex items-center justify-between text-xs font-black uppercase tracking-widest text-blue-500">
                    <div className="flex items-center gap-2"><Calculator className="w-4 h-4" /> Custos de Insumos</div>
                    {showCosts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  <AnimatePresence>
                    {(showCosts || !editingProductId) && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1"><Label className="text-[9px] font-black opacity-60">Filamento (R$/KG)</Label><Input type="number" step="0.01" value={filamentPrice} onChange={(e) => setFilamentPrice(e.target.value)} className="h-10 rounded-xl" /></div>
                            <div className="space-y-1"><Label className="text-[9px] font-black opacity-60">Peso Peça (g)</Label><Input type="number" value={gramsUsed} onChange={(e) => setGramsUsed(e.target.value)} className="h-10 rounded-xl" /></div>
                         </div>
                         <div className="grid grid-cols-3 gap-2 opacity-80">
                            <div className="space-y-1"><Label className="text-[8px] font-black">KW/H</Label><Input type="number" value={kwhPrice} onChange={(e) => setKwhPrice(e.target.value)} className="h-8 text-[10px] rounded-lg" /></div>
                            <div className="space-y-1"><Label className="text-[8px] font-black">Deprec.</Label><Input type="number" value={depreciation} onChange={(e) => setDepreciation(e.target.value)} className="h-8 text-[10px] rounded-lg" /></div>
                            <div className="space-y-1"><Label className="text-[8px] font-black">Setup</Label><Input type="number" value={setupFee} onChange={(e) => setSetupFee(e.target.value)} className="h-8 text-[10px] rounded-lg" /></div>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1"><Clock className="w-3 h-3" /> Horas de Impressão</Label>
                      <Input type="number" step="0.1" value={printTime} onChange={(e) => setPrintTime(e.target.value)} required className="h-11 rounded-xl bg-blue-500/5 border-blue-500/20 font-bold" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Margem (%)</Label>
                      <Input type="number" value={profitMargin} onChange={(e) => setProfitMargin(e.target.value)} required className="h-11 rounded-xl bg-emerald-500/5 border-emerald-500/20 font-bold" />
                    </div>
                  </div>

                  <div className="p-4 bg-background/50 rounded-2xl flex justify-between items-center border border-border/50">
                    <div><p className="text-[10px] font-black text-muted-foreground uppercase">Custo Total</p><p className="text-xl font-black">R$ {calculatedCost.toFixed(2)}</p></div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-emerald-500 uppercase">Sugestão</p>
                      <Button type="button" variant="ghost" onClick={() => setPrice(suggestedPrice)} className="h-auto p-0 text-xl font-black text-emerald-500 hover:text-emerald-400">R$ {suggestedPrice} <Wand2 className="w-3 h-3 ml-1" /></Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-blue-500 ml-1">Preço de Venda (R$)</Label>
                    <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required className="h-14 rounded-2xl border-blue-500/30 bg-blue-500/5 text-xl font-black" />
                  </div>
                  <div className="space-y-2 flex flex-col justify-center items-center bg-muted/20 rounded-2xl border border-border">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Lucro Real</p>
                    <p className={`text-xl font-black ${realProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>R$ {realProfit.toFixed(2)}</p>
                  </div>
                </div>

                <Button type="submit" className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white font-black text-xl rounded-2xl shadow-xl shadow-blue-600/20 transition-all uppercase italic">Salvar na Vitrine</Button>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-80 w-full bg-card/40 rounded-[2.5rem] animate-pulse border border-border" />
            ))
          ) : products.length === 0 ? (
            <motion.div variants={itemVariants} className="col-span-full py-20 text-center bg-muted/20 rounded-[3rem] border-2 border-dashed border-border">
               <PackageSearch className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
               <p className="font-bold text-muted-foreground uppercase tracking-widest">Seu catálogo está vazio</p>
            </motion.div>
          ) : (
            products.map((product) => (
              <motion.div key={product.id} variants={itemVariants} layout whileHover={{ y: -10 }}>
                <Card className="overflow-hidden flex flex-col group rounded-[2.5rem] border-border bg-card/40 backdrop-blur-sm hover:border-blue-500/30 hover:shadow-2xl transition-all duration-500 h-full">
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    {product.main_image_url ? (
                      <img src={product.main_image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <ImageIcon className="h-16 w-16 mx-auto mt-16 text-muted-foreground/20" />
                    )}
                    <button onClick={(e) => toggleVisibility(product, e)} className="absolute top-4 right-4 p-2 rounded-full backdrop-blur-md bg-black/20 text-white hover:bg-black/40 transition-all border border-white/10">
                      {product.is_public ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-orange-400" />}
                    </button>
                  </div>
                  
                  <CardContent className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-black text-lg uppercase italic tracking-tighter line-clamp-1">{product.name}</h3>
                      <p className="text-muted-foreground text-xs font-medium line-clamp-2 mt-1">{product.description}</p>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Preço Final</span>
                        <span className="text-2xl font-black tracking-tighter text-blue-500 italic">R$ {product.final_price?.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(product)} className="h-9 w-9 rounded-xl bg-accent text-muted-foreground hover:text-blue-500 transition-all"><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteProduct(product.id)} className="h-9 w-9 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
