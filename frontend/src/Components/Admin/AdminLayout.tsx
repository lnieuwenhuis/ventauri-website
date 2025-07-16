import React from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../Contexts/AuthContext';
import AdminSidebar from './Sidebar';

const AdminLayout: React.FC = () => {
	const { user, signOut, loading } = useAuth();

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
		<div className="flex h-screen bg-gray-100">
			<AdminSidebar />
			<div className="flex-1 flex flex-col overflow-hidden ml-64">
				{/* Header */}
				<header className="bg-white shadow-sm border-b border-gray-200">
					<div className="flex justify-between items-center px-6 py-4">
						<Link to="/" className="flex items-center text-xl font-semibold text-gray-800 hover:text-gray-600 transition-colors">
							<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
							</svg>
							Back to Ventauri
						</Link>
						<div className="flex items-center space-x-4">
							<span className="text-sm text-gray-600">
								Welcome, {user?.displayName}
							</span>
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
