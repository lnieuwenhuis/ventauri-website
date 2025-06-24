import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './Contexts/AuthContext';

import Home from './Pages/Public/Home';
import Login from './Pages/Public/Login';
import AdminLayout from './Components/Admin/AdminLayout';
import AdminDashboard from './Pages/Admin/Dashboard';
import Products from './Pages/Admin/Products';
import Categories from './Pages/Admin/Categories';
import Orders from './Pages/Admin/Orders';
import Users from './Pages/Admin/Users';
import Coupons from './Pages/Admin/Coupons';
import Reviews from './Pages/Admin/Reviews';
import Payments from './Pages/Admin/Payments';
import Addresses from './Pages/Admin/Addresses';
import Wishlists from './Pages/Admin/Wishlists';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// App routes component
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      
      {/* Protected Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="categories" element={<Categories />} />
        <Route path="orders" element={<Orders />} />
        <Route path="users" element={<Users />} />
        <Route path="coupons" element={<Coupons />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="payments" element={<Payments />} />
        <Route path="addresses" element={<Addresses />} />
        <Route path="wishlists" element={<Wishlists />} />
      </Route>
      
      {/* Legacy dashboard route - redirect to admin */}
      <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
