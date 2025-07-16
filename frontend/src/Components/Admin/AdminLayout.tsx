import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
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
						<h1 className="text-xl font-semibold text-gray-800">Admin Dashboard</h1>
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
