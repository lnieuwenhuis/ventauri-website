import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../Contexts/AuthContext';
import Navbar from '../../Components/Navbar';
import usePageTitle from '../../hooks/usePageTitle';

const Profile: React.FC = () => {
	const { user } = useAuth();
	usePageTitle('Profile');

	if (!user) {
		return (
			<div className="min-h-screen bg-gray-900 text-white">
				<Navbar />
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div className="text-center py-20">
						<p className="text-gray-400 text-lg">
							Please log in to view your profile.
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-900 text-white">
			<Navbar />
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold mb-4">
						<span className="text-white">MY</span>
						<span className="text-ventauri ml-2">PROFILE</span>
					</h1>
					<p className="text-gray-300 text-lg">
						Manage your account and preferences
					</p>
				</div>

				{/* Profile Header Card */}
				<div className="bg-gray-800 rounded-lg p-6 mb-8">
					<div className="flex items-center space-x-6">
						<div className="flex-shrink-0">
							{user.avatar ? (
								<img
									className="h-24 w-24 rounded-full border-2 border-ventauri"
									src={user.avatar}
									alt={`${user.firstName} ${user.lastName}`}
								/>
							) : (
								<div className="h-24 w-24 rounded-full bg-ventauri flex items-center justify-center border-2 border-ventauri">
									<span className="text-3xl font-bold text-black">
										{user.firstName.charAt(0)}
										{user.lastName.charAt(0)}
									</span>
								</div>
							)}
						</div>
						<div className="flex-1 min-w-0">
							<h2 className="text-3xl font-bold text-white mb-2">
								{user.firstName} {user.lastName}
							</h2>
							<p className="text-gray-300 text-lg mb-1">{user.email}</p>
							<div className="flex items-center space-x-4">
								<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-ventauri text-black capitalize">
									{user.role}
								</span>
								<span
									className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
										user.isActive
											? 'bg-green-900 text-green-300'
											: 'bg-red-900 text-red-300'
									}`}
								>
									{user.isActive ? 'Active' : 'Inactive'}
								</span>
							</div>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Personal Information */}
					<div className="bg-gray-800 rounded-lg p-6">
						<h3 className="text-xl font-semibold text-ventauri mb-6">
							Personal Information
						</h3>
						<div className="space-y-4">
							<div>
								<dt className="text-sm font-medium text-gray-400 mb-1">Full Name</dt>
								<dd className="text-white">
									{user.firstName} {user.lastName}
								</dd>
							</div>
							<div>
								<dt className="text-sm font-medium text-gray-400 mb-1">
									Email Address
								</dt>
								<dd className="text-white">{user.email}</dd>
							</div>
							<div>
								<dt className="text-sm font-medium text-gray-400 mb-1">Phone Number</dt>
								<dd className="text-white">{user.phone || 'Not provided'}</dd>
							</div>
							<div>
								<dt className="text-sm font-medium text-gray-400 mb-1">Member Since</dt>
								<dd className="text-white">
									{new Date(user.createdAt).toLocaleDateString('en-US', {
										year: 'numeric',
										month: 'long',
										day: 'numeric',
									})}
								</dd>
							</div>
							{user.lastLoginAt && (
								<div>
									<dt className="text-sm font-medium text-gray-400 mb-1">Last Login</dt>
									<dd className="text-white">
										{new Date(user.lastLoginAt).toLocaleDateString('en-US', {
											year: 'numeric',
											month: 'long',
											day: 'numeric',
										})}
									</dd>
								</div>
							)}
						</div>
					</div>

					{/* Quick Actions */}
					<div className="bg-gray-800 rounded-lg p-6">
						<h3 className="text-xl font-semibold text-ventauri mb-6">
							Quick Actions
						</h3>
						<div className="space-y-4">
							<Link
								to="/orders"
								className="block w-full bg-ventauri text-black px-6 py-3 rounded-lg font-semibold text-center hover:bg-yellow-300 transition-colors duration-200"
							>
								View Order History
							</Link>
							<Link
								to="/addresses"
								className="block w-full bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold text-center hover:bg-gray-600 transition-colors duration-200 border border-gray-600"
							>
								Manage Addresses
							</Link>
							<Link
								to="/wishlists"
								className="block w-full bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold text-center hover:bg-gray-600 transition-colors duration-200 border border-gray-600"
							>
								View Wishlist
							</Link>
							<Link
								to="/cart"
								className="block w-full bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold text-center hover:bg-gray-600 transition-colors duration-200 border border-gray-600"
							>
								View Shopping Cart
							</Link>
							<Link
								to="/products"
								className="block w-full border-2 border-ventauri text-ventauri px-6 py-3 rounded-lg font-semibold text-center hover:bg-yellow-300 hover:text-black transition-colors duration-200"
							>
								Continue Shopping
							</Link>
						</div>
					</div>

					{/* Account Details */}
					<div className="bg-gray-800 rounded-lg p-6">
						<h3 className="text-xl font-semibold text-ventauri mb-6">
							Account Details
						</h3>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<span className="text-gray-400">Account Status</span>
								<div className="flex items-center">
									<div
										className={`h-3 w-3 rounded-full mr-2 ${
											user.isActive ? 'bg-green-400' : 'bg-red-400'
										}`}
									></div>
									<span className="text-white">
										{user.isActive ? 'Active' : 'Inactive'}
									</span>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-gray-400">Account Type</span>
								<span className="text-white capitalize">{user.role}</span>
							</div>
							{user.googleId && (
								<div className="flex items-center justify-between">
									<span className="text-gray-400">Google Account</span>
									<div className="flex items-center">
										<div className="h-3 w-3 rounded-full bg-green-400 mr-2"></div>
										<span className="text-white">Linked</span>
									</div>
								</div>
							)}
							{user.displayName && (
								<div className="flex items-center justify-between">
									<span className="text-gray-400">Display Name</span>
									<span className="text-white">{user.displayName}</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Profile;
