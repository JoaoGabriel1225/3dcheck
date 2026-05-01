import React, { useState } from 'react';
// Mudamos o import de '@/components/...' para '../components/...'
import { ProductImporter } from '../components/ProductImporter'; 
import { Card, CardContent } from '../components/ui/card';
import { ShoppingBag, Zap, ArrowRight } from 'lucide-react';

export default function Marketplace() {
  const [importedProduct, setImportedProduct] = useState<any>(null);

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-black tracking-tight text-foreground">
          Marketplace <span className="text-blue-500">Hub</span>
        </h2>
        <p className="text-muted-foreground font-medium">
          Importe produtos de hardware e filamentos via link para sua rede de afiliados.
        </p>
      </div>

      {/* Componente de importação */}
      <ProductImporter onImport={(data) => setImportedProduct(data)} />

      {/* Pré-visualização do produto encontrado */}
      {importedProduct && (
        <Card className="rounded-[2.5rem] border-blue-500/30 bg-blue-500/5 animate-in fade-in zoom-in duration-500">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <img 
                src={importedProduct.image} 
                className="w-40 h-40 rounded-3xl object-cover shadow-2xl" 
                alt="Preview" 
              />
              <div className="flex-1 space-y-4">
                <h3 className="text-2xl font-black text-foreground">{importedProduct.title}</h3>
                <p className="text-muted-foreground text-sm line-clamp-2">{importedProduct.description}</p>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-black text-blue-500">
                    {importedProduct.price ? `R$ ${importedProduct.price}` : 'Preço sob consulta'}
                  </span>
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-500 transition-all active:scale-95">
                    Confirmar e Postar <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
