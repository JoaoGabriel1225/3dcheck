import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { ProductImporter } from '../components/ProductImporter'; 
import { Card, CardContent } from '../../components/ui/card'; 
import { Input } from '../../components/ui/input';
import { ShoppingBag, Zap, ArrowRight, ExternalLink, Trash2, Save } from 'lucide-react';

export default function Marketplace() {
  const { profile } = useAuth(); 
  const [product, setProduct] = useState<any>(null);
  const isAdmin = profile?.role === 'admin';

  // Função para limpar a seleção atual
  const clearProduct = () => setProduct(null);

  // Função para atualizar os campos manualmente
  const handleUpdate = (field: string, value: string) => {
    setProduct((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-black tracking-tight text-foreground">
          Marketplace <span className="text-blue-500">Hub</span>
        </h2>
        <p className="text-muted-foreground font-medium">
          Curadoria de hardware e insumos para sua produção.
        </p>
      </div>

      {/* FERRAMENTA DE ADMIN: Apenas você vê a barra de importação */}
      {isAdmin && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <ProductImporter onImport={(data: any) => setProduct(data)} />
        </div>
      )}

      <div className="grid gap-6">
        {product ? (
          <Card className="rounded-[2.5rem] border-border bg-card shadow-xl overflow-hidden animate-in fade-in zoom-in duration-500">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <img src={product.image} className="w-40 h-40 rounded-3xl object-cover shadow-2xl" alt="Preview" />
                
                <div className="flex-1 space-y-4 w-full">
                  {/* EDIÇÃO: Se for Admin, mostra Inputs. Se não, mostra texto comum. */}
                  {isAdmin ? (
                    <div className="space-y-3">
                      <Input 
                        value={product.title} 
                        onChange={(e) => handleUpdate('title', e.target.value)}
                        className="text-xl font-black bg-accent/50 border-none h-auto py-2"
                      />
                      <textarea 
                        value={product.description} 
                        onChange={(e) => handleUpdate('description', e.target.value)}
                        className="w-full bg-accent/50 border-none rounded-xl p-3 text-sm text-muted-foreground min-h-[80px]"
                      />
                    </div>
                  ) : (
                    <>
                      <h3 className="text-2xl font-black text-foreground">{product.title}</h3>
                      <p className="text-muted-foreground text-sm line-clamp-2">{product.description}</p>
                    </>
                  )}
                  
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    {isAdmin ? (
                      <div className="flex items-center gap-2 bg-blue-500/10 px-4 py-2 rounded-2xl">
                        <span className="font-bold text-blue-500">R$</span>
                        <input 
                          type="text"
                          value={product.price}
                          onChange={(e) => handleUpdate('price', e.target.value)}
                          className="bg-transparent font-black text-blue-500 text-2xl outline-none w-28"
                        />
                      </div>
                    ) : (
                      <span className="text-3xl font-black text-blue-500">R$ {product.price}</span>
                    )}

                    <div className="flex gap-2 w-full md:w-auto ml-auto">
                      {/* BOTÕES EXCLUSIVOS DO ADMIN */}
                      {isAdmin && (
                        <>
                          <button 
                            onClick={clearProduct}
                            className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                          <button className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-500 transition-all active:scale-95">
                            <Save className="w-5 h-5" /> POSTAR NA VITRINE
                          </button>
                        </>
                      )}

                      {/* BOTÃO DO CLIENTE */}
                      {!isAdmin && (
                        <a 
                          href={product.url} 
                          target="_blank" 
                          className="w-full md:w-auto bg-foreground text-background px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2"
                        >
                          COMPRAR AGORA <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="py-20 border-2 border-dashed border-border rounded-[3rem] flex flex-col items-center justify-center text-muted-foreground opacity-30">
             <ShoppingBag className="w-12 h-12 mb-4" />
             <p className="font-medium italic">Seu catálogo de recomendações aparecerá aqui.</p>
          </div>
        )}
      </div>
    </div>
  );
}
