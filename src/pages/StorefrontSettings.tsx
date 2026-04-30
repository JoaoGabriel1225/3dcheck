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
import { ExternalLink, Copy, Store, Palette, ImageIcon, Globe, Share2, X, Layout } from 'lucide-react';

export default function StorefrontSettings() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [themeStyle, setThemeStyle] = useState('dark');
  const [instagram, setInstagram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  
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
        if (data) {
          setStoreName(data.store_name || '');
          setDescription(data.description || '');
          setPrimaryColor(data.primary_color || '#3b82f6');
          setThemeStyle(data.theme_style || 'dark');
          setInstagram(data.instagram_handle || '');
          setWhatsapp(data.whatsapp_number || '');
          setCurrentLogo(data.logo_url || '');
          setCurrentBanner(data.banner_url || '');
        }
      } catch (err) { console.error(err); } finally { setFetching(false); }
    };
    fetchSettings();
  }, [profile]);

  // FUNÇÃO PARA REMOVER IMAGEM
  const handleRemoveImage = async (type: 'logo' | 'banner') => {
    if (!profile) return;
    try {
      const updateData = type === 'logo' ? { logo_url: null } : { banner_url: null };
      const { error } = await supabase.from('store_settings').update(updateData).eq('user_id', profile.id);
      if (error) throw error;
      if (type === 'logo') setCurrentLogo(''); else setCurrentBanner('');
      toast.success(`${type === 'logo' ? 'Logo' : 'Banner'} removido!`);
    } catch (err) { toast.error("Erro ao remover."); }
  };

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
        logo_url: logoUrl,
        banner_url: bannerUrl,
        updated_at: new Date().toISOString()
      });

      if (error) throw error;
      toast.success('Vitrine atualizada!');
      setCurrentLogo(logoUrl);
      setCurrentBanner(bannerUrl);
    } catch (err) { toast.error('Erro ao salvar.'); } finally { setLoading(false); }
  };

  if (fetching) return <div className="py-20 text-center font-black animate-pulse text-muted-foreground">CARREGANDO...</div>;

  return (
    <div className="space-y-10 max-w-5xl pb-20">
      <div className="flex justify-between items-end">
        <h2 className="text-4xl font-black tracking-tight">Configurar Vitrine</h2>
        <Button variant="outline" className="rounded-xl font-bold" asChild>
          <a href={storeUrl} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4 mr-2" />Ver Loja</a>
        </Button>
      </div>

      <form onSubmit={handleSave} className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card className="rounded-3xl shadow-xl">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Nome da Loja</Label>
                <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} required className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Descrição</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl min-h-[100px]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase">Instagram</Label>
                  <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="usuario" className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase">WhatsApp</Label>
                  <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="11999999999" className="h-12 rounded-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl shadow-xl">
            <CardContent className="p-8 space-y-6">
              <Label className="text-[10px] font-black uppercase block mb-4">Estilo Visual</Label>
              <div className="grid grid-cols-3 gap-3">
                {['dark', 'light', 'colored'].map((s) => (
                  <button key={s} type="button" onClick={() => setThemeStyle(s)} className={`p-4 rounded-xl border-2 font-black uppercase text-[10px] transition-all ${themeStyle === s ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-border'}`}>
                    {s === 'dark' ? 'Escuro' : s === 'light' ? 'Claro' : 'Cor Tema'}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="rounded-3xl shadow-xl">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase">Logotipo</Label>
                <div className="relative aspect-square rounded-2xl bg-slate-100 border-2 border-dashed flex items-center justify-center overflow-hidden">
                  {currentLogo ? (
                    <>
                      <img src={currentLogo} className="w-full h-full object-contain p-2" />
                      <button type="button" onClick={() => handleRemoveImage('logo')} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"><X className="w-4 h-4" /></button>
                    </>
                  ) : <ImageIcon className="opacity-20 w-10 h-10" />}
                </div>
                <Input type="file" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} className="h-10 rounded-lg text-xs" />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <Label className="text-[10px] font-black uppercase">Banner</Label>
                <div className="relative aspect-video rounded-2xl bg-slate-100 border-2 border-dashed flex items-center justify-center overflow-hidden">
                  {currentBanner ? (
                    <>
                      <img src={currentBanner} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => handleRemoveImage('banner')} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"><X className="w-4 h-4" /></button>
                    </>
                  ) : <Layout className="opacity-20 w-10 h-10" />}
                </div>
                <Input type="file" onChange={(e) => setBannerFile(e.target.files?.[0] || null)} className="h-10 rounded-lg text-xs" />
              </div>
            </CardContent>
          </Card>
          <Button type="submit" disabled={loading} className="w-full h-16 text-lg font-black bg-blue-600 hover:bg-blue-500 text-white rounded-3xl shadow-xl transition-all">
            {loading ? 'SALVANDO...' : 'PUBLICAR LOJA'}
          </Button>
        </div>
      </form>
    </div>
  );
}
