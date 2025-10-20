import { Link } from 'react-router-dom';
import Navbar from '../../Components/Navbar';
import { useCart } from '../../Contexts/CartContext';
import { useAuth } from '../../Contexts/AuthContext';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';

export default function Cart() {
	const { items, total, loading, updateQuantity, removeFromCart, clearCart, appliedCouponCode, couponDiscount, applyCoupon, clearCoupon, appliedCoupon } =
		useCart();
	const { isAuthenticated } = useAuth();
	const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
	const [isOperationLoading, setIsOperationLoading] = useState(false);
    usePageTitle('Cart');
	const navigate = useNavigate();

	// Coupon UI state
	const [couponInput, setCouponInput] = useState<string>('');
	const [couponMessage, setCouponMessage] = useState<string>('');
	const [couponError, setCouponError] = useState<string>('');

	// Derived totals
	const displaySubtotal = total;
	const displayDiscount = couponDiscount || 0;
	const displayTotal = Math.max(0, displaySubtotal - displayDiscount);

	const onApplyCoupon = async () => {
		setCouponMessage('');
		setCouponError('');
		try {
			const result = await applyCoupon?.(couponInput.trim());
			if (result) {
				setCouponMessage(`Coupon applied${appliedCoupon?.type === 'free_shipping' ? ' (free shipping at checkout)' : ''}.`);
			}
		} catch (e: unknown) {
			if (e instanceof Error) {
				setCouponError(e.message);
			} else {
				setCouponError('An unknown error occurred.');
			}
		}
	};

	const onClearCoupon = () => {
		clearCoupon?.();
		setCouponInput('');
		setCouponMessage('');
		setCouponError('');
	};

	const parseImages = (images: string): string[] => {
		try {
			if (images && images.trim()) {
				const parsed = JSON.parse(images);
				return Array.isArray(parsed) ? parsed : [];
			}
		} catch {
			// ignore
		}
		return [];
	};

	const handleUpdateQuantity = async (itemId: string, quantity: number) => {
		setUpdatingItems((prev) => new Set(prev).add(itemId));
		setIsOperationLoading(true);
		try {
			await updateQuantity(itemId, quantity);
		} finally {
			setUpdatingItems((prev) => {
				const newSet = new Set(prev);
				newSet.delete(itemId);
				return newSet;
			});
			setIsOperationLoading(false);
		}
	};

	const handleRemoveFromCart = async (itemId: string) => {
		setIsOperationLoading(true);
		try {
			await removeFromCart(itemId);
		} finally {
			setIsOperationLoading(false);
		}
	};

	const handleClearCart = async () => {
		setIsOperationLoading(true);
		try {
			await clearCart();
		} finally {
			setIsOperationLoading(false);
		}
	};

	if (!isAuthenticated) {
		return (
			<div className="min-h-screen bg-gray-900 text-white">
				<Navbar />
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div className="text-center py-12">
						<h2 className="text-2xl font-bold mb-4">
							Please log in to view your cart
						</h2>
						<Link
							to="/login"
							className="bg-ventauri text-black px-6 py-3 rounded-lg font-medium hover:bg-yellow-300 transition-colors"
						>
							Sign In
						</Link>
					</div>
				</div>
			</div>
		);
	}

	// Only show loading screen on initial load, not during updates
	if (loading && items.length === 0) {
		return (
			<div className="min-h-screen bg-gray-900 text-white">
				<Navbar />
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<p>Loading cart...</p>
				</div>
			</div>
		);
	}

	if (items.length === 0) {
		return (
			<div className="min-h-screen bg-gray-900 text-white">
				<Navbar />
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div className="bg-gray-800 rounded-lg p-6 text-center">
						<h2 className="text-2xl font-bold mb-3">Your cart is empty</h2>
						<p className="text-gray-300 mb-6">Sign in to save items to your cart.</p>
						<div className="flex justify-center gap-4">
							<Link to="/products" className="bg-ventauri text-black px-6 py-3 rounded-lg font-medium hover:bg-yellow-300 transition-colors">Shop Now</Link>
							<Link to="/" className="bg-gray-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors">Home</Link>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-900 text-white">
			<Navbar />
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="mb-8">
					<h1 className="text-4xl font-bold mb-4">
						<span className="text-white">SHOPPING</span>
						<span className="text-ventauri ml-2">CART</span>
					</h1>
					<p className="text-gray-300 text-lg">Review your items before checkout</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Cart Items */}
					<div className="lg:col-span-2 space-y-4">
						{items.map((item) => {
							const productImages = parseImages(item.product.images);
							const mainImage =
								productImages.length > 0
									? productImages[0]
									: 'https://picsum.photos/400/400';
							const isItemUpdating = updatingItems.has(item.id);

							return (
								<div
									key={item.id}
									className={`bg-gray-800 rounded-lg p-6 transition-opacity ${
										isItemUpdating ? 'opacity-70' : 'opacity-100'
									}`}
								>
									<div className="flex items-center space-x-4">
										{/* Product Image */}
										<div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-700">
											<img
												src={mainImage}
												alt={item.product.name}
												className="w-full h-full object-cover"
												onError={(e) => {
													const target = e.target as HTMLImageElement;
													target.src = 'https://picsum.photos/400/400';
												}}
											/>
										</div>

										{/* Product Info */}
										<div className="flex-1">
											<div className="flex items-center flex-wrap gap-2 mb-1">
												<h3 className="text-lg font-semibold text-white">
													<Link
														to={`/product/${item.product.id}`}
														className="hover:text-ventauri transition-colors"
													>
														{item.product.name}
													</Link>
												</h3>

											</div>
											{item.product.category && (
												<p className="text-sm text-ventauri mb-2">
													{item.product.category.name}
												</p>
											)}
											<p className="text-xl font-bold text-ventauri">
												€{(item.product.price + (item.productVariant?.priceAdjust || 0)).toFixed(2)}
											</p>
											{item.productVariant && (
												<p className="text-sm text-gray-400">
													Size: {item.productVariant.size} • {item.productVariant.title}
												</p>
											)}
                                            {item.options && item.options.length > 0 && (
                                                <div className="mt-2 text-sm text-gray-300">
                                                    <span className="text-gray-400">Customizations:</span>
                                                    <div className="mt-1 space-y-1">
                                                        {item.options.map((optObj, idx) => (
                                                            <div key={idx}>
                                                                {Object.entries(optObj).map(([k, v]) => (
                                                                    <div key={k}>
                                                                        <span className="text-gray-400">{k}:</span> {v}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
										</div>

										{/* Quantity Controls */}
										<div className="flex items-center space-x-3">
											<button
												onClick={() =>
													handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1))
												}
												disabled={isItemUpdating}
												className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
											>
												{isItemUpdating ? (
													<div className="animate-spin rounded-full h-4 w-4 border-b border-white"></div>
												) : (
													'-'
												)}
											</button>
											<span className="w-8 text-center font-medium">{item.quantity}</span>
											<button
												onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
												disabled={isItemUpdating}
												className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
											>
												{isItemUpdating ? (
													<div className="animate-spin rounded-full h-4 w-4 border-b border-white"></div>
												) : (
													'+'
												)}
											</button>
										</div>

										{/* Item Total */}
										<div className="text-right">
											<p className="text-lg font-bold text-white">
												€{((item.product.price + (item.productVariant?.priceAdjust || 0)) * item.quantity).toFixed(2)}
											</p>
										</div>

										{/* Remove Button */}
										<button
											onClick={() => handleRemoveFromCart(item.id)}
											disabled={isOperationLoading}
											className="text-red-400 hover:text-red-300 p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
										>
											<svg
												className="w-5 h-5"
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
										</button>
									</div>
								</div>
							);
						})}
					</div>

					{/* Order Summary */}
					<div className="lg:col-span-1">
						<div className="bg-gray-800 rounded-lg p-6 sticky top-24">
							<h3 className="text-xl font-semibold mb-6 text-ventauri">
								Order Summary
							</h3>

                            <div className="space-y-4 mb-6">
                                {/* Coupon input */}
                                <div className="mb-2">
                                    <label htmlFor="coupon" className="block text-sm mb-2">Coupon Code</label>
                                    <div className="flex gap-2 items-center">
                                        <div className="relative flex-1">
                                            <input
                                                id="coupon"
                                                type="text"
                                                value={couponInput}
                                                onChange={(e) => setCouponInput(e.target.value)}
                                                className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 pr-8"
                                                placeholder="Enter coupon"
                                            />
                                            {appliedCouponCode && (
                                                <button
                                                    type="button"
                                                    onClick={onClearCoupon}
                                                    aria-label="Clear coupon"
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-400 font-bold"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                        <button onClick={onApplyCoupon} className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700">Apply</button>
                                    </div>
                                    {couponMessage && (<p className="text-green-400 text-sm mt-2">{couponMessage}</p>)}
                                    {couponError && (<p className="text-red-400 text-sm mt-2">{couponError}</p>)}
                                </div>

                                <div className="flex justify-between">
                                    <span>Subtotal ({items.length} items)</span>
                                    <span>€{displaySubtotal.toFixed(2)}</span>
                                </div>
                                {appliedCouponCode && displayDiscount > 0 && (
                                    <div className="flex justify-between text-green-400">
                                        <span>Coupon ({appliedCouponCode})</span>
                                        <span>-€{displayDiscount.toFixed(2)}</span>
                                    </div>
                                )}
                                {appliedCoupon?.type === 'free_shipping' && (
                                    <div className="text-xs text-green-300">Free shipping will apply at checkout.</div>
                                )}
                                <div className="border-t border-gray-700 pt-4">
                                    <div className="flex justify-between text-lg font-bold text-white">
                                        <span>Total <span className="text-xs text-gray-400">(Inc. VAT)</span></span>
                                        <span className="text-ventauri">€{displayTotal.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
								<button
									disabled={isOperationLoading}
                                    onClick={() => navigate('/checkout')}
                                    className="w-full bg-ventauri text-black py-3 rounded-lg font-medium hover:bg-bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-600 disabled:text-gray-400"
								>
									{isOperationLoading ? (
										<div className="flex items-center justify-center">
											<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
											Processing...
										</div>
									) : (
										'Proceed to Checkout'
									)}
								</button>
								<Link
									to="/products"
									className="block w-full text-center bg-gray-700 text-white py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
								>
									Continue Shopping
								</Link>
								<button
									onClick={handleClearCart}
									disabled={isOperationLoading}
									className="w-full text-red-400 hover:text-red-300 py-2 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isOperationLoading ? 'Clearing...' : 'Clear Cart'}
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
