import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase'; // Certifique-se de que o caminho está correto
import { ProductImporter } from '../components/ProductImporter'; 
import { Card, CardContent } from '../../components/ui/card'; 
import { Input } from '../../components/ui/input';
import { ShoppingBag, Zap, ExternalLink, Trash2, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Marketplace() {
  const { profile, user } = useAuth(); 
  const [importingProduct, setImportingProduct] = useState<any>(null);
  const [savedProducts, setSavedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = profile?.role === 'admin';

  // 1. CARREGAR PRODUTOS DO BANCO
  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('marketplace_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedProducts(data || []);
    } catch (err) {
      toast.error('Erro ao carregar vitrine');
    } finally {
      setLoading(false);
    }
  }

  // 2. SALVAR NO BANCO DE DADOS
  async function handlePost() {
    if (!importingProduct) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('marketplace_products')
        .insert([{
          title: importingProduct.title,
          description: importingProduct.description,
          price: importingProduct.price,
          image: importingProduct.image,
          url: importingProduct.url,
          user_id: user?.id
        }]);

      if (error) throw error;

      toast.success('Produto postado com sucesso!');
      setImportedProduct(null); // Limpa a área de importação
      fetchProducts(); // Atualiza a lista automaticamente
    } catch (err) {
      toast.error('Erro ao salvar no banco de dados');
    } finally {
      setIsSaving(false);
    }
  }

  // 3. DELETAR DO BANCO (Apenas Admin)
  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from('marketplace_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSavedProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Removido da vitrine');
    } catch (err) {
      toast.error('Erro ao deletar');
    }
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-black tracking-tight text-foreground">
          Marketplace <span className="text-blue-500">Hub</span>
        </h2>
        <p className="text-muted-foreground font-medium">Hardware e filamentos selecionados para você.</p>
      </div>

      {isAdmin && (
        <div className="animate-in fade-in duration-500">
          <ProductImporter onImport={(data: any) => setImportingProduct(data)} />
          
          {/* PRÉ-VISUALIZAÇÃO ANTES DE POSTAR */}
          {importingProduct && (
            <div className="mt-6 p-6 border-2 border-dashed border-blue-500/30 rounded-[2.5rem] bg-blue-500/5">
               <div className="flex flex-col md:flex-row gap-6 items-center">
                  <img src={importingProduct.image} className="w-32 h-32 rounded-2xl object-cover" />
                  <div className="flex-1 space-y-3 w-full">
                    <Input 
                      value={importingProduct.title} 
                      onChange={(e) => setImportingProduct({...importingProduct, title: e.target.value})}
                      className="font-bold"
                    />
                    <div className="flex gap-4">
                      <button 
                        onClick={handlePost}
                        disabled={isSaving}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black flex items-center justify-center gap-2"
                      >
                        {isSaving ? <Loader2 className="animate-spin" /> : <><Save className="w-4 h-4" /> CONFIRMAR E POSTAR</>}
                      </button>
                      <button onClick={() => setImportingProduct(null)} className="px-4 py-3 bg-red-500/10 text-red-500 rounded-xl">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      )}

      {/* VITRINE REAL (O QUE FICA SALVO) */}
      <div className="grid gap-8">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>
        ) : savedProducts.map((item) => (
          <Card key={item.id} className="rounded-[2.5rem] border-border bg-card shadow-xl overflow-hidden">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <img src={item.image} className="w-40 h-40 rounded-3xl object-cover" alt="Produto" />
                <div className="flex-1 space-y-4">
                  <h3 className="text-2xl font-black text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-3xl font-black text-blue-500">R$ {item.price}</span>
                    <div className="flex gap-2">
                      {isAdmin && (
                        <button onClick={() => handleDelete(item.id)} className="p-4 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                      <a href={item.url} target="_blank" className="bg-foreground text-background px-8 py-4 rounded-2xl font-black flex items-center gap-2">
                        COMPRAR <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
