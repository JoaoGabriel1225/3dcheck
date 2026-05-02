import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom'; // Certifique-se de usar react-router-dom ou react-router conforme seu projeto
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase'; // Importação necessária para as notificações
import { 
  LayoutDashboard, 
  PackageSearch,
  ShoppingCart, 
  CreditCard, 
  LogOut,
  ShieldCheck, 
  Store,
  X,
  Users,
  Circle,
  Download,
  Smartphone,
  Settings2,
  ShoppingBag,
  MessageSquare // Ícone para o suporte
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { profile, signOut, user } = useAuth(); // Adicionado 'user' para identificar o operador
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppMode, setIsAppMode] = useState(false);
  const [hasUnreadSupport, setHasUnreadSupport] = useState(false); // Estado da notificação

  // Função para checar se o Admin te respondeu no suporte
  const checkSupportNotifications = async () => {
    try {
      if (!user?.id) return; // Segurança para evitar erro de 'undefined'

      const { data } = await supabase
        .from('support_tickets')
        .select('id')
        .eq('user_id', user.id)
        .eq('has_unread_reply', true)
        .limit(1);
      
      setHasUnreadSupport(data && data.length > 0);
    } catch (err) {
      console.warn("Aviso Suporte:", err);
    }
  };

  useEffect(() => {
    checkSupportNotifications();

    const checkAppMode = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');
    
    setIsAppMode(checkAppMode);

    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredPrompt = e;
    };

    window.addEventListener('beforeinstallprompt', handler);
    
    // Checa novas mensagens a cada 2 minutos
    const interval = setInterval(checkSupportNotifications, 120000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearInterval(interval);
    };
  }, [user]);

  // Corrigido: Função handleInstallClick definida corretamente dentro do componente
  const handleInstallClick = async () => {
    const promptToUse = deferredPrompt || (window as any).deferredPrompt;

    if (promptToUse) {
      promptToUse.prompt();
      const { outcome } = await promptToUse.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        (window as any).deferredPrompt = null;
      }
    }
  };

  if (!profile) return null;

  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group ${
      isActive 
        ? 'bg-blue-500/10 text-blue-500 font-bold shadow-sm shadow-blue-500/5' 
        : 'text-muted-foreground hover:bg-accent hover:text-foreground font-medium'
    }`;

  const NavGroupLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="px-4 mb-2 mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
      {children}
    </div>
  );

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300" 
          onClick={onClose}
        />
      )}
      
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border flex flex-col py-8 px-4 gap-2 shrink-0 
        transition-transform duration-300 ease-in-out md:relative md:translate-x-0 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        <div className="flex items-center justify-between px-2 mb-6 md:hidden">
          <span className="font-black text-foreground text-xl tracking-tighter text-blue-500 italic">3DCheck</span>
          <button onClick={onClose} className="p-2 text-muted-foreground rounded-xl hover:bg-accent transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          <ul className="flex flex-col gap-1">
            <NavGroupLabel>Principal</NavGroupLabel>
            <li>
              <NavLink to="/app" end onClick={onClose} className={navLinkClass}>
                <div className="flex items-center gap-3 italic">
                  <LayoutDashboard className="h-5 w-5" />
                  Dashboard
                </div>
              </NavLink>
            </li>

            <NavGroupLabel>Gestão Operacional</NavGroupLabel>
            <li><NavLink to="/app/clients" onClick={onClose} className={navLinkClass}><div className="flex items-center gap-3"><Users className="h-5 w-5" />Clientes</div></NavLink></li>
            <li><NavLink to="/app/orders" onClick={onClose} className={navLinkClass}><div className="flex items-center gap-3"><ShoppingCart className="h-5 w-5" />Pedidos</div></NavLink></li>
            <li><NavLink to="/app/products" onClick={onClose} className={navLinkClass}><div className="flex items-center gap-3"><PackageSearch className="h-5 w-5" />Produtos</div></NavLink></li>
            <li><NavLink to="/app/marketplace" onClick={onClose} className={navLinkClass}><div className="flex items-center gap-3"><ShoppingBag className="h-5 w-5" />Marketplace</div></NavLink></li>

            <NavGroupLabel>Configurações</NavGroupLabel>
            <li><NavLink to="/app/storefront-settings" onClick={onClose} className={navLinkClass}><div className="flex items-center gap-3"><Store className="h-5 w-5" />Loja Virtual</div></NavLink></li>
            <li><NavLink to="/app/settings" onClick={onClose} className={navLinkClass}><div className="flex items-center gap-3"><Settings2 className="h-5 w-5" />Configurações Globais</div></NavLink></li>
            <li><NavLink to="/billing" onClick={onClose} className={navLinkClass}><div className="flex items-center gap-3"><CreditCard className="h-5 w-5" />Financeiro</div></NavLink></li>
            
            {/* NOVO: Link de Suporte com Badge de Notificação */}
            <li>
              <NavLink to="/app/support" onClick={onClose} className={navLinkClass}>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <MessageSquare className="h-5 w-5" />
                    {hasUnreadSupport && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                      </span>
                    )}
                  </div>
                  Suporte & Feedback
                </div>
              </NavLink>
            </li>
            
            {profile.role === 'admin' && (
              <>
                <NavGroupLabel>Segurança</NavGroupLabel>
                <li><NavLink to="/admin" onClick={onClose} className={navLinkClass}><div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5" />Painel Admin</div></NavLink></li>
              </>
            )}
          </ul>
        </nav>

        <div className="mt-auto pt-6 border-t border-border/50 space-y-4">
          {!isAppMode && (
            <div className="px-2 animate-in slide-in-from-bottom-2 duration-500">
              <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                    <Smartphone className="text-white w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-foreground uppercase tracking-widest leading-none">App 3DCheck</span>
                    <span className="text-[9px] text-muted-foreground mt-1">Acesso rápido via Desktop/Mobile</span>
                  </div>
                </div>
                <Button 
                  onClick={handleInstallClick}
                  className="w-full h-8 text-[10px] font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all active:scale-95 shadow-md shadow-blue-600/10"
                >
                  <Download className="w-3 h-3 mr-2" /> INSTALAR AGORA
                </Button>
              </div>
            </div>
          )}

          <div className="px-4 py-3 rounded-2xl bg-accent/30 border border-border/50">
            <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-2 font-black">Infraestrutura</div>
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <Circle className="w-2 h-2 fill-green-500 text-green-500 animate-pulse" /> Supabase Conectado
            </div>
          </div>

          <button className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-muted-foreground hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all w-full text-left group" onClick={signOut}>
            <LogOut className="h-5 w-5 group-hover:-translate-x-1 transition-transform" /> Sair da Plataforma
          </button>
        </div>
      </aside>
    </>
  );
}
