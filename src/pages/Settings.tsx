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
  const { user } = useAuth();
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
        const { data } = await supabase
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
      const filePath = `avatars/${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('store-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('store-assets')
        .getPublicUrl(filePath);

      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      setAvatarUrl(publicUrl);
      toast.success('Foto de perfil atualizada!');
    } catch (error: any) {
      toast.error('Erro no upload da imagem.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

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
      toast.error('Erro ao salvar as configurações.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="p-20 text-center animate-pulse">
      <p className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Oficina...</p>
    </div>
  );

  return (
    <div className="max-w-5xl space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-1">
        <h2 className="text-4xl font-black tracking-tight text-foreground">Configurações</h2>
        <p className="text-muted-foreground text-lg">Gerencie sua identidade e os parâmetros de custo da sua produção 3D.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* CARD: PERFIL */}
        <Card className="rounded-[2.5rem] border-border bg-card shadow-xl overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/30 p-8">
            <CardTitle className="text-xl font-black flex items-center gap-3 text-foreground">
              <User className="w-6 h-6 text-blue-500" /> Perfil do Usuário
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="relative group">
                <div className="h-32 w-32 rounded-[2rem] border-2 border-blue-500/20 overflow-hidden bg-muted shadow-inner flex items-center justify-center transition-all group-hover:scale-105 group-hover:border-blue-500/50">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-4xl font-black text-blue-500">3D</div>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 p-3 bg-blue-600 rounded-2xl cursor-pointer hover:bg-blue-500 transition-all shadow-lg hover:rotate-12 active:scale-90">
                  <Camera className="w-5 h-5 text-white" />
                  <input type="file" className="hidden" onChange={handleAvatarUpload} accept="image/*" />
                </label>
              </div>

              <div className="flex-1 grid sm:grid-cols-2 gap-6 w-full">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nome da Loja</Label>
                  <Input value={storeName} onChange={e => setStoreName(e.target.value)} className="h-14 rounded-2xl bg-muted/50 border-border text-foreground text-base focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Seu Nome Completo</Label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} className="h-14 rounded-2xl bg-muted/50 border-border text-foreground text-base focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          {/* CARD: FINANCEIRO */}
          <Card className="rounded-[2.5rem] border-border bg-card shadow-xl overflow-hidden">
            <CardHeader className="border-b border-border bg-muted/30 p-8">
              <CardTitle className="text-xl font-black flex items-center gap-3 text-foreground">
                <DollarSign className="w-6 h-6 text-emerald-500" /> Inteligência Financeira
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> Energia (R$ / kWh)
                </Label>
                <Input type="number" step="0.01" value={kwhPrice} onChange={e => setKwhPrice(e.target.value)} className="h-14 rounded-2xl bg-muted/50 border-border text-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Preço Filamento (R$ / kg)</Label>
                <Input type="number" step="0.01" value={filamentPrice} onChange={e => setFilamentPrice(e.target.value)} className="h-14 rounded-2xl bg-muted/50 border-border text-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lucro Padrão (%)</Label>
                <Input type="number" value={profitMargin} onChange={e => setProfitMargin(e.target.value)} className="h-14 rounded-2xl bg-muted/50 border-border text-foreground" />
              </div>
            </CardContent>
          </Card>

          {/* CARD: OFICINA */}
          <Card className="rounded-[2.5rem] border-border bg-card shadow-xl overflow-hidden">
            <CardHeader className="border-b border-border bg-muted/30 p-8">
              <CardTitle className="text-xl font-black flex items-center gap-3 text-foreground">
                <Wrench className="w-6 h-6 text-orange-500" /> Parâmetros da Máquina
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Taxa de Setup (R$)</Label>
                <Input type="number" step="0.01" value={setupFee} onChange={e => setSetupFee(e.target.value)} className="h-14 rounded-2xl bg-muted/50 border-border text-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Depreciação (R$ / hora)</Label>
                <Input type="number" step="0.01" value={depreciation} onChange={e => setDepreciation(e.target.value)} className="h-14 rounded-2xl bg-muted/50 border-border text-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Buffer de Falha (%)</Label>
                <Input type="number" value={buffer} onChange={e => setBuffer(e.target.value)} className="h-14 rounded-2xl bg-muted/50 border-border text-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full h-20 rounded-3xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xl shadow-2xl shadow-blue-600/30 transition-all active:scale-[0.97] hover:-translate-y-1"
        >
          {loading ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <span className="flex items-center gap-3">
              <Save className="w-6 h-6" /> ATUALIZAR MINHA OFICINA
            </span>
          )}
        </Button>

      </form>
    </div>
  );
}
