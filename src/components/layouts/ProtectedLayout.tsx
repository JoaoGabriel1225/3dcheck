import React, { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/lib/AuthContext';
import { Loader2, Menu, Sun, Moon, ShieldCheck, Clock } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useTheme } from '../ThemeProvider';

export function ProtectedLayout() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  // Puxa a foto de perfil dos metadados do Supabase Auth
  const avatarUrl = user?.user_metadata?.avatar_url;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c]">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  const now = Date.now();
  const endTime = profile?.trialEndsAt ? new Date(profile.trialEndsAt).getTime() : null;
  const daysLeft = endTime !== null ? Math.ceil((endTime - now) / (1000 * 60 * 60 * 24)) : 0;
  const isExpired = endTime !== null ? endTime < now : true;

  if (profile.role !== 'admin' && isExpired) {
    if (location.pathname !== '/billing') {
      return <Navigate to="/billing" replace />;
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground selection:bg-blue-500/30">
      {/* HEADER PREMIUM */}
      <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md z-40 flex items-center justify-between px-4 sm:px-8 shrink-0 sticky top-0">
        <div className="flex items-center gap-4">
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* LOGO DINÂMICA */}
          <div className="flex items-center gap-2 group cursor-default">
            <div className="h-9 w-auto">
              <img src="/logo.jpg.png" alt="3dCheck" className="h-full w-auto object-contain drop-shadow-[0_0_8px_rgba(37,99,235,0.3)]" />
            </div>
            <span className="text-xl font-extrabold tracking-tighter hidden xs:block">
              <span className="text-blue-500">3d</span>Check
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          {/* BADGE DE TRIAL MODERNO */}
          {!isExpired && daysLeft > 0 && (
            <div className="hidden md:flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full text-[11px] font-bold text-blue-500 animate-pulse-slow">
              <Clock className="w-3.5 h-3.5" />
              Trial: {daysLeft} dias restantes
            </div>
          )}

          {/* BOTÃO DE TEMA */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2.5 rounded-xl bg-accent/50 hover:bg-accent border border-border transition-all text-muted-foreground hover:text-foreground shadow-sm"
            title="Alternar tema"
          >
            {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>

          {/* PERFIL DO USUÁRIO ATUALIZADO */}
          <div className="flex items-center gap-3 pl-2 border-l border-border/50">
            <div className="hidden sm:text-right sm:block">
              <div className="text-sm font-bold leading-none mb-1">{profile.name}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-end gap-1">
                {profile.role === 'admin' && <ShieldCheck className="w-3 h-3 text-blue-500" />}
                {profile.role === 'admin' ? 'Admin' : 'Membro'}
              </div>
            </div>

            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 p-[2px] shadow-lg shadow-blue-500/20 group cursor-pointer transition-transform hover:scale-105 active:scale-95 overflow-hidden">
              <div className="w-full h-full rounded-[10px] bg-background flex items-center justify-center text-sm font-black text-blue-500 uppercase overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                  profile.name.substring(0, 2)
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto bg-background/50 relative">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="max-w-[1600px] mx-auto p-4 sm:p-8 relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

// ADMIN LAYOUT (TAMBÉM ATUALIZADO PARA CONSISTÊNCIA)
export function AdminLayout() {
  const { user, profile, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const avatarUrl = user?.user_metadata?.avatar_url;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c]">
        <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!user || !profile || profile.role !== 'admin') {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground">
      <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md z-40 flex items-center justify-between px-4 sm:px-8 shrink-0">
        <div className="flex items-center gap-4">
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-auto">
              <img src="/logo.jpg.png" alt="3dCheck" className="h-full w-auto object-contain" />
            </div>
            <span className="text-xl font-extrabold tracking-tighter">
              Admin<span className="text-purple-500">Panel</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2.5 rounded-xl bg-accent/50 border border-border transition-colors text-muted-foreground"
          >
            {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>

          <div className="flex items-center gap-3 pl-2 border-l border-border/50">
            <div className="hidden sm:text-right sm:block">
              <div className="text-sm font-bold leading-none mb-1">{profile.name}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-purple-500">Global Master</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-500 p-[2px] shadow-lg shadow-purple-500/20 overflow-hidden">
              <div className="w-full h-full rounded-[10px] bg-background flex items-center justify-center text-sm font-black text-purple-500 uppercase overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                  profile.name.substring(0, 2)
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
