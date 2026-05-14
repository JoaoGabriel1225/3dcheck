import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Plus, Trash2, Edit, Save, X, Palette, Scale, DollarSign, Box } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Filament {
  id: string;
  brand: string;
  material: string;
  color: string;
  color_hex: string;
  price: number;
  weight_g: number;
}

export default function Filaments() {
  const { user } = useAuth();
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [brand, setBrand] = useState('');
  const [material, setMaterial] = useState('PLA');
  const [colorName, setColorName] = useState('');
  const [colorHex, setColorHex] = useState('#000000');
  const [price, setPrice] = useState('');
  const [weight, setWeight] = useState('1000');

  useEffect(() => {
    fetchFilaments();
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
      setWeight(filament.weight_g.toString());
    } else {
      setEditingId(null);
      setBrand('');
      setMaterial('PLA');
      setColorName('');
      setColorHex('#000000');
      setPrice('');
      setWeight('1000');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const payload = {
      user_id: user.id,
      brand,
      material,
      color: colorName,
      color_hex: colorHex,
      price: parseFloat(price),
      weight_g: parseFloat(weight),
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('filaments').update(payload).eq('id', editingId);
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
    if (!window.confirm('Tem certeza que deseja excluir este filamento? Ele não estará mais disponível para novos produtos.')) return;
    
    try {
      const { error } = await supabase.from('filaments').delete().eq('id', id);
      if (error) throw error;
      toast.success('Filamento removido.');
      setFilaments(filaments.filter(f => f.id !== id));
    } catch (error) {
      toast.error('Erro ao remover filamento. Talvez ele esteja vinculado a um produto.');
    }
  };

  if (loading) return <div className="p-8 text-muted-foreground animate-pulse">Carregando estoque de filamentos...</div>;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <Box className="w-6 h-6 text-blue-500" />
            Estoque de Filamentos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie seu material e descubra o custo exato por grama.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Novo Filamento
        </button>
      </div>

      {/* Grid de Filamentos */}
      {filaments.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center flex flex-col items-center">
          <Palette className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-1">Nenhum filamento cadastrado</h3>
          <p className="text-sm text-muted-foreground mb-4">Cadastre seus rolos para calcular o lucro exato dos seus produtos.</p>
          <button onClick={() => openModal()} className="text-blue-500 font-bold hover:underline">Cadastrar o primeiro</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filaments.map((f) => {
            const costPerGram = (f.price / f.weight_g).toFixed(4);
            return (
              <motion.div 
                key={f.id} 
                layoutId={f.id}
                className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-blue-500/30 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full border-2 border-background shadow-inner" 
                      style={{ backgroundColor: f.color_hex || '#000' }} 
                    />
                    <div>
                      <h3 className="font-bold text-foreground text-lg leading-none">{f.brand}</h3>
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{f.material} • {f.color}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal(f)} className="p-1.5 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(f.id)} className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border/50">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3"/> Preço do Rolo</span>
                    <span className="font-medium text-foreground">R$ {f.price.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-1 flex items-center gap-1"><Scale className="w-3 h-3"/> Peso</span>
                    <span className="font-medium text-foreground">{f.weight_g}g</span>
                  </div>
                </div>

                <div className="mt-4 bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-xs font-bold text-blue-500 uppercase">Custo por Grama</span>
                  <span className="font-black text-blue-500">R$ {costPerGram}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
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
              className="relative bg-card border border-border shadow-2xl rounded-2xl w-full max-w-md p-6 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-foreground">{editingId ? 'Editar Filamento' : 'Novo Filamento'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Marca</label>
                    <input required value={brand} onChange={e => setBrand(e.target.value)} placeholder="Ex: eSun, Voolt3D" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors text-foreground" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Material</label>
                    <select value={material} onChange={e => setMaterial(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors text-foreground">
                      <option value="PLA">PLA</option>
                      <option value="PETG">PETG</option>
                      <option value="ABS">ABS</option>
                      <option value="TPU">TPU</option>
                      <option value="Resina">Resina</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Nome da Cor</label>
                    <input required value={colorName} onChange={e => setColorName(e.target.value)} placeholder="Ex: Preto, Silk Gold" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors text-foreground" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Cor Real</label>
                    <input type="color" value={colorHex} onChange={e => setColorHex(e.target.value)} className="w-full h-[38px] p-1 bg-background border border-border rounded-lg cursor-pointer" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Preço Pago (R$)</label>
                    <input required type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="120.00" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors text-foreground" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Peso (gramas)</label>
                    <input required type="number" step="1" min="1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="1000" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors text-foreground" />
                  </div>
                </div>

                {price && weight && (
                  <div className="mt-4 bg-accent/50 rounded-lg p-3 text-center border border-border/50">
                    <span className="text-xs text-muted-foreground">O custo deste material será de </span>
                    <strong className="text-blue-500">R$ {(parseFloat(price) / parseFloat(weight)).toFixed(4)} por grama</strong>
                  </div>
                )}

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold mt-6 flex items-center justify-center gap-2 transition-colors">
                  <Save className="w-5 h-5" />
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Filamento'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
