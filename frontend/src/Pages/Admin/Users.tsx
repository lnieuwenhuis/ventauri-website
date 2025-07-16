import React, { useState, useEffect } from 'react';
import FormModal from '../../Components/Admin/FormModal';

interface User {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	role: 'admin' | 'user';
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	deletedAt?: string | null;
	lastLoginAt?: string;
	googleId?: string;
	avatar?: string;
	displayName?: string;
}

interface UsersResponse {
	data: User[];
	total: number;
	page: number;
	limit: number;
}

interface UserFormData extends Record<string, unknown> {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	role: 'admin' | 'user';
	isActive: boolean;
	password?: string;
}

const AdminUsers: React.FC = () => {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [totalUsers, setTotalUsers] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingUser, setEditingUser] = useState<User | null>(null);
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [isViewModalOpen, setIsViewModalOpen] = useState(false);
	const itemsPerPage = 10;
	const apiURL = import.meta.env.VITE_BACKEND_URL || '';

	const userFields = [
		{
			name: 'firstName' as keyof UserFormData,
			label: 'First Name',
			type: 'text' as const,
			required: true,
			placeholder: 'Enter first name',
		},
		{
			name: 'lastName' as keyof UserFormData,
			label: 'Last Name',
			type: 'text' as const,
			required: true,
			placeholder: 'Enter last name',
		},
		{
			name: 'email' as keyof UserFormData,
			label: 'Email',
			type: 'text' as const,
			required: true,
			placeholder: 'Enter email address',
		},
		{
			name: 'phone' as keyof UserFormData,
			label: 'Phone',
			type: 'text' as const,
			required: false,
			placeholder: 'Enter phone number',
		},
		{
			name: 'role' as keyof UserFormData,
			label: 'Role',
			type: 'select' as const,
			required: true,
			options: [
				{ value: 'user', label: 'User' },
				{ value: 'admin', label: 'Admin' },
			],
		},
		{
			name: 'isActive' as keyof UserFormData,
			label: 'Active',
			type: 'checkbox' as const,
			required: false,
		},
	];

	const createUserFields = [
		...userFields,
		{
			name: 'password' as keyof UserFormData,
			label: 'Password',
			type: 'text' as const,
			required: true,
			placeholder: 'Enter password (min 8 characters)',
		},
	];

	const fetchUsers = async (page: number = 1, search: string = '') => {
		try {
			setLoading(true);
			setError(null);

			const params = new URLSearchParams({
				page: page.toString(),
				limit: itemsPerPage.toString(),
				...(search && { search }),
			});

			const response = await fetch(`${apiURL}/api/admin/users/?${params}`, {
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch users: ${response.status}`);
			}

			const result: UsersResponse = await response.json();
			setUsers(result.data);
			setTotalUsers(result.total);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
			console.error('Error fetching users:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchUsers(currentPage, searchTerm);
		// eslint-disable-next-line
	}, [currentPage, searchTerm]);

	const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value);
		setCurrentPage(1);
	};

	const handleCreateUser = () => {
		setEditingUser(null);
		setIsModalOpen(true);
	};

	const handleEditUser = (user: User) => {
		setEditingUser(user);
		setIsModalOpen(true);
	};

	const handleViewUser = (user: User) => {
		setSelectedUser(user);
		setIsViewModalOpen(true);
	};

	const handleSubmitUser = async (formData: UserFormData) => {
		try {
			const url = editingUser
				? `${apiURL}/api/admin/users/${editingUser.id}`
				: `${apiURL}/api/admin/users`;

			const method = editingUser ? 'PUT' : 'POST';

			const response = await fetch(url, {
				method,
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(formData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.error || `Failed to ${editingUser ? 'update' : 'create'} user`
				);
			}

			setIsModalOpen(false);
			setEditingUser(null);
			fetchUsers(currentPage, searchTerm);
		} catch (err) {
			console.error('Error submitting user:', err);
			setError(
				err instanceof Error
					? err.message
					: `Failed to ${editingUser ? 'update' : 'create'} user`
			);
		}
	};

	const convertUserToFormData = (user: User): UserFormData => {
		return {
			id: user.id,
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email,
			phone: user.phone || '',
			role: user.role,
			isActive: user.isActive,
		};
	};

	const toggleUserStatus = async (userId: string) => {
		try {
			const response = await fetch(`${apiURL}/api/admin/users/${userId}/status`, {
				method: 'PUT',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error('Failed to update user status');
			}

			fetchUsers(currentPage, searchTerm);
		} catch (err) {
			console.error('Error updating user status:', err);
			setError(
				err instanceof Error ? err.message : 'Failed to update user status'
			);
		}
	};

	const deleteUser = async (userId: string) => {
		if (!confirm('Are you sure you want to delete this user?')) {
			return;
		}

		try {
			const response = await fetch(`${apiURL}/api/admin/users/${userId}`, {
				method: 'DELETE',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error('Failed to delete user');
			}

			fetchUsers(currentPage, searchTerm);
		} catch (err) {
			console.error('Error deleting user:', err);
			setError(err instanceof Error ? err.message : 'Failed to delete user');
		}
	};

	const totalPages = Math.ceil(totalUsers / itemsPerPage);

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
				<button
					onClick={handleCreateUser}
					className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
				>
					Add New User
				</button>
			</div>

			{error && (
				<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
					{error}
				</div>
			)}

			<div className="bg-white rounded-lg shadow-sm border border-gray-200">
				<div className="p-6 border-b border-gray-200">
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="flex-1">
							<input
								type="text"
								placeholder="Search users by name or email..."
								value={searchTerm}
								onChange={handleSearch}
								className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									User
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Contact
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Role
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Status
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Created
								</th>
								<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{loading ? (
								<tr>
									<td colSpan={6} className="px-6 py-12">
										<div className="flex items-center justify-center">
											<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
											<span className="ml-3 text-gray-500">Loading users...</span>
										</div>
									</td>
								</tr>
							) : users.length === 0 ? (
								<tr>
									<td colSpan={6} className="px-6 py-12 text-center text-gray-500">
										No users found
									</td>
								</tr>
							) : (
								users.map((user) => (
									<tr key={user.id} className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="flex items-center">
												<div className="flex-shrink-0 h-10 w-10">
													{user.avatar ? (
														<img
															className="h-10 w-10 rounded-full"
															src={user.avatar}
															alt={`${user.firstName} ${user.lastName}`}
														/>
													) : (
														<div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
															<span className="text-sm font-medium text-gray-700">
																{user.firstName.charAt(0)}
																{user.lastName.charAt(0)}
															</span>
														</div>
													)}
												</div>
												<div className="ml-4">
													<div className="text-sm font-medium text-gray-900">
														{user.displayName || `${user.firstName} ${user.lastName}`}
													</div>
													<div className="text-sm text-gray-500">
														ID: {user.id.substring(0, 8)}
													</div>
												</div>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm font-medium text-gray-900">{user.email}</div>
											<div className="text-sm text-gray-500">
												{user.phone || 'No phone'}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span
												className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
													user.role === 'admin'
														? 'bg-purple-100 text-purple-800'
														: 'bg-blue-100 text-blue-800'
												}`}
											>
												{user.role.charAt(0).toUpperCase() + user.role.slice(1)}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span
												className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
													user.isActive
														? 'bg-green-100 text-green-800'
														: 'bg-red-100 text-red-800'
												}`}
											>
												{user.isActive ? 'Active' : 'Inactive'}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{new Date(user.createdAt).toLocaleDateString()}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
											<div className="flex items-center justify-end space-x-2">
												<button
													onClick={() => handleViewUser(user)}
													className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
												>
													<svg
														className="w-3 h-3 mr-1"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
														/>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
														/>
													</svg>
													View
												</button>
												<button
													onClick={() => handleEditUser(user)}
													className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
												>
													<svg
														className="w-3 h-3 mr-1"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
														/>
													</svg>
													Edit
												</button>
												<button
													onClick={() => toggleUserStatus(user.id)}
													className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${
														user.isActive
															? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
															: 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
													}`}
												>
													<svg
														className="w-3 h-3 mr-1"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M8 9l4-4 4 4m0 6l-4 4-4-4"
														/>
													</svg>
													{user.isActive ? 'Deactivate' : 'Activate'}
												</button>
												<button
													onClick={() => deleteUser(user.id)}
													className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
												>
													<svg
														className="w-3 h-3 mr-1"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
														/>
													</svg>
													Delete
												</button>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{totalPages > 1 && (
					<div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
						<div className="text-sm text-gray-500">
							Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
							{Math.min(currentPage * itemsPerPage, totalUsers)} of {totalUsers} users
						</div>
						<div className="flex space-x-2">
							<button
								onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
								disabled={currentPage === 1}
								className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
							>
								Previous
							</button>
							<span className="px-3 py-1 text-sm">
								Page {currentPage} of {totalPages}
							</span>
							<button
								onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
								disabled={currentPage === totalPages}
								className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
							>
								Next
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Create/Edit Modal */}
			<FormModal<UserFormData>
				isOpen={isModalOpen}
				onClose={() => {
					setIsModalOpen(false);
					setEditingUser(null);
				}}
				onSubmit={handleSubmitUser}
				title={editingUser ? 'Edit User' : 'Create New User'}
				fields={editingUser ? userFields : createUserFields}
				initialData={
					editingUser
						? convertUserToFormData(editingUser)
						: {
								firstName: '',
								lastName: '',
								email: '',
								phone: '',
								role: 'user',
								isActive: true,
								password: '',
							}
				}
			/>

			{/* View Modal */}
			{isViewModalOpen && selectedUser && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
						<div className="p-6">
							<div className="flex justify-between items-center mb-6">
								<h2 className="text-xl font-semibold text-gray-900">User Details</h2>
								<button
									onClick={() => setIsViewModalOpen(false)}
									className="text-gray-400 hover:text-gray-600"
								>
									<svg
										className="w-6 h-6"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							</div>

							<div className="space-y-4">
								<div className="flex items-center space-x-4">
									<div className="flex-shrink-0">
										{selectedUser.avatar ? (
											<img
												className="h-16 w-16 rounded-full"
												src={selectedUser.avatar}
												alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
											/>
										) : (
											<div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
												<span className="text-xl font-medium text-gray-700">
													{selectedUser.firstName.charAt(0)}
													{selectedUser.lastName.charAt(0)}
												</span>
											</div>
										)}
									</div>
									<div>
										<h3 className="text-lg font-medium text-gray-900">
											{selectedUser.displayName ||
												`${selectedUser.firstName} ${selectedUser.lastName}`}
										</h3>
										<p className="text-sm text-gray-500">ID: {selectedUser.id}</p>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-bold text-gray-700">
											First Name
										</label>
										<p className="mt-1 text-sm text-gray-900">{selectedUser.firstName}</p>
									</div>
									<div>
										<label className="block text-sm font-bold text-gray-700">
											Last Name
										</label>
										<p className="mt-1 text-sm text-gray-900">{selectedUser.lastName}</p>
									</div>
									<div>
										<label className="block text-sm font-bold text-gray-700">Email</label>
										<p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
									</div>
									<div>
										<label className="block text-sm font-bold text-gray-700">Phone</label>
										<p className="mt-1 text-sm text-gray-900">
											{selectedUser.phone || 'Not provided'}
										</p>
									</div>
									<div>
										<label className="block text-sm font-bold text-gray-700">Role</label>
										<span
											className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
												selectedUser.role === 'admin'
													? 'bg-purple-100 text-purple-800'
													: 'bg-blue-100 text-blue-800'
											}`}
										>
											{selectedUser.role.charAt(0).toUpperCase() +
												selectedUser.role.slice(1)}
										</span>
									</div>
									<div>
										<label className="block text-sm font-bold text-gray-700">
											Status
										</label>
										<span
											className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
												selectedUser.isActive
													? 'bg-green-100 text-green-800'
													: 'bg-red-100 text-red-800'
											}`}
										>
											{selectedUser.isActive ? 'Active' : 'Inactive'}
										</span>
									</div>
									<div>
										<label className="block text-sm font-bold text-gray-700">
											Created At
										</label>
										<p className="mt-1 text-sm text-gray-900">
											{new Date(selectedUser.createdAt).toLocaleString()}
										</p>
									</div>
									<div>
										<label className="block text-sm font-bold text-gray-700">
											Last Updated
										</label>
										<p className="mt-1 text-sm text-gray-900">
											{new Date(selectedUser.updatedAt).toLocaleString()}
										</p>
									</div>
									{selectedUser.lastLoginAt && (
										<div>
											<label className="block text-sm font-medium text-gray-700">
												Last Login
											</label>
											<p className="mt-1 text-sm text-gray-900">
												{new Date(selectedUser.lastLoginAt).toLocaleString()}
											</p>
										</div>
									)}
									{selectedUser.googleId && (
										<div>
											<label className="block text-sm font-medium text-gray-700">
												Google Account
											</label>
											<p className="mt-1 text-sm text-gray-900">Connected</p>
										</div>
									)}
								</div>
							</div>

							<div className="mt-6 flex justify-end space-x-3">
								<button
									onClick={() => {
										setIsViewModalOpen(false);
										handleEditUser(selectedUser);
									}}
									className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									Edit User
								</button>
								<button
									onClick={() => setIsViewModalOpen(false)}
									className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
								>
									Close
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default AdminUsers;
