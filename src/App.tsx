import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

import { CustomerLayout } from './components/CustomerLayout';
import { Catalog } from './pages/Catalog';

import { Login } from './pages/Login';
import { AdminLayout } from './components/AdminLayout';
import { ProductsAdmin } from './pages/admin/ProductsAdmin';
import { CategoriesAdmin } from './pages/admin/CategoriesAdmin';
import { SettingsAdmin } from './pages/admin/SettingsAdmin';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        {/* Customer Facing */}
        <Route path="/" element={<CustomerLayout />}>
          <Route index element={<Catalog />} />
        </Route>

        {/* Admin Login */}
        <Route path="/login" element={<Login />} />

        {/* Admin Dashboard */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ProductsAdmin />} />
          <Route path="categories" element={<CategoriesAdmin />} />
          <Route path="settings" element={<SettingsAdmin />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
