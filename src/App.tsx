/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider } from '@/lib/AuthContext';
import { ThemeProvider } from './components/ThemeProvider';
import { ProtectedLayout, AdminLayout } from './components/layouts/ProtectedLayout';
import { Toaster } from '@/components/ui/sonner';

import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword'; // IMPORTADO AQUI
import Billing from './pages/Billing';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import StorefrontSettings from './pages/StorefrontSettings';
import AdminDashboard from './pages/AdminDashboard';
import Storefront from './pages/Storefront';
import Clients from './pages/Clients';

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ui-theme">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} /> {/* ROTA ADICIONADA AQUI */}
            
            <Route path="/app" element={<ProtectedLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="clients" element={<Clients />} />
              <Route path="orders" element={<Orders />} />
              <Route path="products" element={<Products />} />
              <Route path="storefront-settings" element={<StorefrontSettings />} />
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
            {/* O :storeSlug permite que o sistema identifique a loja pelo nome */}
            <Route path="/catalogo/:storeSlug" element={<Storefront />} />
            
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <Toaster position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
