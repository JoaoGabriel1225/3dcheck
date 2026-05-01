import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { ProductImporter } from '../components/ProductImporter'; 
import { Card, CardContent } from '../../components/ui/card'; 
import { ShoppingBag, Zap, ArrowRight, ExternalLink } from 'lucide-react';

export default function Marketplace() {
  const { profile } = useAuth(); 
  const [importedProduct, setImportedProduct] = useState<any>(null);

  // Verificamos se o usuário logado é o administrador
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-[0.2em]">
          <ShoppingBag className="w-4 h-4" />
          Marketplace
        </div>
        <h2 className="text-4xl font-black tracking-tight text-foreground">
          Produtos <span className="text-blue-500">Recomendados</span>
        </h2>
        <p className="text-muted-foreground font-medium max-w-2xl">
          Confira nossa curadoria de hardwares, filamentos e acessórios selecionados para sua produção 3D.
        </p>
      </div>

      {/* 🛡️ TRAVA DE VISIBILIDADE: Apenas o Admin vê a barra de importação */}
      {isAdmin && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
              Ferramenta de Administrador
            </span>
          </div>
          <ProductImporter onImport={(data: any) => setImportedProduct(data)} />
        </div>
      )}

      {/* ÁREA DE EXIBIÇÃO: Todos os usuários conseguem ver os cards abaixo */}
      <div className="grid gap-6">
        {importedProduct ? (
          <Card className="rounded-[2.5rem] border-border bg-card shadow-xl overflow-hidden animate-in fade-in zoom-in duration-500">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                {importedProduct.image && (
                  <img 
                    src={importedProduct.image} 
                    className="w-40 h-40 rounded-3xl object-cover shadow-2xl" 
                    alt="Preview" 
                  />
                )}
                <div className="flex-1 space-y-4 text-center md:text-left">
                  <h3 className="text-2xl font-black text-foreground">{importedProduct.title}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2">{importedProduct.description}</p>
                  
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <span className="text-3xl font-black text-blue-500">
                      {importedProduct.price ? `R$ ${importedProduct.price}` : 'Ver Preço'}
                    </span>
                    
                    {/* Botão que o cliente clica para ir ao site oficial */}
                    <a 
                      href={importedProduct.url || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full md:w-auto bg-foreground text-background px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-lg"
                    >
                      VER NA LOJA <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Mensagem opcional quando não houver produtos publicados ainda */
          <div className="py-20 border-2 border-dashed border-border rounded-[3rem] flex flex-col items-center justify-center text-muted-foreground">
             <ShoppingBag className="w-12 h-12 mb-4 opacity-20" />
             <p className="font-medium">Nenhum produto em destaque no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
