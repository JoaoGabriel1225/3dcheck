import React from 'react';
import { NavLink } from 'react-router';
import { useAuth } from '@/lib/AuthContext';
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
  Circle
} from 'lucide-react';

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { profile, signOut } = useAuth();
  
  if (!profile) return null;

  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
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
      {/* Mobile overlay com blur */}
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
        
        {/* Header Mobile */}
        <div className="flex items-center justify-between px-2 mb-6 md:hidden">
          <span className="font-black text-foreground text-xl tracking-tighter">Navegação</span>
          <button onClick={onClose} className="p-2 text-muted-foreground rounded-xl hover:bg-accent transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          <ul className="flex flex-col gap-1">
            <NavGroupLabel>Principal</NavGroupLabel>
            <li>
              <NavLink to="/app" end onClick={onClose} className={navLinkClass}>
                <LayoutDashboard className="h-5 w-5 transition-transform group-hover:scale-110" />
                Dashboard
              </NavLink>
            </li>

            <NavGroupLabel>Gestão Operacional</NavGroupLabel>
            <li>
              <NavLink to="/app/clients" onClick={onClose} className={navLinkClass}>
                <Users className="h-5 w-5 transition-transform group-hover:scale-110" />
                Clientes
              </NavLink>
            </li>
            <li>
              <NavLink to="/app/orders" onClick={onClose} className={navLinkClass}>
                <ShoppingCart className="h-5 w-5 transition-transform group-hover:scale-110" />
                Pedidos
              </NavLink>
            </li>
            <li>
              <NavLink to="/app/products" onClick={onClose} className={navLinkClass}>
                <PackageSearch className="h-5 w-5 transition-transform group-hover:scale-110" />
                Produtos
              </NavLink>
            </li>

            <NavGroupLabel>Configurações</NavGroupLabel>
            <li>
              <NavLink to="/app/storefront-settings" onClick={onClose} className={navLinkClass}>
                <Store className="h-5 w-5 transition-transform group-hover:scale-110" />
                Configurações da Loja
              </NavLink>
            </li>
            <li>
              <NavLink to="/billing" onClick={onClose} className={navLinkClass}>
                <CreditCard className="h-5 w-5 transition-transform group-hover:scale-110" />
                Financeiro
              </NavLink>
            </li>
            
            {profile.role === 'admin' && (
              <>
                <NavGroupLabel>Segurança</NavGroupLabel>
                <li>
                  <NavLink to="/admin" onClick={onClose} className={navLinkClass}>
                    <ShieldCheck className="h-5 w-5 transition-transform group-hover:scale-110" />
                    Painel Admin
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* Rodapé da Sidebar */}
        <div className="mt-auto pt-6 border-t border-border/50 space-y-4">
          <div className="px-4 py-3 rounded-2xl bg-accent/30 border border-border/50">
            <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-2 font-black">Sistema</div>
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <Circle className="w-2 h-2 fill-green-500 text-green-500 animate-pulse" />
              Supabase Online
            </div>
          </div>

          <button 
            className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-muted-foreground hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all w-full text-left group" 
            onClick={signOut}
          >
            <LogOut className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            Sair da Plataforma
          </button>
        </div>
      </aside>
    </>
  );
}
