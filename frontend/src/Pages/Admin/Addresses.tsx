import React, { useState, useEffect } from 'react';

interface Address {
	id: string;
	userId: string;
	street: string;
	city: string;
	state: string;
	zipCode: string;
	country: string;
	isDefault: boolean;
	isActive: boolean;
	createdAt: string;
	user: {
		id: string;
		firstName: string;
		lastName: string;
		email: string;
	};
}

interface AddressesResponse {
	data: Address[];
	total: number;
	page: number;
	limit: number;
}

export default function AdminAddresses() {
	const [addresses, setAddresses] = useState<Address[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [totalAddresses, setTotalAddresses] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const itemsPerPage = 10;

	const apiURL = import.meta.env.VITE_BACKEND_URL || '';

	const getAuthToken = () => {
		return localStorage.getItem('authToken') || localStorage.getItem('token');
	};

	const fetchAddresses = async (page: number = 1, search: string = '') => {
		try {
			setLoading(true);
			setError(null);

			const params = new URLSearchParams({
				page: page.toString(),
				limit: itemsPerPage.toString(),
				...(search && { search }),
			});

			const token = getAuthToken();
			if (!token) {
				setError('No authorization token found');
				setLoading(false);
				return;
			}

			const response = await fetch(`${apiURL}/api/admin/addresses/?${params}`, {
				credentials: 'include',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch addresses: ${response.status}`);
			}

			const result: AddressesResponse = await response.json();
			setAddresses(result.data);
			setTotalAddresses(result.total);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
			console.error('Error fetching addresses:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchAddresses(currentPage, searchTerm);
		//eslint-disable-next-line
	}, [currentPage, searchTerm]);

	const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value);
		setCurrentPage(1);
	};

	const toggleAddressStatus = async (addressId: string) => {
		try {
			const token = getAuthToken();
			if (!token) {
				setError('No authorization token found');
				return;
			}

			const response = await fetch(
				`${apiURL}/api/admin/addresses/${addressId}/status`,
				{
					method: 'PUT',
					credentials: 'include',
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': 'application/json',
					},
				}
			);

			if (!response.ok) {
				throw new Error('Failed to update address status');
			}

			fetchAddresses(currentPage, searchTerm);
		} catch (err) {
			console.error('Error updating address status:', err);
			setError(
				err instanceof Error ? err.message : 'Failed to update address status'
			);
		}
	};

	const deleteAddress = async (addressId: string) => {
		if (!confirm('Are you sure you want to delete this address?')) {
			return;
		}

		try {
			const token = getAuthToken();
			if (!token) {
				setError('No authorization token found');
				return;
			}

			const response = await fetch(`${apiURL}/api/admin/addresses/${addressId}`, {
				method: 'DELETE',
				credentials: 'include',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error('Failed to delete address');
			}

			fetchAddresses(currentPage, searchTerm);
		} catch (err) {
			console.error('Error deleting address:', err);
			setError(err instanceof Error ? err.message : 'Failed to delete address');
		}
	};

	const totalPages = Math.ceil(totalAddresses / itemsPerPage);

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold text-gray-900">User Addresses</h1>
				<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
					Add Address
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
								placeholder="Search addresses by street, city, state, country, or user name..."
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
									Address
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									City
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									State
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Country
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
									<td colSpan={8} className="px-6 py-12">
										<div className="flex items-center justify-center">
											<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
											<span className="ml-3 text-gray-500">Loading addresses...</span>
										</div>
									</td>
								</tr>
							) : addresses.length === 0 ? (
								<tr>
									<td colSpan={8} className="px-6 py-4 text-center text-gray-500">
										No addresses found
									</td>
								</tr>
							) : (
								addresses.map((address) => (
									<tr key={address.id} className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm font-medium text-gray-900">
												{address.user?.firstName} {address.user?.lastName}
											</div>
											<div className="text-sm text-gray-500">{address.user?.email}</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm text-gray-900 max-w-xs truncate">
												{address.street}
											</div>
											<div className="text-sm text-gray-500">{address.zipCode}</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{address.city}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{address.state}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{address.country}
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="flex flex-col space-y-1">
												<span
													className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
														address.isActive
															? 'bg-green-100 text-green-800'
															: 'bg-red-100 text-red-800'
													}`}
												>
													{address.isActive ? 'Active' : 'Inactive'}
												</span>
												{address.isDefault && (
													<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
														Default
													</span>
												)}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{new Date(address.createdAt).toLocaleDateString()}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
											<div className="flex items-center justify-end space-x-2">
												<button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
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
													onClick={() => toggleAddressStatus(address.id)}
													className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
														address.isActive
															? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
															: 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
													}`}
												>
													{address.isActive ? (
														<>
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
																	d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636"
																/>
															</svg>
															Deactivate
														</>
													) : (
														<>
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
																	d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
																/>
															</svg>
															Activate
														</>
													)}
												</button>
												<button
													onClick={() => deleteAddress(address.id)}
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
							{Math.min(currentPage * itemsPerPage, totalAddresses)} of{' '}
							{totalAddresses} addresses
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
		</div>
	);
}
