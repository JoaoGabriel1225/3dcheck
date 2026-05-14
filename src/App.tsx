/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'; // CORREÇÃO: react-router-dom para o roteamento funcionar
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from './components/ThemeProvider';
import { ProtectedLayout, AdminLayout } from './components/layouts/ProtectedLayout';
import { Toaster } from '@/components/ui/sonner';
import { AnimatePresence } from 'framer-motion';
import SplashScreen from './components/SplashScreen';

import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Settings from './pages/Settings'; 
import Billing from './pages/Billing';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Filaments from './pages/Filaments'; // <-- ADICIONADO: Importação dos Filamentos
import Marketplace from './pages/Marketplace';
import Orders from './pages/Orders';
import StorefrontSettings from './pages/StorefrontSettings';
import AdminDashboard from './pages/AdminDashboard';
import Storefront from './pages/Storefront';
import Clients from './pages/Clients';
import Support from './pages/Support'; 
// CORREÇÃO: Usando caminho relativo direto para garantir que o Vercel encontre dentro de src
import Community from './pages/app/Community'; 
import Landing from './pages/Landing'; // NOVA IMPORTAÇÃO DA LANDING PAGE

function AppContent() {
  const { loading, user } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Só entra aqui se o Supabase já terminou de checar a sessão
    if (!loading) {
      // Se NÃO tem usuário logado (ex: vai pra Landing ou tela de Login), mostra por 800ms pra dar o efeito visual.
      // Se JÁ TEM usuário (entrou direto no Dashboard), remove a splash quase na mesma hora (300ms).
      const delay = user ? 300 : 800; 
      
      const timer = setTimeout(() => setShowSplash(false), delay);
      return () => clearTimeout(timer);
    }
  }, [loading, user]);

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && <SplashScreen key="splash" />}
      </AnimatePresence>

      {!showSplash && (
        <Routes>
          {/* ROTA PÚBLICA DA LANDING PAGE */}
          <Route path="/maker" element={<Landing />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* TODAS AS PÁGINAS COM SIDEBAR FICAM AQUI DENTRO */}
          <Route path="/app" element={<ProtectedLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="clients" element={<Clients />} />
            <Route path="orders" element={<Orders />} />
            <Route path="products" element={<Products />} />
            <Route path="filaments" element={<Filaments />} /> {/* <-- ADICIONADO: Rota da Estante de Filamentos */}
            <Route path="marketplace" element={<Marketplace />} />
            <Route path="storefront-settings" element={<StorefrontSettings />} />
            <Route path="settings" element={<Settings />} />
            <Route path="support" element={<Support />} />
            
            {/* ROTA DA COMUNIDADE CORRIGIDA (AGORA TEM SIDEBAR) */}
            <Route path="community" element={<Community />} />
          </Route>
          
          <Route element={<ProtectedLayout />}>
            <Route path="/billing" element={<Billing />} />
          </Route>
          
          <Route path="/admin" element={<AdminLayout />}>
             <Route index element={<AdminDashboard />} />
          </Route>
          
          {/* Rota técnica original (mantida para compatibilidade) */}
          <Route path="/storefront/:id" element={<Storefront />} />

          {/* NOVA ROTA AMIGÁVEL: É aqui que o link da Bio vai "morar" */}
          <Route path="/catalogo/:storeSlug" element={<Storefront />} />
          
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ui-theme">
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
          <Toaster position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
