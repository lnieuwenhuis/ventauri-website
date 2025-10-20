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
	{ path: '/admin/team-members', label: 'Team Members', icon: '🏎️' },
	{ path: '/admin/competitions', label: 'Competitions', icon: '🏁' },
	{ path: '/admin/coupons', label: 'Coupons', icon: '🎫' },
	{ path: '/admin/reviews', label: 'Reviews', icon: '⭐' },
	{ path: '/admin/addresses', label: 'Addresses', icon: '📍' },
	{ path: '/admin/wishlists', label: 'Wishlists', icon: '❤️' },
];

interface AdminSidebarProps {
	isOpen?: boolean;
	onClose?: () => void;
	userDisplayName?: string;
	onSignOut?: () => void;
}

export default function AdminSidebar({ isOpen = false, onClose, userDisplayName, onSignOut }: AdminSidebarProps) {
	const location = useLocation();

	return (
		<>
			{/* Mobile overlay */}
			<div
				className={`fixed inset-0 bg-black/40 md:hidden ${isOpen ? '' : 'hidden'}`}
				onClick={onClose}
				aria-hidden={!isOpen}
			/>

			{/* Sidebar container */}
			<div
				className={`fixed inset-y-0 left-0 w-64 bg-gray-800 text-white overflow-y-auto transform transition-transform duration-200 ease-in-out 
				${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:fixed md:inset-y-0 md:left-0 md:z-40 md:h-screen`}
				aria-label="Admin sidebar"
			>
				<div className="p-6 border-b border-gray-700 flex items-center justify-between">
					<h2 className="text-xl font-semibold">Admin Panel</h2>
					{/* Close button only on mobile */}
					<button
						className="md:hidden text-gray-300 hover:text-white"
						onClick={onClose}
						aria-label="Close sidebar"
					>
						<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{/* Mobile-only header content moved from top bar */}
				<div className="md:hidden border-b border-gray-700">
					<div className="px-6 py-4 flex items-center justify-between">
						<Link
							to="/"
							className="flex items-center text-gray-300 hover:text-white"
							onClick={onClose}
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
							</svg>
							<span className="ml-2">Back to Ventauri</span>
						</Link>
						<button
							onClick={onSignOut}
							className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
						>
							Sign Out
						</button>
					</div>
					<div className="px-6 pb-4 text-sm text-gray-400">
						<span>Welcome, {userDisplayName}</span>
					</div>
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
									onClick={onClose}
								>
									<span className="mr-3 text-lg">{item.icon}</span>
									<span>{item.label}</span>
								</Link>
							</li>
						))}
					</ul>
				</nav>
			</div>
		</>
	);
}
