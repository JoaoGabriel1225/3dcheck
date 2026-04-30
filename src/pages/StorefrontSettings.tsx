import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ExternalLink, Copy } from 'lucide-react';

export default function StorefrontSettings() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  // Settings state
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
    toast.success('Link copiado para a área de transferência!');
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

        if (error && error.code !== 'PGRST116') throw error; // ignore no rows error
        
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

      // Upload logo
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const filePath = `${profile.id}/logo-${Math.random()}.${fileExt}`;
        const { error } = await supabase.storage.from('store-assets').upload(filePath, logoFile);
        if (!error) {
          logoUrl = supabase.storage.from('store-assets').getPublicUrl(filePath).data.publicUrl;
        }
      }

      // Upload banner
      if (bannerFile) {
        const fileExt = bannerFile.name.split('.').pop();
        const filePath = `${profile.id}/banner-${Math.random()}.${fileExt}`;
        const { error } = await supabase.storage.from('store-assets').upload(filePath, bannerFile);
        if (!error) {
          bannerUrl = supabase.storage.from('store-assets').getPublicUrl(filePath).data.publicUrl;
        }
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
      toast.success('Configurações da loja atualizadas!');
    } catch (err: any) {
      toast.error('Erro ao salvar', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <p className="font-medium text-slate-500">Carregando...</p>;

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Loja Virtual</h2>
          <p className="text-slate-500 font-medium mt-1">Personalize a aparência da sua loja pública.</p>
        </div>
        <Button variant="outline" className="font-bold border-slate-200" asChild>
          <a href={`/storefront/${profile?.id}`} target="_blank" rel="noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Ver Loja
          </a>
        </Button>
      </div>

      <Card className="rounded-xl border-slate-200 shadow-none overflow-hidden pb-4">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <Label className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2 block">Link da sua loja (Compartilhe com clientes)</Label>
          <div className="flex items-center gap-2">
            <Input readOnly value={storeUrl} className="bg-white border-slate-200 font-medium text-slate-600 focus-visible:ring-0" />
            <Button onClick={copyToClipboard} variant="secondary" className="font-bold shrink-0">
              <Copy className="h-4 w-4 mr-2" />
              Copiar Link
            </Button>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <CardHeader className="p-6">
            <CardTitle className="font-extrabold text-slate-900">Configurações Visuais</CardTitle>
            <CardDescription className="font-medium text-slate-500">Defina sua identidade visual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-6">
            <div className="space-y-2">
              <Label htmlFor="storeName" className="font-bold text-slate-700 text-xs uppercase tracking-wider">Nome da Loja</Label>
              <Input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} required className="border-slate-200 h-11" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="font-bold text-slate-700 text-xs uppercase tracking-wider">Descrição / Mensagem de Boas-vindas</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="border-slate-200 min-h-[100px]" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color" className="font-bold text-slate-700 text-xs uppercase tracking-wider">Cor Principal</Label>
              <div className="flex gap-4 items-center">
                <Input 
                  id="color" 
                  type="color" 
                  className="w-16 h-11 p-1 cursor-pointer border-slate-200" 
                  value={primaryColor} 
                  onChange={(e) => setPrimaryColor(e.target.value)} 
                />
                <Input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="border-slate-200 h-11 uppercase font-mono" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-3">
                <Label className="font-bold text-slate-700 text-xs uppercase tracking-wider">Logo da Loja</Label>
                {currentLogo && (
                  <div className="w-24 h-24 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden mb-3">
                    <img src={currentLogo} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                )}
                <Input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} className="border-slate-200 cursor-pointer h-11 pt-2.5" />
              </div>
              <div className="space-y-3">
                <Label className="font-bold text-slate-700 text-xs uppercase tracking-wider">Banner (Fundo)</Label>
                {currentBanner && (
                  <div className="w-full h-24 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden mb-3">
                    <img src={currentBanner} alt="Banner" className="w-full h-full object-cover" />
                  </div>
                )}
                <Input type="file" accept="image/*" onChange={(e) => setBannerFile(e.target.files?.[0] || null)} className="border-slate-200 cursor-pointer h-11 pt-2.5" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="px-6 pt-6">
            <Button type="submit" disabled={loading} className="font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-md px-6">
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
