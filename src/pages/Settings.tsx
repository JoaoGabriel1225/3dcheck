import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  User, 
  Settings2, 
  DollarSign, 
  Zap, 
  Wrench, 
  Camera,
  Save,
  Loader2
} from 'lucide-react';

export default function Settings() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Estados do Formulário
  const [storeName, setStoreName] = useState('');
  const [fullName, setFullName] = useState('');
  const [kwhPrice, setKwhPrice] = useState('0.85');
  const [filamentPrice, setFilamentPrice] = useState('120.00');
  const [profitMargin, setProfitMargin] = useState('100');
  const [setupFee, setSetupFee] = useState('5.00');
  const [depreciation, setDepreciation] = useState('1.50');
  const [buffer, setBuffer] = useState('5');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    async function loadSettings() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (data) {
          setStoreName(data.store_name || '');
          setKwhPrice(data.kwh_price?.toString() || '0.85');
          setFilamentPrice(data.filament_avg_price?.toString() || '120.00');
          setProfitMargin(data.profit_margin_pct?.toString() || '100');
          setSetupFee(data.setup_fee?.toString() || '5.00');
          setDepreciation(data.machine_depreciation_hour?.toString() || '1.50');
          setBuffer(data.failure_buffer_pct?.toString() || '5');
        }
        
        // Carrega info do Auth Metadata
        setFullName(user.user_metadata?.full_name || '');
        setAvatarUrl(user.user_metadata?.avatar_url || '');
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    }
    loadSettings();
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${user.id}-${Math.random()}.${fileExt}`;

      // 1. Upload para o Storage
      const { error: uploadError } = await supabase.storage
        .from('store-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Pegar URL Pública
      const { data: { publicUrl } } = supabase.storage
        .from('store-assets')
        .getPublicUrl(filePath);

      // 3. Atualizar User Metadata (Para o Header)
      const { error: authError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (authError) throw authError;

      setAvatarUrl(publicUrl);
      toast.success('Foto de perfil atualizada!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      // Atualiza Perfil (Auth)
      await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      // Atualiza Configurações Financeiras (Tabela)
      const { error } = await supabase.from('store_settings').upsert({
        user_id: user.id,
        store_name: storeName,
        kwh_price: parseFloat(kwhPrice),
        filament_avg_price: parseFloat(filamentPrice),
        profit_margin_pct: parseInt(profitMargin),
        setup_fee: parseFloat(setupFee),
        machine_depreciation_hour: parseFloat(depreciation),
        failure_buffer_pct: parseInt(buffer),
        updated_at: new Date().toISOString()
      });

      if (error) throw error;
      toast.success('Configurações salvas com sucesso!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-20 text-center animate-pulse font-bold text-slate-500">CARREGANDO PAINEL...</div>;

  return (
    <div className="max-w-4xl space-y-8 pb-20">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black tracking-tight text-white">Configurações</h2>
        <p className="text-slate-400">Gerencie sua identidade e os parâmetros de custo da sua oficina.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* CARD: PERFIL */}
        <Card className="rounded-[2rem] border-white/5 bg-zinc-900/50 backdrop-blur-xl overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-white/5">
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <User className="w-5 h-5 text-blue-500" /> Perfil do Usuário
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative group">
                <div className="h-24 w-24 rounded-3xl border-2 border-blue-500/50 overflow-hidden bg-zinc-950 shadow-2xl shadow-blue-500/10 transition-transform group-hover:scale-105">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-blue-500 font-black text-2xl">3D</div>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 p-2 bg-blue-600 rounded-xl cursor-pointer hover:bg-blue-500 transition-colors shadow-lg">
                  <Camera className="w-4 h-4 text-white" />
                  <input type="file" className="hidden" onChange={handleAvatarUpload} accept="image/*" />
                </label>
              </div>

              <div className="flex-1 grid sm:grid-cols-2 gap-4 w-full">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500">Nome da Loja</Label>
                  <Input value={storeName} onChange={e => setStoreName(e.target.value)} className="bg-zinc-950 border-white/10 text-white h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500">Seu Nome Completo</Label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} className="bg-zinc-950 border-white/10 text-white h-12" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CARD: FINANCEIRO */}
        <Card className="rounded-[2rem] border-white/5 bg-zinc-900/50 backdrop-blur-xl overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-white/5">
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <DollarSign className="w-5 h-5 text-emerald-500" /> Inteligência Financeira
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Energia (R$ / kWh)
              </Label>
              <Input type="number" step="0.01" value={kwhPrice} onChange={e => setKwhPrice(e.target.value)} className="bg-zinc-950 border-white/10 text-white h-12" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Preço Filamento (R$ / kg)</Label>
              <Input type="number" step="0.01" value={filamentPrice} onChange={e => setFilamentPrice(e.target.value)} className="bg-zinc-950 border-white/10 text-white h-12" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Lucro Padrão (%)</Label>
              <Input type="number" value={profitMargin} onChange={e => setProfitMargin(e.target.value)} className="bg-zinc-950 border-white/10 text-white h-12" />
            </div>
          </CardContent>
        </Card>

        {/* CARD: OFICINA */}
        <Card className="rounded-[2rem] border-white/5 bg-zinc-900/50 backdrop-blur-xl overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-white/5">
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <Wrench className="w-5 h-5 text-amber-500" /> Parâmetros da Máquina
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Taxa de Setup (R$)</Label>
              <Input type="number" step="0.01" value={setupFee} onChange={e => setSetupFee(e.target.value)} className="bg-zinc-950 border-white/10 text-white h-12" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Depreciação (R$ / hora)</Label>
              <Input type="number" step="0.01" value={depreciation} onChange={e => setDepreciation(e.target.value)} className="bg-zinc-950 border-white/10 text-white h-12" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Buffer de Falha (%)</Label>
              <Input type="number" value={buffer} onChange={e => setBuffer(e.target.value)} className="bg-zinc-950 border-white/10 text-white h-12" />
            </div>
          </CardContent>
        </Card>

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-lg shadow-xl shadow-blue-600/20 transition-all active:scale-95"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> SALVAR CONFIGURAÇÕES</>}
        </Button>

      </form>
    </div>
  );
}
