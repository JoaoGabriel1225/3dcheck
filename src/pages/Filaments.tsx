import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Plus, Trash2, Edit, X, Palette, Box, AlertTriangle, RefreshCw, Search, Layers, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface Filament {
  id: string;
  brand: string;
  material: string;
  color: string;
  color_hex: string;
  price: number;
  weight_g: number;
  original_weight_g?: number; 
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Filaments() {
  const { user } = useAuth();
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [brand, setBrand] = useState('');
  const [material, setMaterial] = useState('PLA');
  const [colorName, setColorName] = useState('');
  const [colorHex, setColorHex] = useState('#000000');
  const [price, setPrice] = useState('');
  const [weight, setWeight] = useState('1000');
  const [originalWeight, setOriginalWeight] = useState('1000'); 
  const [quantity, setQuantity] = useState('1');

  const [searchTerm, setSearchTerm] = useState('');

  const [isRefillModalOpen, setIsRefillModalOpen] = useState(false);
  const [refillFilament, setRefillFilament] = useState<Filament | null>(null);
  const [refillAmount, setRefillAmount] = useState('1000');
  const [refillPrice, setRefillPrice] = useState('');

  useEffect(() => {
    fetchFilaments();

    if (!user) return;
    const subscription = supabase
      .channel('filaments_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'filaments', filter: `user_id=eq.${user.id}` }, () => {
        fetchFilaments(); 
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [user]);

  const fetchFilaments = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('filaments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFilaments(data || []);

      // Busca inteligente para saber quantos produtos usam cada filamento
      try {
        const { data: pData } = await supabase.from('products').select('filament_id').eq('user_id', user.id);
        if (pData) {
            const counts: Record<string, number> = {};
            pData.forEach(p => {
                if (p.filament_id) counts[p.filament_id] = (counts[p.filament_id] || 0) + 1;
            });
            setProductCounts(counts);
        }
      } catch (err) {}

    } catch (error) {
      toast.error('Erro ao carregar filamentos.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (filament?: Filament) => {
    if (filament) {
      setEditingId(filament.id);
      setBrand(filament.brand);
      setMaterial(filament.material);
      setColorName(filament.color);
      setColorHex(filament.color_hex || '#000000');
      setPrice(filament.price.toString());
      // Quando edita, o peso volta a ser a unidade de referência
      const safeUnit = (filament.original_weight_g && filament.original_weight_g > 3000) ? 1000 : (filament.original_weight_g || 1000);
      setWeight(safeUnit.toString());
      setOriginalWeight(safeUnit.toString());
      setQuantity('1');
    } else {
      setEditingId(null);
      setBrand('');
      setMaterial('PLA');
      setColorName('');
      setColorHex('#000000');
      setPrice('');
      setWeight('1000');
      setOriginalWeight('1000');
      setQuantity('1');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // MATEMÁTICA CORRIGIDA: O Banco sempre vai guardar o peso de 1 ÚNICO rolo como referência
    const qty = editingId ? 1 : (parseInt(quantity) || 1);
    const unitWeight = parseFloat(weight);
    const unitPrice = parseFloat(price);

    const totalWeight = unitWeight * qty;
    const totalPrice = unitPrice * qty;

    const payload = {
      user_id: user.id,
      brand,
      material,
      color: colorName,
      color_hex: colorHex,
      price: editingId ? unitPrice : totalPrice, 
      weight_g: editingId ? parseFloat(weight) : totalWeight, // Edição ajusta só o total
      original_weight_g: unitWeight, // Salva o tamanho do rolo real (Ex: 1000g)
    };

    try {
      if (editingId) {
        // Na edição, se o usuário alterar o peso, entendemos que ele está ajustando o estoque atual
        const { error } = await supabase.from('filaments').update({ ...payload, weight_g: parseFloat(weight) }).eq('id', editingId);
        if (error) throw error;
        toast.success('Filamento atualizado!');
      } else {
        const { error } = await supabase.from('filaments').insert([payload]);
        if (error) throw error;
        toast.success('Filamento cadastrado!');
      }
      setIsModalOpen(false);
      fetchFilaments();
    } catch (error) {
      toast.error('Erro ao salvar filamento.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este filamento? Ele sumirá das opções dos produtos cadastrados.')) return;
    try {
      const { error } = await supabase.from('filaments').delete().eq('id', id);
      if (error) throw error;
      toast.success('Filamento removido.');
      setFilaments(filaments.filter(f => f.id !== id));
    } catch (error) {
      toast.error('Erro ao remover filamento. Talvez ele esteja vinculado a um produto.');
    }
  };

  // Botão Mágico: Joga o restinho no lixo e abre o próximo rolo
  const handleDiscardRemainder = async (f: Filament, remainder: number) => {
    if (!window.confirm(`Jogar fora as ${remainder.toFixed(0)}g de sobra e abrir o rolo novo?`)) return;
    const newWeight = f.weight_g - remainder;
    try {
        const { error } = await supabase.from('filaments').update({ weight_g: newWeight }).eq('id', f.id);
        if (error) throw error;
        toast.success('Sobra descartada! Rolo trocado com sucesso.');
        fetchFilaments();
    } catch (e) { toast.error('Erro ao trocar rolo.'); }
  };

  const openRefillModal = (f: Filament) => {
    setRefillFilament(f);
    const unitW = (f.original_weight_g && f.original_weight_g > 3000) ? 1000 : (f.original_weight_g || 1000);
    setRefillAmount(unitW.toString());
    const baseCostPerGram = f.price / (f.weight_g || 1); // Custo médio atual
    setRefillPrice((unitW * baseCostPerGram).toFixed(2));
    setIsRefillModalOpen(true);
  };

  const submitRefill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refillFilament) return;

    const amount = parseFloat(refillAmount);
    const addedPrice = parseFloat(refillPrice.replace(',', '.'));

    if (isNaN(amount) || amount <= 0 || isNaN(addedPrice) || addedPrice < 0) {
        toast.error("Valores inválidos"); return;
    }

    const newWeight = refillFilament.weight_g + amount;
    const newPrice = refillFilament.price + addedPrice;

    try {
        // Reposição NÃO mexe no original_weight_g (que é a base da barra), apenas no estoque e custo
        const { error } = await supabase.from('filaments').update({
            weight_g: newWeight,
            price: newPrice
        }).eq('id', refillFilament.id);
        
        if (error) throw error;
        toast.success(`+${amount}g adicionadas ao estoque com sucesso!`);
        setIsRefillModalOpen(false);
        fetchFilaments();
    } catch(e) { toast.error('Erro ao repor estoque.'); }
  };

  const handleRefillAmountChange = (val: string) => {
      setRefillAmount(val);
      const amount = parseFloat(val) || 0;
      if (refillFilament) {
          const baseCostPerGram = refillFilament.price / (refillFilament.weight_g || 1);
          setRefillPrice((amount * baseCostPerGram).toFixed(2));
      }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage <= 20) return 'from-red-500 to-orange-500';
    if (percentage <= 40) return 'from-amber-400 to-yellow-500';
    return 'from-emerald-400 to-emerald-600';
  };

  const filteredFilaments = filaments.filter(f => 
    `${f.brand} ${f.material} ${f.color}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-muted-foreground animate-pulse">Carregando estoque de filamentos...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <Box className="w-6 h-6 text-blue-500" />
            Estoque de Filamentos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie seu material e acompanhe o gasto em tempo real.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Novo Filamento
        </button>
      </div>

      {filaments.length > 0 && (
        <div className="relative max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
          <Input
              placeholder="Buscar por marca, cor ou material..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 bg-card border-border rounded-xl w-full shadow-sm"
          />
        </div>
      )}

      {filaments.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center flex flex-col items-center">
          <Palette className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-1">Nenhum filamento cadastrado</h3>
          <p className="text-sm text-muted-foreground mb-4">Cadastre seus rolos para calcular o lucro exato dos seus produtos.</p>
          <button onClick={() => openModal()} className="text-blue-500 font-bold hover:underline">Cadastrar o primeiro</button>
        </div>
      ) : filteredFilaments.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground font-bold">Nenhum filamento encontrado para essa busca.</div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredFilaments.map((f) => {
            // Inteligência para dados antigos: Se o original for gigantesco, assume 1000g de base para não bugar a barra
            const safeUnitW = (f.original_weight_g && f.original_weight_g > 3000) ? 1000 : (f.original_weight_g || 1000);
            
            const totalW = f.weight_g;
            const fullRolls = Math.floor(totalW / safeUnitW);
            const remainder = totalW % safeUnitW;
            
            // Constrói o array visual de rolos para renderizar as barras múltiplas
            let barsToRender: number[] = [];
            if (remainder > 0) barsToRender.push(remainder); // O rolo aberto vai primeiro
            for(let i=0; i<fullRolls; i++) barsToRender.push(safeUnitW); // Depois os rolos fechados
            if (barsToRender.length === 0) barsToRender.push(0); // Se acabou tudo, mostra barra vazia

            const costPerGram = totalW > 0 ? (f.price / totalW).toFixed(4) : "0.0000"; 
            const isLow = totalW <= 200;
            const activeIsLow = remainder > 0 && remainder < 200; // Rolo atual tá nas últimas

            return (
              <motion.div 
                key={f.id} 
                variants={itemVariants}
                layoutId={f.id}
                className={`relative bg-card border rounded-3xl p-6 shadow-sm transition-all overflow-hidden flex flex-col justify-between ${isLow ? 'border-red-500/30' : 'border-border'}`}
              >
                {isLow && <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />}

                <div className="flex items-start justify-between mb-5 relative z-10">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-full border-4 border-background shadow-md shrink-0 flex items-center justify-center relative" 
                      style={{ backgroundColor: f.color_hex || '#000' }} 
                    >
                        {isLow && <AlertTriangle className="w-4 h-4 text-white drop-shadow-md" />}
                    </div>
                    <div>
                      <h3 className="font-black text-foreground text-lg leading-tight uppercase tracking-tight">{f.brand}</h3>
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{f.material} • {f.color}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button title="Repor Estoque" onClick={() => openRefillModal(f)} className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-colors"><RefreshCw className="w-4 h-4" /></button>
                    <button title="Editar Detalhes" onClick={() => openModal(f)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-colors"><Edit className="w-4 h-4" /></button>
                    <button title="Excluir" onClick={() => handleDelete(f.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                {/* NOVO: Tag mostrando os produtos vinculados */}
                <div className="flex items-center gap-1.5 mb-6 opacity-60">
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{productCounts[f.id] || 0} PRODUTOS VINCULADOS</span>
                </div>

                <div className="space-y-4 relative z-10 flex-1">
                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground flex items-center gap-1">
                                <Layers className="w-3.5 h-3.5" /> Situação dos Rolos
                            </span>
                            <span className={`text-lg font-black leading-none ${isLow ? 'text-red-500' : 'text-foreground'}`}>
                                {totalW.toFixed(0)}g
                            </span>
                        </div>
                        
                        {/* RENDERIZADOR MÚLTIPLO DE BARRAS DE VIDA */}
                        <div className="space-y-1.5">
                            {barsToRender.slice(0, 4).map((barW, idx) => {
                                const pct = (barW / safeUnitW) * 100;
                                const isActive = idx === 0 && remainder > 0; // Se tem sobra, a primeira barra é o rolo aberto
                                
                                return (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className="h-2.5 flex-1 bg-muted/50 rounded-full overflow-hidden border border-border/50 relative">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(pct)} ${!isActive && pct === 100 ? 'opacity-40' : ''}`}
                                            />
                                        </div>
                                        <span className={`text-[9px] font-black w-8 text-right ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {barW.toFixed(0)}g
                                        </span>
                                        {/* Botão mágico de Descartar Sobra e Trocar Rolo */}
                                        {isActive && activeIsLow && (
                                            <button 
                                                title="Descartar este resto e abrir o próximo rolo"
                                                onClick={() => handleDiscardRemainder(f, remainder)}
                                                className="absolute right-0 -mt-7 bg-red-500 text-white text-[8px] px-2 py-0.5 rounded-full font-bold shadow-md hover:scale-105 transition-transform"
                                            >
                                                TROCAR ROLO
                                            </button>
                                        )}
                                    </div>
                                )
                            })}
                            {barsToRender.length > 4 && (
                                <div className="text-[10px] font-black text-muted-foreground text-center mt-2 opacity-50 uppercase tracking-widest">
                                    + {barsToRender.length - 4} rolos fechados
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-5 border-t border-border/50 mt-6 relative z-10">
                    <div className="flex flex-col">
                        <span className="text-[9px] uppercase text-muted-foreground font-bold tracking-widest mb-1">Total Investido</span>
                        <span className="font-bold text-foreground text-sm">R$ {f.price.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col bg-blue-500/5 p-2 rounded-xl border border-blue-500/10 items-end justify-center">
                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest leading-none mb-1">Custo / Grama</span>
                        <span className="font-black text-blue-600 text-base leading-none">R$ {costPerGram}</span>
                    </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Modal de Reposição de Estoque */}
      <Dialog open={isRefillModalOpen} onOpenChange={setIsRefillModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem] border-border bg-card shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-black text-xl flex items-center gap-3">
                <div className="p-2 bg-emerald-500 rounded-lg text-white"><RefreshCw className="w-5 h-5" /></div>
                Repor Estoque
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={submitRefill} className="py-4 space-y-6">
            <div className="bg-muted/30 p-4 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-full border-2 border-background shadow-md shrink-0" style={{ backgroundColor: refillFilament?.color_hex || '#000' }} />
                <div>
                    <h4 className="font-black uppercase text-foreground leading-tight">{refillFilament?.brand}</h4>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{refillFilament?.material} • {refillFilament?.color}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Peso Adicionado (g)</Label>
                    <Input 
                        type="number" 
                        min="1" 
                        required 
                        value={refillAmount} 
                        onChange={(e) => handleRefillAmountChange(e.target.value)} 
                        className="h-12 rounded-xl bg-background font-black text-lg"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valor Pago (R$)</Label>
                    <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        required 
                        value={refillPrice} 
                        onChange={(e) => setRefillPrice(e.target.value)} 
                        className="h-12 rounded-xl bg-background font-black text-emerald-600 text-lg"
                    />
                </div>
            </div>
            
            <DialogFooter className="pt-2 gap-2">
                <Button type="button" variant="ghost" className="font-bold text-muted-foreground" onClick={() => setIsRefillModalOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-6 rounded-xl">Confirmar Reposição</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Cadastro/Edição Geral */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
              onClick={() => setIsModalOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-card border border-border shadow-2xl rounded-3xl w-full max-w-md p-8 overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                    {editingId ? <Edit className="w-5 h-5 text-blue-500" /> : <Plus className="w-5 h-5 text-blue-500" />}
                    {editingId ? 'Editar Detalhes' : 'Cadastrar Rolo'}
                </h2>
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 bg-muted/50 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">Marca</label>
                    <input required value={brand} onChange={e => setBrand(e.target.value)} placeholder="Ex: eSun, Voolt" className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-blue-500 transition-colors text-foreground" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">Material</label>
                    <select value={material} onChange={e => setMaterial(e.target.value)} className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-blue-500 transition-colors text-foreground cursor-pointer">
                      <option value="PLA">PLA</option>
                      <option value="PETG">PETG</option>
                      <option value="ABS">ABS</option>
                      <option value="TPU">TPU</option>
                      <option value="Resina">Resina</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-5">
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">Nome da Cor</label>
                    <input required value={colorName} onChange={e => setColorName(e.target.value)} placeholder="Ex: Preto, Silk Gold" className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-blue-500 transition-colors text-foreground" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">Cor Real</label>
                    <input type="color" value={colorHex} onChange={e => setColorHex(e.target.value)} className="w-full h-11 p-1 bg-muted/30 border border-border rounded-xl cursor-pointer" />
                  </div>
                </div>

                <div className={`grid ${editingId ? 'grid-cols-2' : 'grid-cols-3'} gap-3 pt-2`}>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">{editingId ? 'Custo (R$)' : 'Preço Unit. (R$)'}</label>
                    <input required type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="120.00" className="w-full bg-background border border-blue-500/30 rounded-xl px-3 py-3 text-sm font-bold focus:outline-none focus:border-blue-500 transition-colors text-blue-600" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                        {editingId ? 'Ajustar Total (g)' : 'Peso Unit. (g)'}
                    </label>
                    <input required type="number" step="1" min="0" value={weight} onChange={e => setWeight(e.target.value)} placeholder="1000" className="w-full bg-background border border-emerald-500/30 rounded-xl px-3 py-3 text-sm font-bold focus:outline-none focus:border-emerald-500 transition-colors text-emerald-600" />
                  </div>
                  {!editingId && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">Qtd Rolos</label>
                      <input required type="number" step="1" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm font-bold focus:outline-none focus:border-foreground transition-colors text-foreground text-center" />
                    </div>
                  )}
                </div>

                {price && weight && !editingId && (
                  <div className="mt-2 bg-blue-500/5 rounded-xl p-4 text-center border border-blue-500/10 flex justify-between items-center px-6">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Cálculo de Custo / Grama base</span>
                    <strong className="text-xl font-black text-blue-600 tracking-tighter">R$ {(parseFloat(price) / parseFloat(weight)).toFixed(4)}</strong>
                  </div>
                )}

                <button type="submit" className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black mt-8 shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all">
                  {editingId ? 'SALVAR AJUSTES' : 'CADASTRAR ROLO'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
