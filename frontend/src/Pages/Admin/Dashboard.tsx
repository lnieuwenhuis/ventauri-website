import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface DashboardStats {
	totalUsers: number;
	totalOrders: number;
	totalRevenue: number;
	totalProducts: number;
}

interface Activity {
	id: string;
	createdAt: string;
	type: string;
	description: string;
	user?: {
		firstName?: string;
		lastName?: string;
		displayName?: string;
	};
}

export default function AdminDashboard() {
	const [stats, setStats] = useState<DashboardStats>({
		totalUsers: 0,
		totalOrders: 0,
		totalRevenue: 0,
		totalProducts: 0,
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
	const [activitiesLoading, setActivitiesLoading] = useState(true);
	const apiURL = import.meta.env.VITE_BACKEND_URL || '';

	const fetchRecentActivities = async () => {
		try {
			setActivitiesLoading(true);

			const response = await fetch(`${apiURL}/api/admin/activities/recent`, {
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				setRecentActivities(data.data.activities);
			}
		} catch (e) {
			console.error(e);
		} finally {
			setActivitiesLoading(false);
		}
	};

	const fetchDashboardStats = async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await fetch(`${apiURL}/api/admin/stats/dashboard`, {
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch dashboard stats: ${response.status}`);
			}

			const result = await response.json();
			setStats(result.data);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
			console.error('Error fetching dashboard stats:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchDashboardStats();
		fetchRecentActivities();
		//eslint-disable-next-line
	}, []);

	const statCards = [
		{
			title: 'Total Users',
			value: stats.totalUsers.toLocaleString(),
			icon: '👥',
			color: 'bg-blue-500',
		},
		{
			title: 'Total Orders',
			value: stats.totalOrders.toLocaleString(),
			icon: '📦',
			color: 'bg-green-500',
		},
		{
			title: 'Total Revenue',
			value: `$${stats.totalRevenue.toLocaleString()}`,
			icon: '💰',
			color: 'bg-yellow-500',
		},
		{
			title: 'Total Products',
			value: stats.totalProducts.toLocaleString(),
			icon: '🛍️',
			color: 'bg-purple-500',
		},
	];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
				<p className="text-gray-600 mt-2">Welcome to your e-commerce admin panel</p>
			</div>

			{error && (
				<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
					{error}
				</div>
			)}

			{/* Stats Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{statCards.map((card, index) => (
					<div key={index} className="bg-white rounded-lg shadow p-6">
						<div className="flex items-center">
							<div className={`${card.color} rounded-lg p-3 text-white text-2xl mr-4`}>
								{card.icon}
							</div>
							<div>
								<p className="text-sm font-medium text-gray-600">{card.title}</p>
								<p className="text-2xl font-bold text-gray-900">
									{loading ? '...' : card.value}
								</p>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Quick Actions */}
			<div className="bg-white rounded-lg shadow">
				<div className="p-6 border-b border-gray-200">
					<h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
				</div>
				<div className="p-6">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						<Link
							to="/admin/products"
							className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left block"
						>
							<div className="text-2xl mb-2">➕</div>
							<h3 className="font-medium text-gray-900">Add New Product</h3>
							<p className="text-sm text-gray-600">Create a new product listing</p>
						</Link>
						<Link
							to="/admin/orders"
							className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left block"
						>
							<div className="text-2xl mb-2">📊</div>
							<h3 className="font-medium text-gray-900">View Orders</h3>
							<p className="text-sm text-gray-600">View and manage customer orders</p>
						</Link>
						<Link
							to="/admin/users"
							className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left block"
						>
							<div className="text-2xl mb-2">👤</div>
							<h3 className="font-medium text-gray-900">Manage Users</h3>
							<p className="text-sm text-gray-600">View and edit user accounts</p>
						</Link>
					</div>
				</div>
			</div>

			{/* Recent Activity */}
			<div className="bg-white rounded-lg shadow">
				<div className="p-6 border-b border-gray-200">
					<h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
				</div>
				<div className="p-6">
					{activitiesLoading ? (
						<div className="text-center py-4">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
						</div>
					) : recentActivities.length > 0 ? (
						<div className="space-y-4">
							{recentActivities.map((activity) => {
								const getActivityColor = (type: string) => {
									if (type.includes('order')) return 'bg-green-500';
									if (type.includes('user')) return 'bg-blue-500';
									if (type.includes('product') || type.includes('inventory'))
										return 'bg-yellow-500';
									return 'bg-gray-500';
								};

								const timeAgo = (date: string) => {
									const now = new Date();
									const activityDate = new Date(date);
									const diffInMinutes = Math.floor(
										(now.getTime() - activityDate.getTime()) / (1000 * 60)
									);

									if (diffInMinutes < 1) return 'Just now';
									if (diffInMinutes < 60)
										return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;

									const diffInHours = Math.floor(diffInMinutes / 60);
									if (diffInHours < 24)
										return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

									const diffInDays = Math.floor(diffInHours / 24);
									return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
								};

								return (
									<div key={activity.id} className="flex items-center space-x-3">
										<div
											className={`w-2 h-2 ${getActivityColor(activity.type)} rounded-full`}
										></div>
										<p className="text-sm text-gray-600 flex-1">{activity.description}</p>
										<span className="text-xs text-gray-400">
											{timeAgo(activity.createdAt)}
										</span>
									</div>
								);
							})}
						</div>
					) : (
						<p className="text-gray-500 text-center py-4">No recent activities</p>
					)}
				</div>
			</div>
		</div>
	);
}
