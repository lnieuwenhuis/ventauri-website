import React from 'react';
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './Contexts/AuthContext';
import { CartProvider } from './Contexts/CartContext';
import PasswordProtection from './Components/PasswordProtection';

import Home from './Pages/Public/Home';
import Login from './Pages/Public/Login';
import Terms from './Pages/Public/Terms';
import Privacy from './Pages/Public/Privacy';
import AdminLayout from './Components/Admin/AdminLayout';
import AdminDashboard from './Pages/Admin/Dashboard';
import AdminProducts from './Pages/Admin/Products';
import AdminCategories from './Pages/Admin/Categories';
import AdminOrders from './Pages/Admin/Orders';
import AdminUsers from './Pages/Admin/Users';
import AdminCoupons from './Pages/Admin/Coupons';
import AdminReviews from './Pages/Admin/Reviews';
import AdminAddresses from './Pages/Admin/Addresses';
import AdminWishlists from './Pages/Admin/Wishlists';
import AdminTeamMembers from './Pages/Admin/TeamMembers';
import AdminCompetitions from './Pages/Admin/Competitions';

import Products from './Pages/Public/Products';
import Product from './Pages/Public/Product';
import Cart from './Pages/Protected/Cart';
import Checkout from './Pages/Protected/Checkout';
import Profile from './Pages/Protected/Profile';
import Orders from './Pages/Protected/Orders';
import Addresses from './Pages/Protected/Addresses';
import About from './Pages/Public/About';
import Competitions from './Pages/Public/Competitions';
import CompetitionDetail from './Pages/Public/CompetitionDetail';
import Contact from './Pages/Public/Contact';
import Wishlists from './Pages/Protected/Wishlists';

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
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const AppRoutes = () => {
	const location = useLocation();

	useEffect(() => {
		const isAdmin = location.pathname.startsWith('/admin');
		const body = document.body;
		// Toggle background classes for overscroll color
		body.classList.toggle('admin-bg', isAdmin);
		body.classList.toggle('site-bg', !isAdmin);
		// Also set html background directly for safety across browsers
		document.documentElement.style.backgroundColor = isAdmin ? '#ffffff' : '#111827';
	}, [location.pathname]);

	return (
		<Routes>
			<Route path="/" element={<Home />} />
			<Route path="/login" element={<Login />} />
			<Route path="/terms" element={<Terms />} />
			<Route path="/privacy" element={<Privacy />} />

			{/* Protected Admin Routes */}
			<Route
				path="/admin"
				element={
					<ProtectedRoute>
						<AdminLayout />
					</ProtectedRoute>
				}
			>
				<Route index element={<AdminDashboard />} />
				<Route path="dashboard" element={<AdminDashboard />} />
				<Route path="products" element={<AdminProducts />} />
				<Route path="categories" element={<AdminCategories />} />
				<Route path="orders" element={<AdminOrders />} />
				<Route path="users" element={<AdminUsers />} />
				<Route path="coupons" element={<AdminCoupons />} />
				<Route path="reviews" element={<AdminReviews />} />
				{/* Removed: payments */}
				<Route path="addresses" element={<AdminAddresses />} />
				<Route path="wishlists" element={<AdminWishlists />} />
				<Route path="team-members" element={<AdminTeamMembers />} />
				<Route path="competitions" element={<AdminCompetitions />} />
			</Route>

			<Route path="/products" element={<Products />} />
			<Route path="/product/:id" element={<Product />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/addresses" element={<ProtectedRoute><Addresses /></ProtectedRoute>} />
            <Route path="/wishlists" element={<ProtectedRoute><Wishlists /></ProtectedRoute>} />
            <Route path="/about" element={<About />} />
            <Route path="/competitions" element={<Competitions />} />
			<Route path="/competitions/:id" element={<CompetitionDetail />} />
			<Route path="/contact" element={<Contact />} />

			{/* Legacy dashboard route - redirect to admin */}
			<Route path="/dashboard" element={<Navigate to="/admin" replace />} />
		</Routes>
	);
};

function App() {
	return (
		<PasswordProtection>
			<AuthProvider>
				<CartProvider>
					<Router>
						<AppRoutes />
					</Router>
				</CartProvider>
			</AuthProvider>
		</PasswordProtection>
	);
}

export default App;
