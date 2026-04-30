import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ExternalLink, Copy, Store, Palette, ImageIcon, Globe, Share2, Image as ImageLucide, Layout } from 'lucide-react';

export default function StorefrontSettings() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [themeStyle, setThemeStyle] = useState('dark'); // dark, light, colored
  const [instagram, setInstagram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
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
        const { data, error } = await supabase.from('store_settings').select('*').eq('user_id', profile.id).single();
        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
          setStoreName(data.store_name || '');
          setDescription(data.description || '');
          setPrimaryColor(data.primary_color || '#3b82f6');
          setThemeStyle(data.theme_style || 'dark');
          setInstagram(data.instagram_handle || '');
          setWhatsapp(data.whatsapp_number || '');
          setShowPrices(data.show_prices ?? true);
          setShowStock(data.show_stock ?? true);
          setCurrentLogo(data.logo_url || '');
          setCurrentBanner(data.banner_url || '');
        }
      } catch (err) { console.error('Error fetching settings:', err); } 
      finally { setFetching(false); }
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

      const { error } = await supabase.from('store_settings').upsert({
        user_id: profile.id,
        store_name: storeName,
        description,
        primary_color: primaryColor,
        theme_style: themeStyle,
        instagram_handle: instagram,
        whatsapp_number: whatsapp,
        show_prices: showPrices,
        show_stock: showStock,
        logo_url: logoUrl,
        banner_url: bannerUrl,
        updated_at: new Date().toISOString()
      });

      if (error) throw error;
      toast.success('Vitrine atualizada!');
      setCurrentLogo(logoUrl);
      setCurrentBanner(bannerUrl);
    } catch (err) { toast.error('Erro ao salvar. Verifique o banco de dados.'); } 
    finally { setLoading(false); }
  };

  if (fetching) return <div className="py-20 text-center font-black animate-pulse tracking-widest text-muted-foreground">SINCRONIZANDO...</div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-5xl pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-[0.2em]"><Store className="w-4 h-4" /> Configurações da Loja</div>
          <h2 className="text-4xl font-black tracking-tight text-foreground">Personalização</h2>
        </div>
        <Button variant="outline" className="h-12 px-6 rounded-xl border-border font-bold hover:bg-accent gap-2" asChild>
          <a href={storeUrl} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /> Ver Loja ao Vivo</a>
        </Button>
      </div>

      <form onSubmit={handleSave} className="grid gap-8">
        <Card className="border-none bg-blue-500/5 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-8 flex flex-col md:flex-row items-center gap-6">
            <div className="p-4 bg-white dark:bg-black/20 rounded-2xl text-blue-600"><Share2 className="w-8 h-8" /></div>
            <div className="flex-1 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600/70">Link da Vitrine</span>
              <div className="text-sm font-bold text-foreground opacity-80">{storeUrl}</div>
            </div>
            <Button type="button" onClick={() => { navigator.clipboard.writeText(storeUrl); toast.success('Copiado!'); }} className="h-12 px-8 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl gap-2">
              <Copy className="w-4 h-4" /> Copiar
            </Button>
          </div>
        </Card>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <Card className="border-border bg-card/40 backdrop-blur-sm rounded-3xl shadow-xl">
              <CardHeader className="p-8 border-b border-border/50">
                <CardTitle className="text-xl font-black flex items-center gap-3"><Globe className="w-5 h-5 text-blue-500" /> Conteúdo</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Nome da Loja</Label>
                  <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Boas-vindas</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl min-h-[120px]" />
                </div>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-pink-500">Instagram (sem @)</Label>
                    <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} className="h-12 rounded-xl" placeholder="ex: minha.loja" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-emerald-500">WhatsApp (com DDD)</Label>
                    <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="h-12 rounded-xl" placeholder="11999999999" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="border-border bg-card/40 backdrop-blur-sm rounded-3xl shadow-xl">
              <CardHeader className="p-8 border-b border-border/50">
                <CardTitle className="text-xl font-black flex items-center gap-3"><Palette className="w-5 h-5 text-blue-500" /> Visualização</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                
                {/* NOVO: SELEÇÃO DE TEMA */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Estilo de Fundo</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => setThemeStyle('dark')} className={`p-3 rounded-xl border-2 text-center text-[10px] font-bold uppercase transition-all ${themeStyle === 'dark' ? 'border-blue-500 bg-blue-500/10' : 'border-border'}`}>Escuro</button>
                    <button type="button" onClick={() => setThemeStyle('light')} className={`p-3 rounded-xl border-2 text-center text-[10px] font-bold uppercase transition-all ${themeStyle === 'light' ? 'border-blue-500 bg-blue-500/10' : 'border-border'}`}>Claro</button>
                    <button type="button" onClick={() => setThemeStyle('colored')} className={`p-3 rounded-xl border-2 text-center text-[10px] font-bold uppercase transition-all ${themeStyle === 'colored' ? 'border-blue-500 bg-blue-500/10' : 'border-border'}`}>Cor</button>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-border/50">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Cor de Destaque</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-14 h-12 p-1 rounded-xl cursor-pointer" />
                    <Input value={primaryColor} readOnly className="h-12 rounded-xl font-mono uppercase" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Logotipo</Label>
                  <div className="aspect-square w-full rounded-2xl bg-accent/30 border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                    {currentLogo ? <img src={currentLogo} className="w-full h-full object-contain p-4" /> : <ImageIcon className="opacity-10 w-10 h-10" />}
                  </div>
                  <Input type="file" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} className="h-11 rounded-xl pt-2 text-xs" />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Banner</Label>
                  <div className="aspect-video w-full rounded-2xl bg-accent/30 border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                    {currentBanner ? <img src={currentBanner} className="w-full h-full object-cover" /> : <ImageLucide className="opacity-10 w-10 h-10" />}
                  </div>
                  <Input type="file" onChange={(e) => setBannerFile(e.target.files?.[0] || null)} className="h-11 rounded-xl pt-2 text-xs" />
                </div>
              </CardContent>
            </Card>
            <Button type="submit" disabled={loading} className="w-full h-16 text-lg font-black bg-blue-600 hover:bg-blue-500 text-white rounded-3xl shadow-2xl transition-all">
              {loading ? 'Salvando...' : 'Publicar Alterações'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
