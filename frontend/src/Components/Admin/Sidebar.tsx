import { Link, useLocation } from 'react-router-dom';

interface SidebarItem {
	path: string;
	label: string;
	icon: string;
}

const sidebarItems: SidebarItem[] = [
	{ path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
	{ path: '/admin/products', label: 'Products', icon: '📦' },
	{ path: '/admin/categories', label: 'Categories', icon: '🏷️' },
	{ path: '/admin/orders', label: 'Orders', icon: '🛒' },
	{ path: '/admin/users', label: 'Users', icon: '👥' },
	{ path: '/admin/coupons', label: 'Coupons', icon: '🎫' },
	{ path: '/admin/reviews', label: 'Reviews', icon: '⭐' },
	{ path: '/admin/payments', label: 'Payment Methods', icon: '💳' },
	{ path: '/admin/addresses', label: 'Addresses', icon: '📍' },
	{ path: '/admin/wishlists', label: 'Wishlists', icon: '❤️' },
];

export default function AdminSidebar() {
	const location = useLocation();

	return (
		<div className="w-64 bg-gray-800 text-white fixed h-screen overflow-y-auto">
			<div className="p-6 border-b border-gray-700">
				<h2 className="text-xl font-semibold">Admin Panel</h2>
			</div>
			<nav className="mt-0">
				<ul className="space-y-0">
					{sidebarItems.map((item) => (
						<li key={item.path}>
							<Link
								to={item.path}
								className={`flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200 ${
									location.pathname === item.path ? 'bg-blue-600 text-white' : ''
								}`}
							>
								<span className="mr-3 text-lg">{item.icon}</span>
								<span>{item.label}</span>
							</Link>
						</li>
					))}
				</ul>
			</nav>
		</div>
	);
}
