import React, { useState } from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router';
import { useAuth } from '@/lib/AuthContext';
import { Loader2, Menu, Sun, Moon } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useTheme } from '../ThemeProvider';

export function ProtectedLayout() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  // Check trial expiration
  const isTrialExpired = profile.trialEndsAt ? new Date(profile.trialEndsAt) < new Date() : false;
  
 const isExpired = profile?.trialEndsAt
  ? new Date(profile.trialEndsAt).getTime() < Date.now()
  : true;

if (profile.role !== 'admin' && isExpired) {
  if (location.pathname !== '/billing') {
    return <Navigate to="/billing" replace />;
  }
}

  const daysLeft = profile.trialEndsAt ? Math.max(0, Math.ceil((new Date(profile.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground font-sans">
      <div className="h-16 bg-blue-900 dark:bg-slate-900 border-b border-blue-800/50 dark:border-slate-800 text-white flex items-center justify-between px-4 sm:px-6 shrink-0 transition-colors">
        <div className="flex items-center gap-3">
          <button 
            className="md:hidden p-1.5 -ml-1.5 text-blue-100 hover:text-white rounded-md hover:bg-blue-800 dark:hover:bg-slate-800"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center font-extrabold text-sm object-cover hidden sm:flex">
            3D
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">3DCheck</h1>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          {profile.status === 'trial' && (
            <div className="bg-blue-500/20 border border-blue-500 px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold hidden xs:block">
              Trial: {daysLeft} dias restantes
            </div>
          )}
          
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full hover:bg-blue-800 dark:hover:bg-slate-800 transition-colors text-blue-100 hover:text-white"
            title="Alternar tema"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2 text-right">
            <div className="hidden sm:block">
              <div className="text-xs font-semibold">{profile.name}</div>
              <div className="text-[10px] opacity-70">{profile.role === 'admin' ? 'Administrador' : 'Usuário'}</div>
            </div>
            <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold uppercase shrink-0">
              {profile.name.substring(0, 2)}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function AdminLayout() {
  const { user, profile, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (profile.role !== 'admin') {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground font-sans">
      <div className="h-16 bg-blue-900 dark:bg-slate-900 border-b border-blue-800/50 dark:border-slate-800 text-white flex items-center justify-between px-4 sm:px-6 shrink-0 transition-colors">
        <div className="flex items-center gap-3">
          <button 
            className="md:hidden p-1.5 -ml-1.5 text-blue-100 hover:text-white rounded-md hover:bg-blue-800 dark:hover:bg-slate-800"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center font-extrabold text-sm hidden sm:flex">
            3D
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">3DCheck Admin</h1>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full hover:bg-blue-800 dark:hover:bg-slate-800 transition-colors text-blue-100 hover:text-white"
            title="Alternar tema"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2 text-right">
            <div className="hidden sm:block">
              <div className="text-xs font-semibold">{profile.name}</div>
              <div className="text-[10px] opacity-70">Administrador Global</div>
            </div>
            <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold uppercase shrink-0">
              {profile.name.substring(0, 2)}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
