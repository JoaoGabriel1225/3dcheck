import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link2, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Certifique-se de que o nome da função é exatamente ProductImporter
export function ProductImporter({ onImport }: { onImport: (data: any) => void }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!url.includes('http')) {
      toast.error('Por favor, cole um link válido!');
      return;
    }

    setLoading(true);
    try {
      // Esta chamada busca a API que criaremos no próximo passo
      const res = await fetch(`/api/fetch-product?url=${encodeURIComponent(url)}`);
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      onImport(data);
      toast.success('Dados recuperados com sucesso!');
    } catch (err: any) {
      toast.error('Não consegui ler este site automaticamente. Tente preencher os campos abaixo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 p-6 bg-blue-500/5 border border-blue-500/10 rounded-[2rem] mb-10 items-center">
      <div className="relative flex-1 w-full">
        <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500/50" />
        <Input 
          placeholder="Cole o link do produto (Shopee, Amazon, AliExpress...)" 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="pl-12 h-14 bg-background border-border rounded-2xl text-base focus:ring-2 focus:ring-blue-500/20"
        />
      </div>
      <Button 
        onClick={handleImport} 
        disabled={loading}
        className="h-14 px-8 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-600/20 w-full sm:w-auto active:scale-95"
      >
        {loading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <>
            <Sparkles className="w-5 h-5 mr-2" /> 
            PUXAR DADOS
          </>
        )}
      </Button>
    </div>
  );
}
