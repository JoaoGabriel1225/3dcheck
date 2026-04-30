import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  ExternalLink, 
  Copy, 
  Store, 
  Palette, 
  ImageIcon, 
  Globe, 
  Check, 
  Instagram, 
  MessageCircle, 
  Eye, 
  Settings2,
  Share2
} from 'lucide-react';

export default function StorefrontSettings() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  // Settings state
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [instagram, setInstagram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  
  // Customization Toggles
  const [showPrices, setShowPrices] = useState(true);
  const [showStock, setShowStock] = useState(true);
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [currentLogo, setCurrentLogo] = useState('');
  const [currentBanner, setCurrentBanner] = useState('');

  const storeUrl = `${window.location.origin}/storefront/${profile?.id}`;

  useEffect(() => {
    if (!profile) return;
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('*')
          .eq('user_id', profile.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
          setStoreName(data.store_name || '');
          setDescription(data.description || '');
          setPrimaryColor(data.primary_color || '#3b82f6');
          setInstagram(data.instagram_handle || '');
          setWhatsapp(data.whatsapp_number || '');
          setShowPrices(data.show_prices ?? true);
          setShowStock(data.show_stock ?? true);
          setCurrentLogo(data.logo_url || '');
          setCurrentBanner(data.banner_url || '');
        }
      } catch (err: any) {
        console.error('Error fetching settings:', err);
      } finally {
        setFetching(false);
      }
    };
    fetchSettings();
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);

    try {
      let logoUrl = currentLogo;
      let bannerUrl = currentBanner;

      if (logoFile) {
        const filePath = `${profile.id}/logo-${Date.now()}`;
        const { error } = await supabase.storage.from('store-assets').upload(filePath, logoFile);
        if (!error) logoUrl = supabase.storage.from('store-assets').getPublicUrl(filePath).data.publicUrl;
      }

      if (bannerFile) {
        const filePath = `${profile.id}/banner-${Date.now()}`;
        const { error } = await supabase.storage.from('store-assets').upload(filePath, bannerFile);
        if (!error) bannerUrl = supabase.storage.from('store-assets').getPublicUrl(filePath).data.publicUrl;
      }

      const { error } = await supabase
        .from('store_settings')
        .upsert({
          user_id: profile.id,
          store_name: storeName,
          description,
          primary_color: primaryColor,
          instagram_handle: instagram,
          whatsapp_number: whatsapp,
          show_prices: showPrices,
          show_stock: showStock,
          logo_url: logoUrl,
          banner_url: bannerUrl,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success('Vitrine profissional atualizada!');
    } catch (err: any) {
      toast.error('Erro ao salvar configurações.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="py-20 text-center font-black text-slate-400 animate-pulse tracking-widest">SINCRONIZANDO VITRINE...</div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-5xl pb-20">
      {/* HEADER INTEGRADO */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-[0.2em]">
            <Store className="w-4 h-4" />
            Configuração de Vitrine
          </div>
          <h2 className="text-4xl font-black tracking-tight">Personalização</h2>
          <p className="text-muted-foreground font-medium">Transforme seu catálogo em uma experiência de marca única.</p>
        </div>
        
        <Button variant="outline" className="h-12 px-6 rounded-2xl border-border font-bold hover:bg-accent gap-2 transition-all shadow-sm" asChild>
          <a href={storeUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="w-4 h-4" />
            Ver Loja ao Vivo
          </a>
        </Button>
      </div>

      <form onSubmit={handleSave} className="grid gap-8">
        
        {/* CARD: LINK & COMPARTILHAMENTO */}
        <Card className="border-none bg-blue-600/5 dark:bg-blue-500/10 rounded-3xl overflow-hidden">
          <div className="p-8 flex flex-col md:flex-row items-center gap-6">
            <div className="p-4 bg-white dark:bg-black/20 rounded-2xl shadow-sm text-blue-600">
              <Share2 className="w-8 h-8" />
            </div>
            <div className="flex-1 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600/70">Link de Divulgação</span>
              <div className="text-sm font-bold text-foreground opacity-80">{storeUrl}</div>
            </div>
            <Button type="button" onClick={() => { navigator.clipboard.writeText(storeUrl); toast.success('Link copiado!'); }} className="h-12 px-8 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl gap-2 shadow-lg shadow-blue-600/20">
              <Copy className="h-4 h-4" /> Copiar Link
            </Button>
          </div>
        </Card>

        <div className="grid md:grid-cols-3 gap-8">
          {/* COLUNA ESQUERDA: CONFIGS BÁSICAS */}
          <div className="md:col-span-2 space-y-8">
            <Card className="border-border bg-card/40 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden">
              <CardHeader className="p-8 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Globe className="w-5 h-5" /></div>
                  <CardTitle className="text-xl font-black">Informações da Marca</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Nome da Loja</Label>
                  <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} required className="h-12 rounded-xl" placeholder="Ex: Master 3D Studio" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Slogan ou Descrição de Boas-vindas</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl min-h-[120px]" placeholder="Conte sobre sua qualidade de impressão..." />
                </div>
                
                <div className="grid sm:grid-cols-2 gap-6 pt-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-pink-500 tracking-wider flex items-center gap-2"><Instagram className="w-3 h-3" /> Instagram (sem @)</Label>
                    <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} className="h-12 rounded-xl border-pink-500/20 focus:border-pink-500" placeholder="loja.3d" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-emerald-500 tracking-wider flex items-center gap-2"><MessageCircle className="w-3 h-3" /> WhatsApp Comercial</Label>
                    <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="h-12 rounded-xl border-emerald-500/20 focus:border-emerald-500" placeholder="11999999999" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/40 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden">
              <CardHeader className="p-8 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Settings2 className="w-5 h-5" /></div>
                  <CardTitle className="text-xl font-black">Customização de Exibição</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 grid sm:grid-cols-2 gap-8">
                <div className="flex items-center justify-between p-4 bg-accent/20 rounded-2xl border border-border">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-black">Mostrar Preços</Label>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Exibir valores nos produtos</p>
                  </div>
                  <Switch checked={showPrices} onCheckedChange={setShowPrices} />
                </div>
                <div className="flex items-center justify-between p-4 bg-accent/20 rounded-2xl border border-border">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-black">Mostrar Estoque</Label>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Exibir quantidade disponível</p>
                  </div>
                  <Switch checked={showStock} onCheckedChange={setShowStock} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* COLUNA DIREITA: VISUAL */}
          <div className="space-y-8">
            <Card className="border-border bg-card/40 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden">
              <CardHeader className="p-8 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Palette className="w-5 h-5" /></div>
                  <CardTitle className="text-xl font-black">Visual</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Cor de Identidade</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-14 h-12 p-1 rounded-xl cursor-pointer border-border" />
                    <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-12 rounded-xl font-mono uppercase font-bold" />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border/50">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Logotipo</Label>
                  <div className="relative aspect-square w-full rounded-2xl bg-accent/30 border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                    {currentLogo ? <img src={currentLogo} className="w-full h-full object-contain p-4" /> : <ImageIcon className="w-8 h-8 opacity-10" />}
                  </div>
                  <Input type="file" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} className="h-11 rounded-xl text-xs pt-2.5 border-border cursor-pointer" />
                </div>
              </CardContent>
            </Card>

            <Button type="submit" disabled={loading} className="w-full h-16 text-lg font-black bg-blue-600 hover:bg-blue-500 text-white rounded-3xl shadow-2xl shadow-blue-600/30 transition-all active:scale-95">
              {loading ? 'Publicando...' : 'Publicar na Vitrine'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
