import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../Contexts/AuthContext';
import Navbar from '../../Components/Navbar';
import { Link } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';

interface Product {
    id: string;
    name: string;
    images: string;
    price: number;
}

interface Order {
    id: string;
    created_at: string;
    updated_at: string;
    user_id: string;
    product_id: string;
    product_variant_id?: string | null;
    quantity: number;
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    status: string;
    order_number: string;
    shipping_address_id?: string;
    billing_address_id?: string;
    payment_method_id?: string | null;
    product?: Product;
}

const Orders: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
    const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
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

    useEffect(() => {
        // Show a banner if redirected back from Stripe
        const params = new URLSearchParams(location.search);
        const redirectStatus = params.get('redirect_status');
        if (redirectStatus === 'succeeded') {
            setPaymentMessage('Payment succeeded. Your order is being processed.');
        } else if (redirectStatus === 'failed' || redirectStatus === 'canceled') {
            setPaymentMessage('Payment did not complete. You can try again.');
        } else {
            setPaymentMessage(null);
        }
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
                        return; // stop polling once updated
                    }
                }
            } catch {
                // ignore transient network errors while polling
            }
            setTimeout(tick, 1000);
        };

        tick();
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]);

    useEffect(() => {
        if (user) {
            fetchOrders(currentPage);
        }
        // eslint-disable-next-line
    }, [user, currentPage]);

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
					<>
						<div className="space-y-6">
							{orders.map((order) => {
								const productImages = order.product?.images
									? parseImages(order.product.images)
									: [];
								const firstImage = productImages.length > 0 ? productImages[0] : null;

                                return (
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
												<span
													className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(
														order.status
													)}`}
												>
													{order.status}
												</span>
											</div>
										</div>

										<div className="px-6 py-6">
											<div className="flex items-center space-x-6">
												<div className="flex-shrink-0">
													{firstImage ? (
														<img
															className="h-20 w-20 rounded-lg object-cover border border-gray-600"
															src={firstImage}
															alt={order.product?.name || 'Product'}
														/>
													) : (
														<div className="h-20 w-20 rounded-lg bg-gray-700 flex items-center justify-center border border-gray-600">
															<span className="text-3xl text-ventauri">📦</span>
														</div>
													)}
												</div>
												<div className="flex-1 min-w-0">
													<h4 className="text-lg font-medium text-white mb-1">
														{order.product?.name || 'Product'}
													</h4>
													<div className="flex items-center space-x-4 text-gray-400">
														<span>Qty: {order.quantity}</span>
														<span>•</span>
                                                        <span>€{(order.product?.price ?? 0).toFixed(2)} each</span>
													</div>
												</div>
												<div className="text-right">
													<p className="text-2xl font-bold text-ventauri">
                                                        €{(order.total ?? (order.product?.price ?? 0) * order.quantity).toFixed(2)}
													</p>
													<p className="text-gray-400 text-sm">Total</p>
												</div>
											</div>
										</div>
									</div>
								);
							})}
						</div>

						{/* Pagination */}
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
					</>
				)}
			</div>
		</div>
	);
};

export default Orders;
