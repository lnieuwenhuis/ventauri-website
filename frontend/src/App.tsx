import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './Contexts/AuthContext';
import { CartProvider } from './Contexts/CartContext';

import Home from './Pages/Public/Home';
import Login from './Pages/Public/Login';
import AdminLayout from './Components/Admin/AdminLayout';
import AdminDashboard from './Pages/Admin/Dashboard';
import AdminProducts from './Pages/Admin/Products';
import AdminCategories from './Pages/Admin/Categories';
import AdminOrders from './Pages/Admin/Orders';
import AdminUsers from './Pages/Admin/Users';
import AdminCoupons from './Pages/Admin/Coupons';
import AdminReviews from './Pages/Admin/Reviews';
import AdminPayments from './Pages/Admin/Payments';
import AdminAddresses from './Pages/Admin/Addresses';
import AdminWishlists from './Pages/Admin/Wishlists';

import Products from './Pages/Public/Products';
import Product from './Pages/Public/Product';
import Cart from './Pages/Protected/Cart';

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
        <Route path="products" element={<AdminProducts />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="addresses" element={<AdminAddresses />} />
        <Route path="wishlists" element={<AdminWishlists />} />
      </Route>

      <Route path="/products" element={<Products />} />
      <Route path="/product/:id" element={<Product />} />
      <Route path="/cart" element={<Cart />} />
      
      {/* Legacy dashboard route - redirect to admin */}
      <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <AppRoutes />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
