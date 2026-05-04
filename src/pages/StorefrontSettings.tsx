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
  ImageIcon, 
  Globe, 
  X, 
  Layout, 
  Settings2, 
  Share2, 
  Check,
  Link as LinkIcon,
  Loader2,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

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
  const [logoPreview, setLogoPreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');
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

  // Handler para Preview de Logo
  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  // Handler para Preview de Banner
  const onBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(friendlyUrl);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveImage = async (type: 'logo' | 'banner') => {
    if (!profile) return;
    try {
      const updateData = type === 'logo' ? { logo_url: null } : { banner_url: null };
      const { error } = await supabase.from('store_settings').update(updateData).eq('user_id', profile.id);
      if (error) throw error;
      if (type === 'logo') {
        setCurrentLogo(''); 
        setLogoPreview('');
      } else {
        setCurrentBanner('');
        setBannerPreview('');
      }
      toast.success('Imagem removida.');
    } catch (err) { toast.error("Erro ao remover."); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);

    try {
      let logoUrl = currentLogo;
      let bannerUrl = currentBanner;

      // Upload otimizado com UPSERT (sobrescreve o antigo para não lotar o storage)
      if (logoFile) {
        const filePath = `${profile.id}/logo-fixed`; 
        const { error } = await supabase.storage.from('store-assets').upload(filePath, logoFile, { upsert: true });
        if (!error) logoUrl = `${supabase.storage.from('store-assets').getPublicUrl(filePath).data.publicUrl}?t=${Date.now()}`;
      }

      if (bannerFile) {
        const filePath = `${profile.id}/banner-fixed`;
        const { error } = await supabase.storage.from('store-assets').upload(filePath, bannerFile, { upsert: true });
        if (!error) bannerUrl = `${supabase.storage.from('store-assets').getPublicUrl(filePath).data.publicUrl}?t=${Date.now()}`;
      }

      const { error } = await supabase.from('store_settings').upsert({
        user_id: profile.id,
        store_name: storeName,
        description,
        primary_color: primaryColor,
        theme_style: themeStyle,
        instagram_handle: instagram.replace('@', ''), // Limpeza automática
        whatsapp_number: whatsapp.replace(/\D/g, ''), // Limpeza automática
        logo_url: logoUrl,
        banner_url: bannerUrl,
        updated_at: new Date().toISOString()
      });

      if (error) throw error;
      toast.success('Vitrine atualizada com sucesso!');
      setCurrentLogo(logoUrl);
      setCurrentBanner(bannerUrl);
      setLogoFile(null);
      setBannerFile(null);
    } catch (err) { toast.error('Erro ao salvar as configurações.'); } finally { setLoading(false); }
  };

  if (fetching) return (
    <div className="py-20 flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      <p className="font-black text-muted-foreground tracking-widest text-[10px] uppercase">Sincronizando Identidade...</p>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-10 max-w-5xl pb-20"
    >
      {/* Header */}
      <div className="flex flex-col gap-1">
        <p className="text-blue-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
          <Sparkles className="w-3 h-3" /> Painel de Identidade
        </p>
        <h2 className="text-4xl font-black tracking-tight text-foreground">Design da Vitrine</h2>
      </div>

      {/* CARD DE LINK COMPARTILHÁVEL */}
      <Card className="rounded-[2rem] border-blue-500/20 bg-blue-500/5 dark:bg-blue-600/5 shadow-xl overflow-hidden border-2">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
              <Share2 className="text-white w-8 h-8" />
            </div>
            
            <div className="flex-1 space-y-2 text-center md:text-left">
              <h3 className="text-xl font-black text-foreground">Divulgação da Loja</h3>
              <p className="text-sm text-muted-foreground font-medium italic">
                Seu catálogo está pronto para o mundo. Copie o link abaixo para sua <span className="text-blue-600 font-bold">Bio do Instagram</span>.
              </p>
              
              <div className="flex flex-col lg:flex-row items-center gap-4 mt-4">
                <div className="flex-1 w-full bg-background dark:bg-zinc-950 border-2 border-slate-200 dark:border-white/5 h-12 rounded-xl flex items-center px-4 font-mono text-sm text-blue-600 overflow-hidden group hover:border-blue-500/50 transition-colors">
                  <LinkIcon className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                  <span className="truncate">
                    3dcheck.app/<span className="font-bold text-slate-900 dark:text-white italic">{storeSlug}</span>
                  </span>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                  <Button 
                    type="button"
                    onClick={handleCopyLink}
                    className={`h-12 px-6 rounded-xl font-black transition-all w-full sm:w-auto ${copied ? 'bg-emerald-500 hover:bg-emerald-600 text-white scale-105' : 'bg-slate-900 dark:bg-white dark:text-zinc-900 hover:bg-slate-800 text-white shadow-lg'}`}
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
                      VER VITRINE
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
          <Card className="rounded-[2.5rem] border-slate-200 dark:border-white/5 shadow-xl overflow-hidden dark:bg-zinc-900/20">
             <CardHeader className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 p-8">
               <CardTitle className="text-xl font-black flex items-center gap-2 text-foreground">
                 <Globe className="w-5 h-5 text-blue-500" /> Informações Gerais
               </CardTitle>
             </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Nome Comercial</Label>
                <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} required className="h-12 rounded-xl bg-background border-slate-200 dark:border-white/5" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Descrição da Vitrine</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Fale um pouco sobre o que você produz..." className="rounded-xl min-h-[100px] border-slate-200 dark:border-white/5 bg-background leading-relaxed" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-pink-500">Instagram</Label>
                  <Input value={instagram} onChange={(e) => setInstagram(e.target.value.replace('@', ''))} placeholder="nomedaloja" className="h-12 rounded-xl bg-background border-slate-200 dark:border-white/5" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-emerald-500">WhatsApp</Label>
                  <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))} placeholder="11999998888" className="h-12 rounded-xl bg-background border-slate-200 dark:border-white/5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-slate-200 dark:border-white/5 shadow-xl overflow-hidden dark:bg-zinc-900/20">
            <CardHeader className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 p-8">
               <CardTitle className="text-xl font-black flex items-center gap-2 text-foreground">
                 <Settings2 className="w-5 h-5 text-blue-500" /> Estilo de Visualização
               </CardTitle>
             </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-3 gap-3">
                {['dark', 'light', 'colored'].map((s) => (
                  <button key={s} type="button" onClick={() => setThemeStyle(s)} className={`p-4 rounded-2xl border-2 font-black uppercase text-[10px] transition-all ${themeStyle === s ? 'border-blue-600 bg-blue-50 dark:bg-blue-600/20 text-blue-600 ring-4 ring-blue-50 dark:ring-blue-600/10' : 'border-slate-200 dark:border-white/5 text-slate-400'}`}>
                    {s === 'dark' ? 'Dark' : s === 'light' ? 'Light' : 'Brand Color'}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="rounded-[2.5rem] border-slate-200 dark:border-white/5 shadow-xl dark:bg-zinc-900/20 overflow-hidden">
            <CardContent className="p-8 space-y-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-slate-400">Cor da Marca</Label>
                <div className="flex gap-2">
                  <Input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-16 h-14 p-1 rounded-xl cursor-pointer bg-background" />
                  <Input value={primaryColor} readOnly className="h-14 rounded-xl font-mono font-bold bg-background text-foreground uppercase text-center" />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                <Label className="text-[10px] font-black uppercase text-slate-400">Logotipo</Label>
                <div className="relative aspect-square rounded-[2rem] bg-slate-50 dark:bg-zinc-950 border-2 border-dashed border-slate-200 dark:border-white/5 flex items-center justify-center overflow-hidden transition-all group">
                  {(logoPreview || currentLogo) ? (
                    <div className="relative w-full h-full p-4 group">
                      <img src={logoPreview || currentLogo} className="w-full h-full object-contain transition-transform group-hover:scale-105" />
                      <button type="button" onClick={() => handleRemoveImage('logo')} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform opacity-0 group-hover:opacity-100"><X className="w-4 h-4" /></button>
                    </div>
                  ) : <ImageIcon className="opacity-10 w-12 h-12 text-foreground" />}
                </div>
                <Input type="file" onChange={onLogoChange} className="h-10 rounded-lg text-[10px] font-bold dark:border-white/5 bg-background cursor-pointer" />
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                <Label className="text-[10px] font-black uppercase text-slate-400">Banner Principal</Label>
                <div className="relative aspect-video rounded-2xl bg-slate-50 dark:bg-zinc-950 border-2 border-dashed border-slate-200 dark:border-white/5 flex items-center justify-center overflow-hidden group">
                  {(bannerPreview || currentBanner) ? (
                    <div className="relative w-full h-full group">
                      <img src={bannerPreview || currentBanner} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <button type="button" onClick={() => handleRemoveImage('banner')} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform opacity-0 group-hover:opacity-100"><X className="w-4 h-4" /></button>
                    </div>
                  ) : <Layout className="opacity-10 w-12 h-12 text-foreground" />}
                </div>
                <Input type="file" onChange={onBannerChange} className="h-10 rounded-lg text-[10px] font-bold dark:border-white/5 bg-background cursor-pointer" />
              </div>
            </CardContent>
          </Card>
          
          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full h-16 text-lg font-black bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] shadow-xl shadow-blue-600/20 transition-all hover:-translate-y-1 active:scale-95"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'PUBLICAR VITRINE'}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
