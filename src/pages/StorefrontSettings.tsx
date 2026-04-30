import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ExternalLink, Copy, Store, Palette, ImageIcon, Layout, Globe, Check } from 'lucide-react';

export default function StorefrontSettings() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#1E3A8A');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  
  const [currentLogo, setCurrentLogo] = useState('');
  const [currentBanner, setCurrentBanner] = useState('');

  const storeUrl = `${window.location.origin}/storefront/${profile?.id}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(storeUrl);
    toast.success('Link copiado com sucesso!', {
      icon: <Check className="w-4 h-4 text-emerald-500" />
    });
  };

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
          setPrimaryColor(data.primary_color || '#1E3A8A');
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
        const filePath = `${profile.id}/logo-${Math.random()}.${logoFile.name.split('.').pop()}`;
        const { error } = await supabase.storage.from('store-assets').upload(filePath, logoFile);
        if (!error) logoUrl = supabase.storage.from('store-assets').getPublicUrl(filePath).data.publicUrl;
      }

      if (bannerFile) {
        const filePath = `${profile.id}/banner-${Math.random()}.${bannerFile.name.split('.').pop()}`;
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
          logo_url: logoUrl,
          banner_url: bannerUrl,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setCurrentLogo(logoUrl);
      setCurrentBanner(bannerUrl);
      toast.success('Loja atualizada com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao salvar as configurações.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="py-20 text-center font-black text-slate-400 tracking-widest animate-pulse">CARREGANDO PREFERÊNCIAS...</div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-5xl">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-[0.2em]">
            <Globe className="w-4 h-4" />
            Presença Digital
          </div>
          <h2 className="text-4xl font-black tracking-tight text-foreground">Loja Virtual</h2>
          <p className="text-muted-foreground font-medium">Configure como seus clientes verão seu catálogo público.</p>
        </div>
        
        <Button variant="outline" className="h-12 px-6 rounded-xl border-border font-bold hover:bg-accent gap-2 transition-all" asChild>
          <a href={`/storefront/${profile?.id}`} target="_blank" rel="noreferrer">
            <ExternalLink className="w-4 h-4" />
            Visualizar Loja
          </a>
        </Button>
      </div>

      {/* PUBLIC LINK WIDGET */}
      <Card className="border-none bg-blue-500/5 border border-blue-500/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-600">
            <Globe className="w-8 h-8" />
          </div>
          <div className="flex-1 text-center md:text-left space-y-1">
            <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-600/70">Link Público da sua Vitrine</Label>
            <div className="text-sm font-bold text-foreground break-all">{storeUrl}</div>
          </div>
          <Button onClick={copyToClipboard} className="h-11 px-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-lg shadow-blue-500/20 gap-2 shrink-0">
            <Copy className="h-4 w-4" />
            Copiar Link
          </Button>
        </div>
      </Card>

      <form onSubmit={handleSave} className="grid gap-8">
        <Card className="border-border bg-card/40 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden">
          <CardHeader className="p-8 border-b border-border/50 bg-accent/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-background rounded-lg border border-border">
                <Store className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-xl font-black tracking-tight">Identidade da Marca</CardTitle>
                <CardDescription className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Como as pessoas conhecem seu negócio</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-8 space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Nome Comercial da Loja</Label>
                <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} required className="h-12 rounded-xl bg-background/50 border-border" placeholder="Ex: João 3D Prints" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Cor de Destaque (Tema)</Label>
                <div className="flex gap-3">
                  <Input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-14 h-12 p-1 rounded-xl cursor-pointer border-border" />
                  <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-12 rounded-xl bg-background/50 border-border font-mono font-bold uppercase" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Mensagem de Boas-vindas / Bio</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl bg-background/50 border-border min-h-[120px] leading-relaxed" placeholder="Conte um pouco sobre suas impressões e prazos..." />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/40 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden">
          <CardHeader className="p-8 border-b border-border/50 bg-accent/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-background rounded-lg border border-border">
                <Palette className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-xl font-black tracking-tight">Materiais Visuais</CardTitle>
                <CardDescription className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Imagens e artes da vitrine</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-10">
              {/* LOGO UPLOAD */}
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ImageIcon className="w-3 h-3" /> Logotipo Principal
                </Label>
                <div className="relative aspect-square max-w-[200px] rounded-3xl border-2 border-dashed border-border flex items-center justify-center bg-accent/30 overflow-hidden group">
                  {currentLogo ? (
                    <img src={currentLogo} alt="Logo" className="w-full h-full object-contain p-4 transition-transform group-hover:scale-105" />
                  ) : (
                    <Store className="w-10 h-10 text-muted-foreground/20" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <span className="text-[10px] text-white font-black uppercase tracking-widest">Alterar</span>
                  </div>
                </div>
                <Input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} className="h-11 rounded-xl border-border cursor-pointer pt-2.5 text-xs font-bold" />
              </div>

              {/* BANNER UPLOAD */}
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Layout className="w-3 h-3" /> Banner de Fundo
                </Label>
                <div className="relative w-full aspect-video rounded-3xl border-2 border-dashed border-border flex items-center justify-center bg-accent/30 overflow-hidden group">
                  {currentBanner ? (
                    <img src={currentBanner} alt="Banner" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-muted-foreground/20" />
                  )}
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <span className="text-[10px] text-white font-black uppercase tracking-widest">Alterar</span>
                  </div>
                </div>
                <Input type="file" accept="image/*" onChange={(e) => setBannerFile(e.target.files?.[0] || null)} className="h-11 rounded-xl border-border cursor-pointer pt-2.5 text-xs font-bold" />
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-8 bg-accent/10 border-t border-border/50">
            <Button type="submit" disabled={loading} className="w-full h-14 text-lg font-black bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-xl shadow-blue-500/20 transition-all">
              {loading ? 'Sincronizando...' : 'Publicar Alterações'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
