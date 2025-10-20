import React, { useState } from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../Contexts/AuthContext';
import AdminSidebar from './Sidebar';
import usePageTitle from '../../hooks/usePageTitle';

const AdminLayout: React.FC = () => {
	const { user, signOut, loading } = useAuth();
	usePageTitle('Admin Panel');
	const [sidebarOpen, setSidebarOpen] = useState(false);

	if (loading) {
		return <div>Loading...</div>;
	}

	if (!user) {
		return <Navigate to="/login" />;
	}

	if (user.role !== 'admin') {
		return <Navigate to="/" />;
	}

	const handleSignOut = async () => {
		try {
			await signOut();
		} catch (error) {
			console.error('Logout failed:', error);
		}
	};

	return (
		<div className="flex min-h-screen bg-gray-100">
			{/* Responsive sidebar */}
			<AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userDisplayName={user?.displayName ?? undefined} onSignOut={handleSignOut} />

			<div className="flex-1 flex flex-col overflow-hidden md:ml-64">
				{/* Header */}
				<header className="bg-white shadow-sm border-b border-gray-200">
					<div className="flex justify-between items-center px-6 py-3">
						<div className="flex items-center">
							{/* Mobile hamburger */}
							<button
								className="md:hidden mr-3 text-gray-700 hover:text-gray-900"
								onClick={() => setSidebarOpen(true)}
								aria-label="Open sidebar"
							>
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
								</svg>
							</button>

							<Link to="/" className="hidden md:flex items-center text-xl font-semibold text-gray-800 hover:text-gray-600 transition-colors">
								<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
								</svg>
								Back to Ventauri
							</Link>
						</div>

						<div className="hidden md:flex items-center space-x-4">
							<span className="text-sm text-gray-600">Welcome, {user?.displayName}</span>
							<button
								onClick={handleSignOut}
								className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
							>
								Sign Out
							</button>
						</div>
					</div>
				</header>

				{/* Main Content */}
				<main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
					<Outlet />
				</main>
			</div>
		</div>
	);
};

export default AdminLayout;
