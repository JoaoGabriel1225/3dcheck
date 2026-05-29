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
  Edit2, Wand2, Calculator, Zap, Clock, RotateCcw, ShieldAlert, Store,
  ChevronDown, Search, X, Layers, Settings2, BatteryCharging, Hammer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const MAX_IMAGES = 5;

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
  const [isPublic, setIsPublic] = useState(true);
  const [discount, setDiscount] = useState('');
  
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  
  const [filamentPrice, setFilamentPrice] = useState('');
  const [gramsUsed, setGramsUsed] = useState('');
  const [printTime, setPrintTime] = useState('');
  const [printTimeMinutes, setPrintTimeMinutes] = useState('0'); 
  const [profitMargin, setProfitMargin] = useState('');
  
  const [kwhPrice, setKwhPrice] = useState('');
  const [depreciation, setDepreciation] = useState('');
  const [setupFee, setSetupFee] = useState('');
  const [failureBuffer, setFailureBuffer] = useState('');

  const [filamentsList, setFilamentsList] = useState<any[]>([]);
  const [selectedFilamentId, setSelectedFilamentId] = useState('');
  const [extraCosts, setExtraCosts] = useState('');

  const [isFilamentSearchOpen, setIsFilamentSearchOpen] = useState(false);
  const [filamentSearch, setFilamentSearch] = useState('');

  const [isMultiColor, setIsMultiColor] = useState(false);
  const [powerWatts, setPowerWatts] = useState('300');
  const [postProcessingMin, setPostProcessingMin] = useState('0');
  const [laborRate, setLaborRate] = useState('35');
  const [taxML, setTaxML] = useState('18');
  const [taxShopee, setTaxShopee] = useState('20');
  const [multicolorWaste, setMulticolorWaste] = useState('15');
  const [suggestedPriceML, setSuggestedPriceML] = useState('0.00');
  const [suggestedPriceShopee, setSuggestedPriceShopee] = useState('0.00');

  const [calculatedCost, setCalculatedCost] = useState(0);
  const [suggestedPrice, setSuggestedPrice] = useState('0.00');

  const filteredFilaments = filamentsList.filter(f => 
    `${f.brand} ${f.material} ${f.color}`.toLowerCase().includes(filamentSearch.toLowerCase())
  );

  const fetchGlobalSettings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('store_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (data) {
      setGlobalSettings(data);
      if (data.tax_ml) setTaxML(data.tax_ml.toString());
      if (data.tax_shopee) setTaxShopee(data.tax_shopee.toString());
      if (data.machine_power_watts) setPowerWatts(data.machine_power_watts.toString());
      if (data.labor_rate_hour) setLaborRate(data.labor_rate_hour.toString());
      if (data.multicolor_waste_pct) setMulticolorWaste(data.multicolor_waste_pct.toString());
    }
  };

  const fetchFilaments = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('filaments')
      .select('*')
      .eq('user_id', user.id)
      .order('brand', { ascending: true });
    if (data) setFilamentsList(data);
  };

  const applyGlobalDefaults = () => {
    if (globalSettings) {
      setFilamentPrice(globalSettings.filament_avg_price?.toString() || '130.00');
      setProfitMargin(globalSettings.profit_margin_pct?.toString() || '150');
      setKwhPrice(globalSettings.kwh_price?.toString() || '0.95');
      setDepreciation(globalSettings.machine_depreciation_hour?.toString() || '1.00');
      setSetupFee(globalSettings.setup_fee?.toString() || '5.00');
      setFailureBuffer(globalSettings.failure_buffer_pct?.toString() || '10');
      
      setExtraCosts(globalSettings.extra_costs?.toString() || '0.00');

      if (globalSettings.tax_ml) setTaxML(globalSettings.tax_ml.toString());
      if (globalSettings.tax_shopee) setTaxShopee(globalSettings.tax_shopee.toString());
      if (globalSettings.machine_power_watts) setPowerWatts(globalSettings.machine_power_watts.toString());
      if (globalSettings.labor_rate_hour) setLaborRate(globalSettings.labor_rate_hour.toString());
      if (globalSettings.multicolor_waste_pct) setMulticolorWaste(globalSettings.multicolor_waste_pct.toString());
      
      toast.info('Padrões globais aplicados à calculadora.');
    }
  };

  const fetchProducts = async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`*, product_images(id, url)`)
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
    fetchFilaments();
  }, [profile]);

  useEffect(() => {
    let costPerGram = 0;
    const selectedFilamentData = filamentsList.find(f => f.id === selectedFilamentId);
    
    if (selectedFilamentData) {
      costPerGram = selectedFilamentData.price / selectedFilamentData.weight_g;
    } else {
      costPerGram = (parseFloat(filamentPrice) || 0) / 1000;
    }

    const gUsed = parseFloat(gramsUsed) || 0;
    
    const hours = parseFloat(printTime) || 0;
    const mins = parseFloat(printTimeMinutes) || 0;
    const pTime = hours + (mins / 60);

    const margin = parseFloat(profitMargin) || 0;
    const sFee = parseFloat(setupFee) || 0;
    const dep = parseFloat(depreciation) || 0;
    const kwh = parseFloat(kwhPrice) || 0;
    const buff = 1 + (parseFloat(failureBuffer) || 0) / 100;
    
    const watts = parseFloat(powerWatts) || 0;
    const postProc = parseFloat(postProcessingMin) || 0;
    const lRate = parseFloat(laborRate) || 0;
    const tML = parseFloat(taxML) || 0;
    const tShopee = parseFloat(taxShopee) || 0;
    const wastePct = parseFloat(multicolorWaste) || 0;
    
    const totalExtraCosts = parseFloat(extraCosts) || 0;

    const multicolorMultiplier = isMultiColor ? (1 + (wastePct / 100)) : 1; 

    const materialCost = (costPerGram * (gUsed * multicolorMultiplier)) * buff;
    
    const energyCost = ((watts / 1000) * kwh) * pTime; 
    const depreciationCost = dep * pTime;
    const laborCost = (lRate / 60) * postProc; 
    
    const cTotal = materialCost + energyCost + depreciationCost + sFee + laborCost + totalExtraCosts;
    
    setCalculatedCost(cTotal);
    const calcPrice = cTotal * (1 + margin / 100);
    setSuggestedPrice(calcPrice.toFixed(2));

    const priceML = calcPrice / (1 - (tML / 100));
    const priceShopee = calcPrice / (1 - (tShopee / 100));
    
    setSuggestedPriceML(isFinite(priceML) ? priceML.toFixed(2) : '0.00');
    setSuggestedPriceShopee(isFinite(priceShopee) ? priceShopee.toFixed(2) : '0.00');

  }, [selectedFilamentId, filamentsList, filamentPrice, gramsUsed, printTime, printTimeMinutes, profitMargin, kwhPrice, depreciation, setupFee, failureBuffer, isMultiColor, powerWatts, postProcessingMin, laborRate, taxML, taxShopee, multicolorWaste, extraCosts]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const currentTotal = existingImages.length + files.length;
      const availableSlots = MAX_IMAGES - currentTotal;
      
      const filesToAdd = selectedFiles.slice(0, availableSlots);

      if (filesToAdd.length < selectedFiles.length) {
        toast.error(`Você só pode ter até ${MAX_IMAGES} mídias. Algumas foram ignoradas.`);
      }

      const newPreviews = filesToAdd.map(file => URL.createObjectURL(file));
      setFiles(prev => [...prev, ...filesToAdd]);
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeNewFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (id: string) => {
    setImagesToDelete(prev => [...prev, id]);
    setExistingImages(prev => prev.filter(img => img.id !== id));
  };

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

      const hours = parseFloat(printTime) || 0;
      const mins = parseFloat(printTimeMinutes) || 0;
      const totalTimeHours = hours + (mins / 60);

      const productPayload = {
        name,
        description,
        final_price: finalPriceNum,
        cost_total: costTotalNum,
        profit_margin: profitMarginNum,
        discount: discountNum,
        is_public: isPublic,
        post_processing_min: parseFloat(postProcessingMin) || 0,
        is_multicolor: isMultiColor,
        suggested_price_ml: parseFloat(suggestedPriceML) || 0,
        suggested_price_shopee: parseFloat(suggestedPriceShopee) || 0,
        filament_id: selectedFilamentId || null,
        extra_costs: parseFloat(extraCosts) || 0,
        weight_g: parseFloat(gramsUsed) || 0,
        print_time_hours: totalTimeHours
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

      if (imagesToDelete.length > 0) {
        await supabase.from('product_images').delete().in('id', imagesToDelete);
      }

      let newUploadedUrls: string[] = [];
      if (files.length > 0) {
        for (const file of files) {
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
            newUploadedUrls.push(publicUrlData.publicUrl);
          }
        }
      }

      const finalExisting = existingImages.length > 0 ? existingImages[0].url : null;
      const finalNew = newUploadedUrls.length > 0 ? newUploadedUrls[0] : null;
      const mainUrl = finalExisting || finalNew || null;

      await supabase
        .from('products')
        .update({ main_image_url: mainUrl })
        .eq('id', productData.id);

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
    setIsPublic(product.is_public ?? true);
    setDiscount(product.discount?.toString() || '');
    setProfitMargin(product.profit_margin?.toString() || '');
    setCalculatedCost(product.cost_total || 0);
    
    setIsMultiColor(product.is_multicolor || false);
    setPostProcessingMin(product.post_processing_min?.toString() || '0');
    setSelectedFilamentId(product.filament_id || '');
    setExtraCosts(product.extra_costs?.toString() || '');
    
    setGramsUsed(product.weight_g?.toString() || '');
    
    const totalHours = product.print_time_hours || 0;
    const h = Math.floor(totalHours);
    const m = Math.round((totalHours - h) * 60);
    setPrintTime(h.toString());
    setPrintTimeMinutes(m.toString());

    setExistingImages(product.product_images || []);
    setFiles([]);
    setPreviews([]);
    setImagesToDelete([]);

    if (globalSettings) {
        setKwhPrice(globalSettings.kwh_price?.toString());
        setDepreciation(globalSettings.machine_depreciation_hour?.toString());
        setSetupFee(globalSettings.setup_fee?.toString());
        setFailureBuffer(globalSettings.failure_buffer_pct?.toString());
        if (globalSettings.tax_ml) setTaxML(globalSettings.tax_ml.toString());
        if (globalSettings.tax_shopee) setTaxShopee(globalSettings.tax_shopee.toString());
        if (globalSettings.machine_power_watts) setPowerWatts(globalSettings.machine_power_watts.toString());
        if (globalSettings.labor_rate_hour) setLaborRate(globalSettings.labor_rate_hour.toString());
        if (globalSettings.multicolor_waste_pct) setMulticolorWaste(globalSettings.multicolor_waste_pct.toString());
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
    setFiles([]);
    previews.forEach(url => URL.revokeObjectURL(url));
    setPreviews([]);
    setExistingImages([]);
    setImagesToDelete([]);
    setIsPublic(true);
    setDiscount('');
    setFilamentPrice('');
    setGramsUsed('');
    setPrintTime('');
    setPrintTimeMinutes('0');
    setProfitMargin('');
    setKwhPrice('');
    setDepreciation('');
    setSetupFee('');
    setFailureBuffer('');
    setCalculatedCost(0);
    setSuggestedPrice('0.00');
    
    setIsMultiColor(false);
    setPostProcessingMin('0');
    setSelectedFilamentId('');
    setExtraCosts('');
    setIsFilamentSearchOpen(false);
    setFilamentSearch('');

    setPowerWatts(globalSettings?.machine_power_watts?.toString() || '300');
    setLaborRate(globalSettings?.labor_rate_hour?.toString() || '35');
    setMulticolorWaste(globalSettings?.multicolor_waste_pct?.toString() || '15');
    setSuggestedPriceML('0.00');
    setSuggestedPriceShopee('0.00');
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

          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border-border bg-card shadow-2xl p-0 custom-scrollbar">
            
            <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50 px-8 py-6 flex items-center justify-between">
               <DialogTitle className="text-2xl font-black flex items-center gap-3">
                 <div className="p-2.5 bg-blue-500/10 rounded-xl"><PackageSearch className="w-6 h-6 text-blue-500" /></div>
                 Configurar Produto
               </DialogTitle>
            </div>

            <form onSubmit={handleSaveProduct} className="p-8 space-y-12">
               
               {/* --- SEÇÃO 1: INFORMAÇÕES BÁSICAS --- */}
               <div className="space-y-6">
                 <div className="space-y-2">
                   <Label htmlFor="name" className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome do Produto</Label>
                   <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="h-14 text-lg font-bold rounded-2xl border-border bg-muted/30 focus:bg-background transition-colors" placeholder="Ex: Action Figure Batman" />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="description" className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Descrição Detalhada</Label>
                   <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required className="rounded-2xl border-border bg-muted/30 focus:bg-background transition-colors min-h-[120px] text-base resize-y" placeholder="Fale sobre o material, escala e acabamento..." />
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                   <div className="flex items-center space-x-4 bg-muted/20 p-5 rounded-2xl border border-border/50 hover:bg-muted/40 transition-colors">
                     <Switch id="is-public" checked={isPublic} onCheckedChange={setIsPublic} className="scale-125" />
                     <div className="flex flex-col">
                       <Label htmlFor="is-public" className="font-black text-sm cursor-pointer">Visível na Vitrine Pública</Label>
                       <span className="text-[10px] text-muted-foreground font-bold uppercase mt-0.5">Disponível para clientes verem</span>
                     </div>
                   </div>
                   <div className="flex items-center space-x-4 bg-indigo-500/5 p-5 rounded-2xl border border-indigo-500/20 hover:bg-indigo-500/10 transition-colors">
                     <Switch id="is-multicolor" checked={isMultiColor} onCheckedChange={setIsMultiColor} className="scale-125" />
                     <div className="flex flex-col">
                       <Label htmlFor="is-multicolor" className="font-black text-sm text-indigo-700 cursor-pointer">Impressão Multi-Cor</Label>
                       <span className="text-[10px] text-indigo-600/70 font-bold uppercase mt-0.5">Adiciona purga de +{multicolorWaste}%</span>
                     </div>
                   </div>
                 </div>
               </div>

               {/* --- SEÇÃO 2: SETUP DO FATIADOR --- */}
               <div className="space-y-6 pt-8 border-t border-border/50">
                 <div className="flex items-center gap-3 mb-6">
                   <div className="p-2.5 bg-blue-500/10 rounded-xl"><Layers className="w-5 h-5 text-blue-500" /></div>
                   <div>
                     <h3 className="text-xl font-black tracking-tight text-foreground uppercase">Setup da Impressão</h3>
                     <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Insira os dados do seu fatiador</p>
                   </div>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Filamento */}
                    <div className="space-y-2 relative">
                      <Label className="font-black text-muted-foreground text-[11px] uppercase tracking-widest ml-1 flex justify-between">
                        Filamento Usado
                        {selectedFilamentId && filamentsList.find(f => f.id === selectedFilamentId) && (
                          <span className="text-blue-500 font-black">
                            (R$ {(filamentsList.find(f => f.id === selectedFilamentId).price / filamentsList.find(f => f.id === selectedFilamentId).weight_g).toFixed(4)}/g)
                          </span>
                        )}
                      </Label>
                      
                      <div 
                        className="w-full h-14 px-4 bg-muted/30 rounded-2xl border border-border text-base font-bold flex items-center justify-between cursor-pointer hover:border-blue-500/50 hover:bg-background transition-colors"
                        onClick={() => setIsFilamentSearchOpen(!isFilamentSearchOpen)}
                      >
                        <span className="truncate">
                          {selectedFilamentId && filamentsList.find(f => f.id === selectedFilamentId)
                            ? `${filamentsList.find(f => f.id === selectedFilamentId).brand} - ${filamentsList.find(f => f.id === selectedFilamentId).material} ${filamentsList.find(f => f.id === selectedFilamentId).color}`
                            : <span className="text-muted-foreground font-medium">Selecionar filamento...</span>
                          }
                        </span>
                        <ChevronDown className="w-5 h-5 text-muted-foreground ml-2 shrink-0" />
                      </div>

                      <AnimatePresence>
                        {isFilamentSearchOpen && (
                          <motion.div 
                            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                            className="absolute z-50 top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                          >
                            <div className="p-3 border-b border-border bg-muted/30 relative">
                              <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                              <input 
                                autoFocus
                                type="text" 
                                placeholder="Pesquisar marca ou cor..." 
                                value={filamentSearch}
                                onChange={(e) => setFilamentSearch(e.target.value)}
                                className="w-full h-11 pl-10 pr-4 bg-background border border-border rounded-xl text-sm font-bold focus:outline-none focus:border-blue-500"
                              />
                            </div>
                            <div className="max-h-60 overflow-y-auto p-2 custom-scrollbar">
                              <div 
                                className="px-4 py-3 text-sm text-red-500 font-bold cursor-pointer hover:bg-red-500/10 rounded-xl flex items-center gap-2"
                                onClick={() => { setSelectedFilamentId(''); setIsFilamentSearchOpen(false); }}
                              >
                                <X className="w-4 h-4" /> Limpar Seleção
                              </div>
                              {filteredFilaments.map(f => (
                                <div 
                                  key={f.id} 
                                  className="px-4 py-3 text-sm text-foreground font-bold cursor-pointer hover:bg-blue-500/10 hover:text-blue-500 rounded-xl flex items-center gap-3 transition-colors"
                                  onClick={() => { setSelectedFilamentId(f.id); setIsFilamentSearchOpen(false); setFilamentSearch(''); }}
                                >
                                  <div className="w-4 h-4 rounded-full border border-border/50 shadow-sm shrink-0" style={{backgroundColor: f.color_hex || '#000'}} />
                                  <span className="truncate">{f.brand} - {f.material} {f.color}</span>
                                </div>
                              ))}
                              {filteredFilaments.length === 0 && (
                                <div className="p-6 text-sm font-bold text-muted-foreground text-center">Nenhum filamento encontrado.</div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Peso */}
                    <div className="space-y-2">
                      <Label htmlFor="gUsed" className="font-black text-muted-foreground text-[11px] uppercase tracking-widest ml-1">Peso da Peça</Label>
                      <div className="relative">
                        <Input id="gUsed" type="number" step="0.1" value={gramsUsed} onChange={(e) => setGramsUsed(e.target.value)} required className="h-14 pr-12 text-lg font-black bg-muted/30 focus:bg-background rounded-2xl border-border" placeholder="Ex: 150" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground">g</span>
                      </div>
                    </div>

                    {/* Tempo de Máquina */}
                    <div className="space-y-2">
                      <Label className="font-black text-muted-foreground text-[11px] uppercase tracking-widest ml-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Tempo Máquina
                      </Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input id="pTime" type="number" min="0" step="1" value={printTime} onChange={(e) => setPrintTime(e.target.value)} required className="h-14 pl-4 pr-8 text-lg font-black bg-muted/30 focus:bg-background rounded-2xl border-border" placeholder="0" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground">h</span>
                        </div>
                        <div className="relative flex-1">
                          <Input id="pTimeMin" type="number" min="0" max="59" step="1" value={printTimeMinutes} onChange={(e) => setPrintTimeMinutes(e.target.value)} required className="h-14 pl-4 pr-10 text-lg font-black bg-muted/30 focus:bg-background rounded-2xl border-border" placeholder="0" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground">min</span>
                        </div>
                      </div>
                    </div>
                 </div>
               </div>

               {/* --- SEÇÃO 3: CUSTOS OPERACIONAIS (AVANÇADO) --- */}
               <div className="space-y-6 pt-8 border-t border-border/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-slate-500/10 rounded-xl"><Settings2 className="w-5 h-5 text-slate-500" /></div>
                      <div>
                        <h3 className="text-xl font-black tracking-tight text-foreground uppercase">Custos Operacionais</h3>
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Pré-preenchidos pelas configurações globais</p>
                      </div>
                    </div>
                    <Button type="button" variant="outline" onClick={applyGlobalDefaults} className="h-10 text-[10px] font-black uppercase tracking-widest rounded-xl border-border">
                      <RotateCcw className="w-3 h-3 mr-2" /> Restaurar Padrões
                    </Button>
                  </div>

                  <div className="bg-muted/10 border border-border/50 p-6 md:p-8 rounded-[2rem] space-y-8">
                     
                     {/* Bloco 1: Máquina */}
                     <div>
                       <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                         <BatteryCharging className="w-4 h-4 text-slate-400" /> Custos de Máquina
                       </h4>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Energia (R$/kWh)</Label>
                            <Input type="number" value={kwhPrice} onChange={(e) => setKwhPrice(e.target.value)} className="h-12 text-base font-bold rounded-xl bg-background" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Potência (W)</Label>
                            <Input type="number" value={powerWatts} onChange={(e) => setPowerWatts(e.target.value)} className="h-12 text-base rounded-xl bg-yellow-500/5 text-yellow-700 font-black border-yellow-500/20 focus:bg-yellow-500/10" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Depreciação (R$/h)</Label>
                            <Input type="number" value={depreciation} onChange={(e) => setDepreciation(e.target.value)} className="h-12 text-base font-bold rounded-xl bg-background" />
                          </div>
                       </div>
                     </div>

                     {/* Bloco 2: Mão de Obra */}
                     <div className="pt-6 border-t border-border/50">
                       <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                         <Hammer className="w-4 h-4 text-slate-400" /> Mão de Obra & Taxas
                       </h4>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Sua Hora (R$/h)</Label>
                            <Input type="number" value={laborRate} onChange={(e) => setLaborRate(e.target.value)} className="h-12 text-base font-bold rounded-xl bg-background" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Acabamento (min)</Label>
                            <Input type="number" value={postProcessingMin} onChange={(e) => setPostProcessingMin(e.target.value)} className="h-12 text-base rounded-xl bg-blue-500/5 text-blue-700 font-black border-blue-500/20 focus:bg-blue-500/10" placeholder="Ex: 15" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Taxa Setup (R$)</Label>
                            <Input type="number" value={setupFee} onChange={(e) => setSetupFee(e.target.value)} className="h-12 text-base font-bold rounded-xl bg-background" />
                          </div>
                       </div>
                     </div>

                     {/* Bloco 3: Extras */}
                     <div className="pt-6 border-t border-border/50">
                        <div className="space-y-1.5 w-full md:w-1/3">
                          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Custos Extras (Embalagem, Ferragens) (R$)</Label>
                          <Input type="number" step="0.01" value={extraCosts} onChange={(e) => setExtraCosts(e.target.value)} className="h-12 text-base rounded-xl bg-emerald-500/5 text-emerald-700 font-black border-emerald-500/20 focus:bg-emerald-500/10" placeholder="Ex: 2.50" />
                        </div>
                     </div>

                  </div>
               </div>

               {/* --- SEÇÃO 4: PRECIFICADOR INTELIGENTE --- */}
               <div className="space-y-6 pt-8 border-t border-border/50">
                 <div className="flex items-center gap-3 mb-6">
                   <div className="p-2.5 bg-emerald-500/10 rounded-xl"><Calculator className="w-5 h-5 text-emerald-500" /></div>
                   <div>
                     <h3 className="text-xl font-black tracking-tight text-foreground uppercase">Precificador Inteligente</h3>
                     <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Defina seu lucro e veja os resultados</p>
                   </div>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Lado Esquerdo: Lucro Target e Custo Total */}
                    <div className="lg:col-span-5 bg-emerald-500/5 border border-emerald-500/20 p-8 rounded-[2rem] flex flex-col justify-between space-y-8">
                       <div className="space-y-3">
                         <Label htmlFor="pMargin" className="font-black text-emerald-700 uppercase tracking-widest text-xs">Margem de Lucro Desejada</Label>
                         <div className="relative">
                           <Input id="pMargin" type="number" value={profitMargin} onChange={(e) => setProfitMargin(e.target.value)} required className="h-16 pl-6 pr-10 text-3xl font-black bg-white/50 dark:bg-black/20 border-emerald-500/30 text-emerald-700 rounded-2xl shadow-inner focus:ring-emerald-500" />
                           <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xl font-black text-emerald-600/50">%</span>
                         </div>
                       </div>
                       
                       <div className="pt-8 border-t border-emerald-500/10 flex flex-col">
                          <span className="text-[11px] font-black text-emerald-700/70 uppercase tracking-widest mb-1">Custo de Fabricação Total</span>
                          <span className="text-4xl font-black text-emerald-700 tracking-tighter">R$ {calculatedCost.toFixed(2)}</span>
                       </div>
                    </div>

                    {/* Lado Direito: Resultados e Marketplaces */}
                    <div className="lg:col-span-7 space-y-4">
                       
                       {/* Preço Sugerido (Enorme) */}
                       <div className="bg-emerald-500/10 border border-emerald-500/30 p-8 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg shadow-emerald-500/5">
                          <div className="flex flex-col text-center sm:text-left">
                             <span className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-2">Sugestão Venda Direta</span>
                             <span className="text-5xl font-black text-emerald-600 tracking-tighter leading-none">R$ {suggestedPrice}</span>
                          </div>
                          <Button 
                             type="button"
                             onClick={() => setPrice(suggestedPrice)}
                             className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 w-full sm:w-auto"
                          >
                             <Wand2 className="w-5 h-5 mr-2" /> APLICAR PREÇO
                          </Button>
                       </div>

                       {/* Marketplaces */}
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-[2rem] relative group hover:border-yellow-500/40 transition-colors">
                              <Store className="w-12 h-12 absolute right-4 bottom-4 opacity-10 text-yellow-600" />
                              <span className="block text-[10px] font-black text-yellow-700 uppercase tracking-widest mb-2">Mercado Livre ({taxML}%)</span>
                              <span className="block text-3xl font-black text-yellow-600 tracking-tighter mb-4">R$ {suggestedPriceML}</span>
                              <Button type="button" variant="outline" onClick={() => setPrice(suggestedPriceML)} className="w-full h-10 text-[10px] uppercase font-black text-yellow-700 border-yellow-500/30 hover:bg-yellow-500/20 rounded-xl">Usar este preço</Button>
                          </div>
                          <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-[2rem] relative group hover:border-orange-500/40 transition-colors">
                              <Store className="w-12 h-12 absolute right-4 bottom-4 opacity-10 text-orange-600" />
                              <span className="block text-[10px] font-black text-orange-700 uppercase tracking-widest mb-2">Shopee ({taxShopee}%)</span>
                              <span className="block text-3xl font-black text-orange-600 tracking-tighter mb-4">R$ {suggestedPriceShopee}</span>
                              <Button type="button" variant="outline" onClick={() => setPrice(suggestedPriceShopee)} className="w-full h-10 text-[10px] uppercase font-black text-orange-700 border-orange-500/30 hover:bg-orange-500/20 rounded-xl">Usar este preço</Button>
                          </div>
                       </div>

                    </div>
                 </div>
               </div>

               {/* --- SEÇÃO 5: VITRINE FINAL --- */}
               <div className="space-y-6 pt-8 border-t border-border/50">
                 <div className="flex items-center gap-3 mb-6">
                   <div className="p-2.5 bg-indigo-500/10 rounded-xl"><ImageIcon className="w-5 h-5 text-indigo-500" /></div>
                   <div>
                     <h3 className="text-xl font-black tracking-tight text-foreground uppercase">Vitrine Digital</h3>
                     <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Preço final de venda e Mídias</p>
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/10 p-6 md:p-8 rounded-[2rem] border border-border/50">
                   <div className="space-y-2">
                     <Label htmlFor="price" className="text-[11px] font-black uppercase text-muted-foreground ml-1">Preço Final Oficial</Label>
                     <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-lg">R$</span>
                       <Input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required className="h-16 pl-12 rounded-2xl border-blue-500/30 bg-blue-500/5 focus:bg-blue-500/10 font-black text-2xl text-blue-600 transition-colors" />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="discount" className="text-[11px] font-black uppercase text-muted-foreground ml-1">Desconto Vitrine (Opcional)</Label>
                     <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-lg">R$</span>
                       <Input id="discount" type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} className="h-16 pl-12 rounded-2xl border-border bg-background font-black text-2xl" placeholder="0.00" />
                     </div>
                   </div>
                 </div>

                 <div className="pt-6">
                   <div className="flex items-center justify-between mb-4">
                     <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Fotos / Vídeos do Produto</Label>
                     <div className="px-3 py-1 bg-muted rounded-lg text-[10px] font-black text-muted-foreground uppercase tracking-widest">{existingImages.length + files.length}/{MAX_IMAGES} Mídias</div>
                   </div>
                   
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                     {existingImages.map((img) => (
                       <div key={img.id} className="relative aspect-square rounded-2xl border-2 border-border overflow-hidden group shadow-sm hover:border-red-500/50 transition-colors">
                         <img src={img.url} className="w-full h-full object-cover" />
                         <button 
                           type="button" 
                           onClick={() => removeExistingImage(img.id)} 
                           className="absolute top-2 right-2 bg-black/80 p-1.5 rounded-xl text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:scale-110"
                         >
                           <X className="w-4 h-4" />
                         </button>
                       </div>
                     ))}

                     {previews.map((url, i) => (
                       <div key={i} className="relative aspect-square rounded-2xl border-2 border-border overflow-hidden group shadow-sm hover:border-red-500/50 transition-colors">
                         <img src={url} className="w-full h-full object-cover" />
                         <button 
                           type="button" 
                           onClick={() => removeNewFile(i)} 
                           className="absolute top-2 right-2 bg-black/80 p-1.5 rounded-xl text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:scale-110"
                         >
                           <X className="w-4 h-4" />
                         </button>
                       </div>
                     ))}

                     {(existingImages.length + files.length) < MAX_IMAGES && (
                       <div className="relative aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center hover:bg-blue-500/5 hover:border-blue-500/30 hover:text-blue-500 transition-colors cursor-pointer bg-muted/20 text-muted-foreground group">
                         <Input 
                           type="file" 
                           accept="image/*,video/*" 
                           multiple 
                           onChange={handleFileSelect} 
                           className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                         />
                         <Plus className="w-8 h-8 mb-2 transition-transform group-hover:scale-110 group-active:scale-95" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">
                           Adicionar Mídia
                         </span>
                       </div>
                     )}
                   </div>
                 </div>
               </div>

               {/* --- BOTÃO SALVAR --- */}
               <div className="pt-8 border-t border-border/50 sticky bottom-0 bg-card/90 backdrop-blur-xl -mx-8 px-8 pb-8 z-50">
                 <Button type="submit" className="w-full h-16 font-black bg-blue-600 hover:bg-blue-500 text-white rounded-[1.5rem] shadow-2xl shadow-blue-500/20 text-xl tracking-wide uppercase transition-all active:scale-[0.98]">
                   {editingProductId ? 'SALVAR ALTERAÇÕES DO PRODUTO' : 'CADASTRAR PRODUTO NA VITRINE'}
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
                   whileHover={{ y: -5 }} 
                   transition={{ duration: 0.2 }}
                 >
                   <Card className="overflow-hidden h-full flex flex-col group rounded-[2.5rem] border-border bg-card/40 backdrop-blur-sm hover:border-blue-500/30 hover:shadow-2xl transition-all duration-500">
                      <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
                        {product.main_image_url || (product.product_images && product.product_images[0]) ? (
                          <img src={product.main_image_url || product.product_images[0].url} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        ) : (
                          <ImageIcon className="h-16 w-16 text-muted-foreground/20" />
                        )}
                        
                        <div className="absolute top-4 left-4 flex gap-2">
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm backdrop-blur-md ${product.is_public ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
                              {product.is_public ? 'Ativo' : 'Pausado'}
                            </div>
                            {product.product_images && product.product_images.length > 1 && (
                              <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm backdrop-blur-md bg-black/40 text-white border-white/20">
                                +{product.product_images.length}
                              </div>
                            )}
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
