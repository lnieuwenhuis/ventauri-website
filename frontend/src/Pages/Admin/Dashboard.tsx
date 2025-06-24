import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface DashboardStats {
    totalUsers: number;
    totalOrders: number;
    totalRevenue: number;
    totalProducts: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalProducts: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // TODO: Fetch dashboard stats from API
        setTimeout(() => {
            setStats({
                totalUsers: 1234,
                totalOrders: 567,
                totalRevenue: 89012.34,
                totalProducts: 89
            });
            setLoading(false);
        }, 1000);
    }, []);

    const statCards = [
        {
            title: 'Total Users',
            value: stats.totalUsers.toLocaleString(),
            icon: '👥',
            color: 'bg-blue-500'
        },
        {
            title: 'Total Orders',
            value: stats.totalOrders.toLocaleString(),
            icon: '📦',
            color: 'bg-green-500'
        },
        {
            title: 'Total Revenue',
            value: `$${stats.totalRevenue.toLocaleString()}`,
            icon: '💰',
            color: 'bg-yellow-500'
        },
        {
            title: 'Total Products',
            value: stats.totalProducts.toLocaleString(),
            icon: '🛍️',
            color: 'bg-purple-500'
        }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600 mt-2">Welcome to your e-commerce admin panel</p>
            </div>

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
                        <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                            <div className="text-2xl mb-2">➕</div>
                            <h3 className="font-medium text-gray-900">Add New Product</h3>
                            <p className="text-sm text-gray-600">Create a new product listing</p>
                        </button>
                        <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                            <div className="text-2xl mb-2">📊</div>
                            <h3 className="font-medium text-gray-900">View Orders</h3>
                            <p className="text-sm text-gray-600">Manage customer orders</p>
                        </button>
                        <Link to="/admin/users" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left block">
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
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <p className="text-sm text-gray-600">New order #1234 received</p>
                            <span className="text-xs text-gray-400">2 minutes ago</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <p className="text-sm text-gray-600">New user registered</p>
                            <span className="text-xs text-gray-400">5 minutes ago</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <p className="text-sm text-gray-600">Product inventory updated</p>
                            <span className="text-xs text-gray-400">10 minutes ago</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}