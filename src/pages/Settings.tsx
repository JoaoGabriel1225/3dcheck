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
  Loader2,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Store // Adicionado ícone Store
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Estados do Formulário (Com Valores Padrões Realistas de Mercado)
  const [storeName, setStoreName] = useState('');
  const [fullName, setFullName] = useState('');
  const [kwhPrice, setKwhPrice] = useState('0.95'); // Realidade br
  const [filamentPrice, setFilamentPrice] = useState('130.00'); // PLA médio
  const [profitMargin, setProfitMargin] = useState('150'); // Margem segura
  const [setupFee, setSetupFee] = useState('5.00');
  const [depreciation, setDepreciation] = useState('1.00');
  const [buffer, setBuffer] = useState('10'); // 10% de erro
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  
  // Taxas de Marketplace e Parâmetros de Energia/Trabalho/Purga
  const [taxML, setTaxML] = useState('18');
  const [taxShopee, setTaxShopee] = useState('20');
  const [powerWatts, setPowerWatts] = useState('300'); // Média Ender/Bambu
  const [laborRate, setLaborRate] = useState('35.00'); // Hora do Maker
  const [multicolorWaste, setMulticolorWaste] = useState('15'); // Desperdício AMS/MMU

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
          setKwhPrice(data.kwh_price?.toString() || '0.95');
          setFilamentPrice(data.filament_avg_price?.toString() || '130.00');
          setProfitMargin(data.profit_margin_pct?.toString() || '150');
          setSetupFee(data.setup_fee?.toString() || '5.00');
          setDepreciation(data.machine_depreciation_hour?.toString() || '1.00');
          setBuffer(data.failure_buffer_pct?.toString() || '10');
          
          setTaxML(data.tax_ml?.toString() || '18');
          setTaxShopee(data.tax_shopee?.toString() || '20');
          setPowerWatts(data.machine_power_watts?.toString() || '300');
          setLaborRate(data.labor_rate_hour?.toString() || '35.00');
          setMulticolorWaste(data.multicolor_waste_pct?.toString() || '15');
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

    setAvatarPreview(URL.createObjectURL(file));
    setLoading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${user.id}-profile.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('store-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('store-assets')
        .getPublicUrl(filePath);

      const finalUrl = `${publicUrl}?t=${Date.now()}`;

      await supabase.auth.updateUser({
        data: { avatar_url: finalUrl }
      });

      await supabase.from('profiles').update({ avatar_url: finalUrl }).eq('id', user.id);

      setAvatarUrl(finalUrl);
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

      await supabase.from('profiles').update({ name: fullName }).eq('id', user.id);

      const { error } = await supabase.from('store_settings').upsert({
        user_id: user.id,
        store_name: storeName,
        kwh_price: parseFloat(kwhPrice),
        filament_avg_price: parseFloat(filamentPrice),
        profit_margin_pct: parseInt(profitMargin),
        setup_fee: parseFloat(setupFee),
        machine_depreciation_hour: parseFloat(depreciation),
        failure_buffer_pct: parseInt(buffer),
        tax_ml: parseFloat(taxML),
        tax_shopee: parseFloat(taxShopee),
        machine_power_watts: parseFloat(powerWatts),
        labor_rate_hour: parseFloat(laborRate),
        multicolor_waste_pct: parseInt(multicolorWaste), // Salvando purga
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
    <div className="p-20 flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Sincronizando Oficina...</p>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-5xl space-y-10 pb-20"
    >
      <div className="flex flex-col gap-1 text-center md:text-left">
        <h2 className="text-4xl font-black tracking-tight text-foreground">Configurações</h2>
        <p className="text-muted-foreground text-lg">Parâmetros globais de custo e identidade da sua marca.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* CARD: PERFIL */}
        <Card className="rounded-[2.5rem] border-border bg-card shadow-xl overflow-hidden border-2">
          <CardHeader className="border-b border-border bg-muted/20 p-8">
            <CardTitle className="text-xl font-black flex items-center gap-3 text-foreground">
              <User className="w-6 h-6 text-blue-500" /> Perfil do Usuário
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="relative group">
                <div className="h-36 w-36 rounded-[2.5rem] border-4 border-background overflow-hidden bg-muted shadow-2xl flex items-center justify-center transition-all group-hover:scale-105">
                  {(avatarPreview || avatarUrl) ? (
                    <img src={avatarPreview || avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-4xl font-black text-blue-500/20 uppercase">User</div>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 p-3 bg-blue-600 text-white rounded-2xl cursor-pointer hover:bg-blue-500 transition-all shadow-xl hover:rotate-12 active:scale-90 z-10">
                  <Camera className="w-5 h-5" />
                  <input type="file" className="hidden" onChange={handleAvatarUpload} accept="image/*" />
                </label>
              </div>

              <div className="flex-1 grid sm:grid-cols-2 gap-6 w-full">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nome da Loja</Label>
                  <Input value={storeName} onChange={e => setStoreName(e.target.value)} className="h-14 rounded-2xl bg-muted/30" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nome Completo</Label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} className="h-14 rounded-2xl bg-muted/30" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          {/* CARD: FINANCEIRO */}
          <Card className="rounded-[2.5rem] border-border bg-card shadow-xl overflow-hidden border-2 flex flex-col">
            <CardHeader className="border-b border-border bg-emerald-500/5 p-8">
              <CardTitle className="text-xl font-black flex items-center gap-3 text-foreground uppercase tracking-tight">
                <DollarSign className="w-6 h-6 text-emerald-500" /> Inteligência Financeira
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6 flex-1">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                  Custo Energia (R$ / kWh)
                  <HelpCircle className="w-3.5 h-3.5 opacity-30" title="Consulte sua última fatura de energia." />
                </Label>
                <Input type="number" step="0.0001" min="0" value={kwhPrice} onChange={e => setKwhPrice(e.target.value)} className="h-14 rounded-2xl bg-muted/30 font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Média do Filamento (R$ / kg)</Label>
                <Input type="number" step="0.01" min="0" value={filamentPrice} onChange={e => setFilamentPrice(e.target.value)} className="h-14 rounded-2xl bg-muted/30 font-bold" />
              </div>
              
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                  Valor da sua Hora (R$ / h)
                  <HelpCircle className="w-3.5 h-3.5 opacity-30" title="Quanto vale a sua hora de trabalho manual (acabamento, pintura, embalagem)?" />
                </Label>
                <Input type="number" step="0.50" min="0" value={laborRate} onChange={e => setLaborRate(e.target.value)} className="h-14 rounded-2xl bg-muted/30 font-bold" />
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5" /> Margem de Lucro Sugerida (%)
                </Label>
                <Input type="number" min="0" value={profitMargin} onChange={e => setProfitMargin(e.target.value)} className="h-14 rounded-2xl bg-emerald-500/5 border-emerald-500/20 text-emerald-700 font-black text-lg" />
              </div>
            </CardContent>
          </Card>

          {/* COLUNA DA DIREITA: OFICINA + MARKETPLACE */}
          <div className="flex flex-col gap-8">
            {/* CARD: OFICINA */}
            <Card className="rounded-[2.5rem] border-border bg-card shadow-xl overflow-hidden border-2">
              <CardHeader className="border-b border-border bg-orange-500/5 p-8">
                <CardTitle className="text-xl font-black flex items-center gap-3 text-foreground uppercase tracking-tight">
                  <Wrench className="w-6 h-6 text-orange-500" /> Parâmetros da Máquina
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                      Potência (Watts)
                      <HelpCircle className="w-3.5 h-3.5 opacity-30" title="Consumo médio da sua impressora 3D em Watts." />
                    </Label>
                    <Input type="number" step="1" min="0" value={powerWatts} onChange={e => setPowerWatts(e.target.value)} className="h-12 rounded-2xl bg-muted/30 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                      Depreciação (R$/h)
                      <HelpCircle className="w-3.5 h-3.5 opacity-30" title="Custo de desgaste da máquina por hora de uso." />
                    </Label>
                    <Input type="number" step="0.01" min="0" value={depreciation} onChange={e => setDepreciation(e.target.value)} className="h-12 rounded-2xl bg-muted/30 font-bold" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Taxa de Setup Fixo (R$)</Label>
                  <Input type="number" step="0.10" min="0" value={setupFee} onChange={e => setSetupFee(e.target.value)} className="h-14 rounded-2xl bg-muted/30 font-bold" />
                  <p className="text-[9px] text-muted-foreground opacity-70">Custo fixo de preparação e limpeza da mesa.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-orange-600 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5" /> Margem de Erro (%)
                    </Label>
                    <Input type="number" min="0" max="100" value={buffer} onChange={e => setBuffer(e.target.value)} className="h-14 rounded-2xl bg-orange-500/5 border-orange-500/20 text-orange-700 font-black text-lg" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center justify-between">
                      <span className="flex items-center gap-2"><Settings2 className="w-3.5 h-3.5" /> Purga (AMS/MMU)</span>
                      <HelpCircle className="w-3.5 h-3.5 opacity-30" title="Porcentagem de desperdício em peças com troca de cor." />
                    </Label>
                    <Input type="number" min="0" max="100" value={multicolorWaste} onChange={e => setMulticolorWaste(e.target.value)} className="h-14 rounded-2xl bg-indigo-500/5 border-indigo-500/20 text-indigo-700 font-black text-lg" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CARD: TAXAS DE VENDA (MARKETPLACE) */}
            <Card className="rounded-[2.5rem] border-border bg-card shadow-xl overflow-hidden border-2">
              <CardHeader className="border-b border-border bg-indigo-500/5 p-8">
                <CardTitle className="text-xl font-black flex items-center gap-3 text-foreground uppercase tracking-tight">
                  <Store className="w-6 h-6 text-indigo-500" /> Taxas de Venda
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-yellow-500">Mercado Livre (%)</Label>
                  <Input type="number" step="0.1" min="0" value={taxML} onChange={e => setTaxML(e.target.value)} className="h-14 rounded-2xl bg-yellow-500/5 border-yellow-500/20 text-yellow-600 font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-orange-500">Shopee (%)</Label>
                  <Input type="number" step="0.1" min="0" value={taxShopee} onChange={e => setTaxShopee(e.target.value)} className="h-14 rounded-2xl bg-orange-500/5 border-orange-500/20 text-orange-600 font-bold" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full h-20 rounded-[2rem] bg-blue-600 hover:bg-blue-500 text-white font-black text-xl shadow-2xl shadow-blue-600/30 transition-all active:scale-[0.98] hover:-translate-y-1 uppercase tracking-widest"
        >
          {loading ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <span className="flex items-center gap-4">
              <Save className="w-6 h-6" /> ATUALIZAR MINHA OFICINA
            </span>
          )}
        </Button>

      </form>
    </motion.div>
  );
}
