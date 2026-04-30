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
  Users
} from 'lucide-react';

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { profile, signOut } = useAuth();
  
  if (!profile) return null;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={onClose}
        />
      )}
      
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col py-6 gap-1 shrink-0 transition-transform duration-300 md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 mb-4 md:hidden">
          <span className="font-extrabold text-foreground text-lg">Menu</span>
          <button onClick={onClose} className="p-2 -mr-2 text-muted-foreground rounded-md hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto">
          <ul className="flex flex-col">
            <li>
              <NavLink 
                to="/app" end
                onClick={onClose}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-6 py-3 transition-colors ${isActive ? 'bg-primary/10 text-primary font-bold border-r-4 border-primary' : 'text-muted-foreground font-medium hover:bg-muted hover:text-foreground border-r-4 border-transparent'}`
                }
              >
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/app/clients"
                onClick={onClose}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-6 py-3 transition-colors ${isActive ? 'bg-primary/10 text-primary font-bold border-r-4 border-primary' : 'text-muted-foreground font-medium hover:bg-muted hover:text-foreground border-r-4 border-transparent'}`
                }
              >
                <Users className="h-5 w-5" />
                Clientes
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/app/orders"
                onClick={onClose}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-6 py-3 transition-colors ${isActive ? 'bg-primary/10 text-primary font-bold border-r-4 border-primary' : 'text-muted-foreground font-medium hover:bg-muted hover:text-foreground border-r-4 border-transparent'}`
                }
              >
                <ShoppingCart className="h-5 w-5" />
                Pedidos
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/app/products"
                onClick={onClose}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-6 py-3 transition-colors ${isActive ? 'bg-primary/10 text-primary font-bold border-r-4 border-primary' : 'text-muted-foreground font-medium hover:bg-muted hover:text-foreground border-r-4 border-transparent'}`
                }
              >
                <PackageSearch className="h-5 w-5" />
                Produtos
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/app/storefront-settings"
                onClick={onClose}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-6 py-3 transition-colors ${isActive ? 'bg-primary/10 text-primary font-bold border-r-4 border-primary' : 'text-muted-foreground font-medium hover:bg-muted hover:text-foreground border-r-4 border-transparent'}`
                }
              >
                <Store className="h-5 w-5" />
                Configurações da Loja
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/billing"
                onClick={onClose}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-6 py-3 transition-colors ${isActive ? 'bg-primary/10 text-primary font-bold border-r-4 border-primary' : 'text-muted-foreground font-medium hover:bg-muted hover:text-foreground border-r-4 border-transparent'}`
                }
              >
                <CreditCard className="h-5 w-5" />
                Financeiro
              </NavLink>
            </li>
            
            {profile.role === 'admin' && (
              <li>
                <NavLink 
                  to="/admin"
                  onClick={onClose}
                  className={({ isActive }) => 
                    `flex items-center gap-3 px-6 py-3 transition-colors ${isActive ? 'bg-primary/10 text-primary font-bold border-r-4 border-primary' : 'text-muted-foreground font-medium hover:bg-muted hover:text-foreground border-r-4 border-transparent'}`
                  }
                >
                  <ShieldCheck className="h-5 w-5" />
                  Painel Admin
                </NavLink>
              </li>
            )}
          </ul>
        </nav>

        <div className="mt-auto px-6 pt-6 border-t border-border flex flex-col gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 font-bold">Status do Sistema</div>
            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Conectado ao Supabase
            </div>
          </div>
          <button 
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors w-full text-left" 
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Sair da Conta
          </button>
        </div>
      </aside>
    </>
  );
}
