import React, { useState, useEffect } from 'react';

interface Review {
	id: string;
	userId: string;
	productId: string;
	orderId: string;
	rating: number;
	title: string;
	comment: string;
	isVerified: boolean;
	isApproved: boolean;
	helpfulCount: number;
	createdAt: string;
	user: {
		id: string;
		firstName: string;
		lastName: string;
		email: string;
	};
	product: {
		id: string;
		name: string;
		price: number;
	};
}

interface ReviewsResponse {
	data: Review[];
	total: number;
	page: number;
	limit: number;
}

export default function AdminReviews() {
	const [reviews, setReviews] = useState<Review[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [totalReviews, setTotalReviews] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [approvalFilter, setApprovalFilter] = useState('all');
	const itemsPerPage = 10;
	const apiURL = import.meta.env.VITE_BACKEND_URL || '';

	const fetchReviews = async (
		page: number = 1,
		search: string = '',
		approved: string = 'all'
	) => {
		try {
			setLoading(true);
			setError(null);

			const params = new URLSearchParams({
				page: page.toString(),
				limit: itemsPerPage.toString(),
				...(search && { search }),
				...(approved !== 'all' && { approved }),
			});

			const response = await fetch(`${apiURL}/api/admin/reviews/?${params}`, {
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch reviews: ${response.status}`);
			}

			const result: ReviewsResponse = await response.json();
			setReviews(result.data);
			setTotalReviews(result.total);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
			console.error('Error fetching reviews:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchReviews(currentPage, searchTerm, approvalFilter);
		//eslint-disable-next-line
	}, [currentPage, searchTerm, approvalFilter]);

	const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value);
		setCurrentPage(1);
	};

	const handleApprovalFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setApprovalFilter(e.target.value);
		setCurrentPage(1);
	};

	const toggleReviewStatus = async (reviewId: string) => {
		try {
			const response = await fetch(
				`${apiURL}/api/admin/reviews/${reviewId}/status`,
				{
					method: 'PUT',
					credentials: 'include',
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);

			if (!response.ok) {
				throw new Error('Failed to update review status');
			}

			fetchReviews(currentPage, searchTerm, approvalFilter);
		} catch (err) {
			console.error('Error updating review status:', err);
			setError(
				err instanceof Error ? err.message : 'Failed to update review status'
			);
		}
	};

	const deleteReview = async (reviewId: string) => {
		if (!confirm('Are you sure you want to delete this review?')) {
			return;
		}

		try {
			const response = await fetch(`${apiURL}/api/admin/reviews/${reviewId}`, {
				method: 'DELETE',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error('Failed to delete review');
			}

			fetchReviews(currentPage, searchTerm, approvalFilter);
		} catch (err) {
			console.error('Error deleting review:', err);
			setError(err instanceof Error ? err.message : 'Failed to delete review');
		}
	};

	const renderStars = (rating: number) => {
		return Array.from({ length: 5 }, (_, i) => (
			<span
				key={i}
				className={`text-sm ${i < rating ? 'text-ventauri' : 'text-gray-300'}`}
			>
				★
			</span>
		));
	};

	const totalPages = Math.ceil(totalReviews / itemsPerPage);

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold text-gray-900">Reviews Management</h1>
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
								placeholder="Search by user, product, title, or comment..."
								value={searchTerm}
								onChange={handleSearch}
								className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>
						<div className="flex space-x-2">
							<select
								value={approvalFilter}
								onChange={handleApprovalFilter}
								className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							>
								<option value="all">All Reviews</option>
								<option value="true">Approved</option>
								<option value="false">Pending</option>
							</select>
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
									Product
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Rating
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Review
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
									<td colSpan={7} className="px-6 py-12">
										<div className="flex items-center justify-center">
											<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
											<span className="ml-3 text-gray-500">Loading reviews...</span>
										</div>
									</td>
								</tr>
							) : reviews.length === 0 ? (
								<tr>
									<td colSpan={7} className="px-6 py-4 text-center text-gray-500">
										No reviews found
									</td>
								</tr>
							) : (
								reviews.map((review) => (
									<tr key={review.id} className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm font-medium text-gray-900">
												{review.user?.firstName} {review.user?.lastName}
											</div>
											<div className="text-sm text-gray-500">{review.user?.email}</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm font-medium text-gray-900">
												{review.product?.name}
											</div>
											<div className="text-sm text-gray-500">${review.product?.price}</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="flex items-center">
												{renderStars(review.rating)}
												<span className="ml-2 text-sm text-gray-600">
													({review.rating})
												</span>
											</div>
										</td>
										<td className="px-6 py-4">
											<div className="text-sm font-medium text-gray-900 truncate max-w-xs">
												{review.title}
											</div>
											<div className="text-sm text-gray-500 truncate max-w-xs">
												{review.comment}
											</div>
											{review.isVerified && (
												<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 mt-1">
													Verified Purchase
												</span>
											)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span
												className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
													review.isApproved
														? 'bg-green-100 text-green-800'
														: 'bg-yellow-100 text-yellow-800'
												}`}
											>
												{review.isApproved ? 'Approved' : 'Pending'}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{new Date(review.createdAt).toLocaleDateString()}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
											<div className="flex items-center justify-end space-x-2">
												<button
													onClick={() => toggleReviewStatus(review.id)}
													className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
														review.isApproved
															? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
															: 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
													}`}
												>
													{review.isApproved ? (
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
															Reject
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
															Approve
														</>
													)}
												</button>
												<button
													onClick={() => deleteReview(review.id)}
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
							{Math.min(currentPage * itemsPerPage, totalReviews)} of {totalReviews}{' '}
							reviews
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
