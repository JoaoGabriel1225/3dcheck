import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  ExternalLink, 
  Copy, 
  Store, 
  Palette, 
  ImageIcon, 
  Globe, 
  X, 
  Layout, 
  Settings2, 
  Share2, 
  Check,
  Link as LinkIcon 
} from 'lucide-react';

export default function StorefrontSettings() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [copied, setCopied] = useState(false);
  
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

  const storeSlug = storeName 
    ? storeName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') 
    : 'minha-loja';
  
  const friendlyUrl = `${window.location.origin}/catalogo/${storeSlug}`;

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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(friendlyUrl);
    setCopied(true);
    toast.success('Link copiado com sucesso!');
    setTimeout(() => setCopied(false), 2000);
  };

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
      toast.success('Vitrine publicada!');
      setCurrentLogo(logoUrl);
      setCurrentBanner(bannerUrl);
    } catch (err) { toast.error('Erro ao salvar.'); } finally { setLoading(false); }
  };

  if (fetching) return <div className="py-20 text-center font-black animate-pulse text-muted-foreground tracking-widest">SINCRONIZANDO...</div>;

  return (
    <div className="space-y-10 max-w-5xl pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <p className="text-blue-500 font-bold text-xs uppercase tracking-widest">Painel de Identidade</p>
          <h2 className="text-4xl font-black tracking-tight text-foreground">Design da Vitrine</h2>
        </div>
      </div>

      {/* CARD DE LINK COMPARTILHÁVEL */}
      <Card className="rounded-[2rem] border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10 shadow-xl overflow-hidden border-2">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
              <Share2 className="text-white w-8 h-8" />
            </div>
            
            <div className="flex-1 space-y-2 text-center md:text-left">
              <h3 className="text-xl font-black text-foreground">Divulgação da Loja</h3>
              <p className="text-sm text-muted-foreground font-medium">
                Seu catálogo está online! Use os botões abaixo para acessar ou divulgar na <span className="text-blue-600 font-bold">Bio do Instagram</span>.
              </p>
              
              <div className="flex flex-col lg:flex-row items-center gap-4 mt-4">
                {/* Ajuste de legibilidade do Link no modo escuro */}
                <div className="flex-1 w-full bg-background dark:bg-zinc-900/50 border-2 border-slate-200 dark:border-white/10 h-12 rounded-xl flex items-center px-4 font-mono text-sm text-blue-600 overflow-hidden group hover:border-blue-500/50 transition-colors">
                  <LinkIcon className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                  <span className="truncate">
                    3dcheck.app/
                    <span className="font-bold text-slate-900 dark:text-white">{storeSlug}</span>
                    /produtos
                  </span>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                  <Button 
                    type="button"
                    onClick={handleCopyLink}
                    className={`h-12 px-6 rounded-xl font-bold transition-all w-full sm:w-auto ${copied ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-slate-800 text-white shadow-lg'}`}
                  >
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? 'COPIADO' : 'COPIAR LINK'}
                  </Button>
                  
                  <Button 
                    type="button"
                    variant="outline"
                    className="h-12 px-6 rounded-xl border-blue-600 text-blue-600 font-black hover:bg-blue-600 hover:text-white transition-all shadow-md w-full sm:w-auto group"
                    asChild
                  >
                    <a href={friendlyUrl} target="_blank" rel="noreferrer">
                      VER MINHA VITRINE
                      <ExternalLink className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSave} className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card className="rounded-[2rem] border-slate-200 dark:border-white/10 shadow-xl overflow-hidden dark:bg-zinc-900/20">
             {/* Correção do cabeçalho branco para modo escuro */}
             <CardHeader className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-white/10 p-8">
               <CardTitle className="text-xl font-black flex items-center gap-2 text-foreground">
                 <Globe className="w-5 h-5 text-blue-500" /> Informações Gerais
               </CardTitle>
             </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Nome Comercial</Label>
                <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} required className="h-12 rounded-xl border-slate-200 dark:border-white/10 dark:bg-zinc-950 dark:text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Descrição da Bio</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl min-h-[100px] border-slate-200 dark:border-white/10 dark:bg-zinc-950 dark:text-white leading-relaxed" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-pink-600">User Instagram (sem @)</Label>
                  <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="minhaloj3d" className="h-12 rounded-xl border-slate-200 dark:border-white/10 dark:bg-zinc-950 dark:text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-emerald-600">WhatsApp (DDD + Número)</Label>
                  <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="11999998888" className="h-12 rounded-xl border-slate-200 dark:border-white/10 dark:bg-zinc-950 dark:text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-slate-200 dark:border-white/10 shadow-xl overflow-hidden dark:bg-zinc-900/20">
            {/* Correção do cabeçalho branco para modo escuro */}
            <CardHeader className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-white/10 p-8">
               <CardTitle className="text-xl font-black flex items-center gap-2 text-foreground">
                 <Settings2 className="w-5 h-5 text-blue-500" /> Modo de Visualização
               </CardTitle>
             </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-3 gap-3">
                {['dark', 'light', 'colored'].map((s) => (
                  <button key={s} type="button" onClick={() => setThemeStyle(s)} className={`p-4 rounded-2xl border-2 font-black uppercase text-[10px] transition-all ${themeStyle === s ? 'border-blue-600 bg-blue-50 dark:bg-blue-600/20 text-blue-600 ring-4 ring-blue-50 dark:ring-blue-600/10' : 'border-slate-200 dark:border-white/5 text-slate-400'}`}>
                    {s === 'dark' ? 'Dark Mode' : s === 'light' ? 'Light Mode' : 'Cor Custom'}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="rounded-[2rem] border-slate-200 dark:border-white/10 shadow-xl dark:bg-zinc-900/20">
            <CardContent className="p-8 space-y-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Cor Principal da Marca</Label>
                <div className="flex gap-2">
                  <Input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-16 h-14 p-1 rounded-xl cursor-pointer border-slate-200 dark:border-white/10 dark:bg-zinc-950" />
                  <Input value={primaryColor} readOnly className="h-14 rounded-xl font-mono font-bold border-slate-200 dark:border-white/10 dark:bg-zinc-950 text-foreground uppercase" />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                <Label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Logotipo</Label>
                <div className="relative aspect-square rounded-2xl bg-slate-50 dark:bg-zinc-950 border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden">
                  {currentLogo ? (
                    <div className="relative w-full h-full p-4 group">
                      <img src={currentLogo} className="w-full h-full object-contain" />
                      <button type="button" onClick={() => handleRemoveImage('logo')} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform"><X className="w-4 h-4" /></button>
                    </div>
                  ) : <ImageIcon className="opacity-10 w-12 h-12 text-foreground" />}
                </div>
                <Input type="file" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} className="h-10 rounded-lg text-[10px] font-bold dark:border-white/10 dark:bg-zinc-950" />
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                <Label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Banner de Fundo</Label>
                <div className="relative aspect-video rounded-2xl bg-slate-50 dark:bg-zinc-950 border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden">
                  {currentBanner ? (
                    <div className="relative w-full h-full group">
                      <img src={currentBanner} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => handleRemoveImage('banner')} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform"><X className="w-4 h-4" /></button>
                    </div>
                  ) : <Layout className="opacity-10 w-12 h-12 text-foreground" />}
                </div>
                <Input type="file" onChange={(e) => setBannerFile(e.target.files?.[0] || null)} className="h-10 rounded-lg text-[10px] font-bold dark:border-white/10 dark:bg-zinc-950" />
              </div>
            </CardContent>
          </Card>
          <Button type="submit" disabled={loading} className="w-full h-16 text-lg font-black bg-blue-600 hover:bg-blue-500 text-white rounded-[1.5rem] shadow-xl shadow-blue-600/20 transition-all hover:-translate-y-1">
            {loading ? 'PUBLICANDO...' : 'ATUALIZAR VITRINE'}
          </Button>
        </div>
      </form>
    </div>
  );
}
