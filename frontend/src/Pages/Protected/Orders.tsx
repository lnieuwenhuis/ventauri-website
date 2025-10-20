import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../Contexts/AuthContext';
import { useCart } from '../../Contexts/CartContext';
import Navbar from '../../Components/Navbar';
import { Link } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';

interface Product {
    id: string;
    name: string;
    images: string;
    price: number;
}

interface OrderItem {
    id: string;
    order_id: string;
    product_id: string;
    product_variant_id?: string | null;
    quantity: number;
    unit_price: number;
    subtotal: number;
    product?: Product;
    product_variant?: {
        id: string;
        title: string;
        description: string;
        size: string;
        price_adjust: number;
    };
    options?: string; // JSON string of customization options
}

interface Order {
    id: string;
    created_at: string;
    updated_at: string;
    user_id: string;
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    status: string;
    order_number: string;
    shipping_address_id?: string;
    billing_address_id?: string;
    payment_method_id?: string | null;
    shipping_estimate?: string;
    items: OrderItem[];
}

// New: Review type
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
}

const Orders: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();
    const { clearCart, refreshCart } = useCart();
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
    const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
    const cartClearedRef = useRef(false);
    // New: review states
    const [userReviews, setUserReviews] = useState<Review[]>([]);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewError, setReviewError] = useState<string | null>(null);
    const [reviewForm, setReviewForm] = useState<{ rating: number; title: string; comment: string; orderId?: string; productId?: string; reviewId?: string }>({ rating: 5, title: '', comment: '' });
	usePageTitle('Orders');

	const API_BASE_URL =
		import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

	const parseImages = (imagesString: string): string[] => {
		try {
			return JSON.parse(imagesString);
		} catch {
			return [];
		}
	};

	// Parse customization options JSON string to array of objects
	const parseOptions = (options?: string): Array<Record<string, unknown>> => {
		const isPlainObject = (o: unknown): o is Record<string, unknown> => {
			return !!o && typeof o === 'object' && !Array.isArray(o);
		};
		const filterObjectArray = (arr: unknown[]): Array<Record<string, unknown>> => {
			return arr.filter(isPlainObject) as Array<Record<string, unknown>>;
		};

		if (!options || options.trim() === '') return [];
		try {
			const first = JSON.parse(options);
			if (Array.isArray(first)) {
				return filterObjectArray(first);
			}
			if (typeof first === 'string') {
				// Handle double-encoded JSON string case
				try {
					const second = JSON.parse(first);
					if (Array.isArray(second)) {
						return filterObjectArray(second);
					}
				} catch {
					return [];
				}
			}
			if (isPlainObject(first)) {
				return [first];
			}
		} catch {
			// Ignore parse errors and return empty list
		}
		return [];
	};

	const fetchOrders = async (page: number = 1) => {
		try {
			setLoading(true);
			const response = await fetch(
				`${API_BASE_URL}/api/orders/?page=${page}&limit=10`,
				{
					credentials: 'include',
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
					},
				}
			);

			if (!response.ok) {
				throw new Error('Failed to fetch orders');
			}

			const data = await response.json();
			setOrders(data.data || []);
			setTotalPages(Math.ceil((data.total || 0) / 10));
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
		} finally {
			setLoading(false);
		}
	};

    // New: fetch user reviews
    const fetchUserReviews = async () => {
        try {
            const resp = await fetch(`${API_BASE_URL}/api/reviews/my?page=1&limit=100`, {
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!resp.ok) return;
            const data = await resp.json();
            setUserReviews(Array.isArray(data.data) ? data.data : []);
        } catch {
            // ignore
        }
    };

    useEffect(() => {
        // Show a banner if redirected back from Stripe
        const params = new URLSearchParams(location.search);
        const redirectStatus = params.get('redirect_status');
        if (redirectStatus === 'succeeded') {
            setPaymentMessage('Payment succeeded. Your order is being processed.');
            // Clear cart on first load after successful payment
            if (!cartClearedRef.current) {
                cartClearedRef.current = true;
                clearCart().finally(() => {
                    refreshCart();
                    try { localStorage.removeItem('checkout_order_ids'); } catch { /* ignore */ }
                });
            }
        } else if (redirectStatus === 'failed' || redirectStatus === 'canceled') {
            setPaymentMessage('Payment did not complete. You can try again.');
        } else {
            setPaymentMessage(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]);

    // Poll backend to confirm PaymentIntent and update order status if needed
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const pi = params.get('payment_intent');
        const redirectStatus = params.get('redirect_status');
        if (!pi || redirectStatus !== 'succeeded') return;

        let cancelled = false;
        let tries = 0;

        const tick = async () => {
            if (cancelled || tries > 6) return; // ~6s
            tries += 1;
            try {
                const resp = await fetch(`${API_BASE_URL}/api/checkout/confirm?payment_intent=${encodeURIComponent(pi)}`, {
                    credentials: 'include',
                });
                if (resp.ok) {
                    const data: { data?: Array<{ status?: string }> } = await resp.json();
                    const statuses: string[] = Array.isArray(data.data) ? data.data.map((o) => (o.status || '').toLowerCase()) : [];
                    if (statuses.some((s) => s === 'processing' || s === 'succeeded' || s === 'paid')) {
                        await fetchOrders(currentPage);
                        return;
                    }
                }
            } catch { /* ignore transient network errors while polling */ }
            setTimeout(tick, 1000);
        };

        tick();
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]);

    useEffect(() => {
        if (user) {
            fetchOrders(currentPage);
            fetchUserReviews();
        }
        // eslint-disable-next-line
    }, [user, currentPage]);

    const openReviewModal = (orderId: string, productId: string) => {
        const existing = userReviews.find(r => r.orderId === orderId && r.productId === productId);
        if (existing) {
            setReviewForm({ rating: existing.rating, title: existing.title, comment: existing.comment, orderId, productId, reviewId: existing.id });
        } else {
            setReviewForm({ rating: 5, title: '', comment: '', orderId, productId });
        }
        setReviewError(null);
        setReviewModalOpen(true);
    };

    const closeReviewModal = () => { setReviewModalOpen(false); setReviewError(null); };

    const submitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reviewForm.orderId || !reviewForm.productId) return;
        try {
            setReviewLoading(true);
            const isEdit = !!reviewForm.reviewId;
            const url = isEdit ? `${API_BASE_URL}/api/reviews/${reviewForm.reviewId}` : `${API_BASE_URL}/api/reviews/`;
            const method = isEdit ? 'PUT' : 'POST';
            const body = isEdit ? { rating: reviewForm.rating, title: reviewForm.title, comment: reviewForm.comment } : { orderId: reviewForm.orderId, productId: reviewForm.productId, rating: reviewForm.rating, title: reviewForm.title, comment: reviewForm.comment };
            const resp = await fetch(url, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (!resp.ok) {
                const msg = await resp.json().catch(() => ({} as Record<string, unknown>));
                throw new Error((msg as { error?: string })?.error || `Failed to ${isEdit ? 'update' : 'create'} review`);
            }
            const resJson = await resp.json();
            const newReview: Review = resJson.data;
            if (isEdit) {
                setUserReviews(prev => prev.map(r => r.id === newReview.id ? newReview : r));
            } else {
                setUserReviews(prev => [newReview, ...prev]);
            }
            setReviewModalOpen(false);
        } catch (err) {
            setReviewError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setReviewLoading(false);
        }
    };

	const getStatusColor = (status: string) => {
		switch (status.toLowerCase()) {
			case 'pending':
				return 'bg-yellow-900 text-ventauri';
			case 'processing':
				return 'bg-blue-900 text-blue-300';
			case 'shipped':
				return 'bg-purple-900 text-purple-300';
			case 'delivered':
				return 'bg-green-900 text-green-300';
            case 'completed':
                return 'bg-green-900 text-green-300';
			case 'cancelled':
				return 'bg-red-900 text-red-300';
			default:
				return 'bg-gray-700 text-gray-300';
		}
	};

	if (!user) {
		return (
			<div className="min-h-screen bg-gray-900 text-white">
				<Navbar />
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div className="text-center py-20">
						<p className="text-gray-400 text-lg">
							Please log in to view your orders.
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
						<span className="text-white">ORDER</span>
						<span className="text-ventauri ml-2">HISTORY</span>
					</h1>
					<p className="text-gray-300 text-lg">Track and manage your orders</p>
				</div>

                {paymentMessage && (
                    <div className="mb-6 p-4 rounded-md border border-gray-700 bg-gray-800 text-gray-100">
                        {paymentMessage}
                    </div>
                )}

				{loading ? (
					<div className="flex justify-center items-center py-20">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ventauri"></div>
					</div>
				) : error ? (
					<div className="bg-red-900/20 border border-red-800 rounded-lg p-6">
						<div className="flex items-center">
							<svg
								className="w-6 h-6 text-red-400 mr-3"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<div>
								<h3 className="text-lg font-medium text-red-300">
									Error Loading Orders
								</h3>
								<p className="text-red-400 mt-1">{error}</p>
							</div>
						</div>
					</div>
				) : orders.length === 0 ? (
					<div className="text-center py-20">
						<div className="bg-gray-800 rounded-lg p-12 max-w-md mx-auto">
							<svg
								className="mx-auto h-16 w-16 text-gray-400 mb-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={1}
									d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
								/>
							</svg>
							<h3 className="text-xl font-semibold text-white mb-2">
								No Orders Found
							</h3>
							<p className="text-gray-400 mb-6">
								You haven't placed any orders yet. Start shopping to see your orders
								here!
							</p>
							<Link
								to="/products"
								className="inline-flex items-center bg-ventauri text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors duration-200"
							>
								Start Shopping
							</Link>
						</div>
					</div>
				) : (
					<React.Fragment>
						<div className="space-y-6">
							{orders.map((order) => (
								<div
									key={order.id}
									className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors duration-200"
								>
									<div className="px-6 py-4 border-b border-gray-700">
										<div className="flex items-center justify-between">
											<div>
												<h3 className="text-lg font-semibold text-white">
													Order #{(order.order_number || order.id.slice(0, 8)).toUpperCase()}
												</h3>
												<p className="text-gray-400">
													Placed on{' '}
													{new Date(order.created_at).toLocaleDateString('en-US', {
														year: 'numeric',
														month: 'long',
														day: 'numeric',
													})}
												</p>
											</div>
                                        <div className="text-right">
                                            <span
                                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(
                                                    order.status
                                                )}`}
                                            >
                                                {order.status}
                                            </span>
                                            {order.status === 'shipped' && order.shipping_estimate && (
                                                <div className="mt-2 text-xs text-gray-400">
                                                    Estimated delivery: {order.shipping_estimate}
                                                </div>
                                            )}
                                        </div>
										</div>
									</div>

									<div className="px-6 py-6">
										{order.items && order.items.length > 0 ? (
											<div className="space-y-4">
												{order.items.map((item) => {
											const productImages = item.product?.images
												? parseImages(item.product.images)
												: [];
											const firstImage = productImages.length > 0 ? productImages[0] : null;
											const optionList = parseOptions(item.options);
											const productIdForReview = item.product?.id || item.product_id;
											
											return (
												<div key={item.id} className="flex items-center space-x-6">
													<div className="flex-shrink-0">
														{firstImage ? (
															<img
																className="h-20 w-20 rounded-lg object-cover border border-gray-600"
																src={firstImage}
																alt={item.product?.name || 'Product'}
															/>
														) : (
															<div className="h-20 w-20 rounded-lg bg-gray-700 flex items-center justify-center border border-gray-600">
																<span className="text-3xl text-ventauri">📦</span>
															</div>
														)}
													</div>
													<div className="flex-1 min-w-0">
														<h4 className="text-lg font-medium text-white mb-1">
															{item.product?.name || 'Product'}
														</h4>
														<div className="flex items-center space-x-4 text-gray-400">
															<span>Qty: {item.quantity}</span>
															{item.product_variant && (
																<>
																	<span>•</span>
																	<span>Size: {item.product_variant.size}</span>
																	<span>•</span>
																	<span>{item.product_variant.title}</span>
																</>
															)}
															<span>•</span>
															<span>€{item.unit_price.toFixed(2)} each</span>
														</div>
														{optionList.length > 0 && (
															<div className="mt-2">
																<span className="text-gray-400">Customizations:</span>
																<div className="mt-1 space-y-1">
																	{optionList.map((optObj, idx) => (
																		<div key={idx}>
																			{Object.entries(optObj).map(([k, v]) => (
																				<div key={k} className="text-gray-300">
																					<span className="text-gray-400">{k}:</span> {String(v)}
																				</div>
																			))}
																		</div>
																	))}
																</div>
															</div>
														)}
														{/* New: Review button for delivered/completed orders */}
									{['delivered', 'completed'].includes(order.status.toLowerCase()) && (
										<div className="mt-3">
											<button
												onClick={() => openReviewModal(order.id, productIdForReview)}
												className="inline-flex items-center bg-ventauri text-black px-3 py-1 rounded-lg font-semibold hover:bg-yellow-300 transition-colors duration-200"
											>
												{userReviews.some(r => r.orderId === order.id && r.productId === productIdForReview) ? 'Edit Review' : 'Write Review'}
											</button>
										</div>
									)}
													</div>
													<div className="text-right">
														<p className="text-lg font-bold text-ventauri">€{item.subtotal.toFixed(2)}</p>
													</div>
												</div>
											);
										})}
						</div>
					) : (
						<div className="text-center text-gray-400 py-4">
							No items found for this order
						</div>
					)}
					
					<div className="mt-6 pt-4 border-t border-gray-700">
						<div className="flex justify-between items-center">
							<div className="text-gray-400">
								<p>Subtotal: €{order.subtotal.toFixed(2)}</p>
								<p>Shipping: €{order.shipping.toFixed(2)}</p>
							</div>
							<div className="text-right">
								<p className="text-2xl font-bold text-ventauri">
									€{order.total.toFixed(2)}
								</p>
								<p className="text-gray-400 text-sm">Total</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		))}
	</div>

{totalPages > 1 && (
	<div className="mt-12 flex justify-center">
		<nav className="flex items-center space-x-2">
			<button
				onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
				disabled={currentPage === 1}
				className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
			>
				Previous
			</button>

			{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
				<button
					key={page}
					onClick={() => setCurrentPage(page)}
					className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
						page === currentPage
							? 'bg-ventauri text-black'
							: 'bg-gray-800 text-gray-300 hover:bg-gray-700'
					}`}
				>
					{page}
				</button>
			))}

			<button
				onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
				disabled={currentPage === totalPages}
				className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
			>
				Next
			</button>
		</nav>
	</div>
)}


{/* New: Review Modal */}
{reviewModalOpen && (
	<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		<div className="bg-gray-800 border border-gray-700 rounded-lg w-full max-w-lg p-6">
			<h3 className="text-xl font-semibold text-white mb-4">{reviewForm.reviewId ? 'Edit Review' : 'Write Review'}</h3>
			{reviewError && (
				<div className="mb-3 text-red-400">{reviewError}</div>
			)}
			<form onSubmit={submitReview} className="space-y-4">
				<div>
					<label className="block text-gray-300 mb-1">Rating</label>
					<select
						value={reviewForm.rating}
						onChange={(e) => setReviewForm((f) => ({ ...f, rating: Number(e.target.value) }))}
						className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
					>
						{[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
					</select>
				</div>
				<div>
					<label className="block text-gray-300 mb-1">Title</label>
					<input
						type="text"
						value={reviewForm.title}
						onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
						className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
						required
					/>
				</div>
				<div>
					<label className="block text-gray-300 mb-1">Comment</label>
					<textarea
						value={reviewForm.comment}
						onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
						className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white min-h-[120px]"
						required
					/>
				</div>
				<div className="flex justify-end gap-3 pt-2">
					<button type="button" onClick={closeReviewModal} className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600">Cancel</button>
					<button type="submit" disabled={reviewLoading} className="px-4 py-2 bg-ventauri text-black rounded hover:bg-yellow-300 disabled:opacity-50">
						{reviewLoading ? 'Saving…' : 'Save Review'}
					</button>
				</div>
			</form>
		</div>
	</div>
)}
</React.Fragment>
)}
</div>
</div>
);
};

export default Orders;
