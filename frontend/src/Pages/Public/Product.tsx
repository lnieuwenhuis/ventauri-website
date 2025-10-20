import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../../Components/Navbar';
import { useCart } from '../../Contexts/CartContext';
import usePageTitle from '../../hooks/usePageTitle';
import { useAuth } from '../../Contexts/AuthContext';

interface ProductVariant {
	id: string;
	sku: string;
	size: string;
	title: string;
	description: string;
	stock: number;
	priceAdjust: number;
	weight: number;
	isActive: boolean;
	images: string[];
}

interface Review {
	id: string;
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
	};
}

interface WishlistItem { id: string; productId: string; }

interface Product {
	id: string;
	name: string;
	description: string;
	price: number;
	categoryId: string;
	images: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	category?: {
		id: string;
		name: string;
	};
	variants?: ProductVariant[]; // legacy, not used
	reviews?: Review[];
	// New product-level fields
	enabledSizes?: string;
	options?: string;
	shippingPrices?: string;
}

export default function Product() {
	const { id } = useParams<{ id: string }>();
	const [product, setProduct] = useState<Product | null>(null);
	const [selectedSize, setSelectedSize] = useState<string | null>(null);
	const [customOptions, setCustomOptions] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const apiURL = import.meta.env.VITE_BACKEND_URL || '';
	const { addToCart, loading: cartLoading } = useCart();
	const [shippingModalOpen, setShippingModalOpen] = useState(false);
	const { isAuthenticated } = useAuth();
	const [wishlisted, setWishlisted] = useState(false);
	const [wishlistLoading, setWishlistLoading] = useState(false);
	usePageTitle(product?.name || 'Product');

	// Fetch product
	useEffect(() => {
		const fetchProduct = async () => {
			try {
				setLoading(true);
				setError(null);
				const response = await fetch(`${apiURL}/api/products/${id}`);
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const data = await response.json();
				setProduct(data.data);
			} catch (error) {
				console.error('Error fetching product:', error);
				setError(error instanceof Error ? error.message : 'Failed to load product');
			} finally {
				setLoading(false);
			}
		};

		if (id) {
			fetchProduct();
		}
	}, [id, apiURL]);

	// Fetch wishlist status for this product
	useEffect(() => {
		const checkWishlist = async () => {
			if (!isAuthenticated || !id) return;
			try {
				const res = await fetch(`${apiURL}/api/wishlist/`, { credentials: 'include' });
				if (!res.ok) return;
				const data = await res.json();
				const exists = Array.isArray(data.data) && data.data.some((w: WishlistItem) => String(w.productId) === String(id));
				setWishlisted(exists);
			} catch (e) { console.warn('Failed to check wishlist', e); }
		};
		checkWishlist();
	}, [isAuthenticated, id, apiURL]);

	const toggleWishlist = async () => {
		if (!product) return;
		if (!isAuthenticated) {
			// Redirect to login by navigating
			window.location.href = '/login';
			return;
		}
		try {
			setWishlistLoading(true);
			if (!wishlisted) {
				const res = await fetch(`${apiURL}/api/wishlist/`, {
					method: 'POST',
					credentials: 'include',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ productId: product.id }),
				});
				if (res.ok) setWishlisted(true);
			} else {
				const res = await fetch(`${apiURL}/api/wishlist/product/${product.id}`, {
					method: 'DELETE',
					credentials: 'include',
				});
				if (res.ok) setWishlisted(false);
			}
		} finally {
			setWishlistLoading(false);
		}
	};
	// Parse product-level sizes
	const sizeList = useMemo(() => {
		try {
			if (product?.enabledSizes) {
				const parsed = JSON.parse(product.enabledSizes);
				return Array.isArray(parsed) ? (parsed as string[]) : [];
			}
		} catch {
			return [];
		}
		return [];
	}, [product?.enabledSizes]);

	// Parse product options (labels)
	const optionLabels = useMemo(() => {
		try {
			if (product?.options) {
				const parsed = JSON.parse(product.options);
				if (Array.isArray(parsed)) {
					return parsed
						.map((v) => String(v))
						.filter((s) => s.trim().length > 0);
				}
			}
		} catch {
			return [];
		}
		return [];
	}, [product?.options]);

	// Compute validation state: require size if sizes exist, and all option labels filled
	const needsSize = sizeList.length > 0;
	const needsOptions = optionLabels.length > 0;
	const missingOptionLabels = useMemo(() => {
		return optionLabels.filter((label) => !customOptions[label] || !customOptions[label].trim());
	}, [optionLabels, customOptions]);
	const isFormValid = (needsSize ? !!selectedSize : true) && (!needsOptions || missingOptionLabels.length === 0);

	// Parse labeled shipping prices for display
	const shippingMap = useMemo(() => {
		try {
			if (product?.shippingPrices) {
				const parsed = JSON.parse(product.shippingPrices);
				if (Array.isArray(parsed)) {
					// Prefer array of objects: [{ label, price }] or [{ name|key, value }]
					if (parsed.every((obj) => obj && typeof obj === 'object' && !Array.isArray(obj))) {
						const map: Record<string, number> = {};
						(parsed as Array<Record<string, unknown>>).forEach((obj) => {
							const label = String(obj.label ?? obj.key ?? obj.name ?? '').trim();
							const priceVal = obj.price ?? obj.value;
							const n = typeof priceVal === 'number' ? priceVal : parseFloat(String(priceVal));
							if (label && !isNaN(n)) map[label] = n;
						});
						return map;
					}
					// Backward compatibility: array of numbers with default labels
					const labels = ['UK', 'EU', 'WW'];
					const arr = parsed.filter((v) => typeof v === 'number' || !isNaN(parseFloat(String(v))));
					const map: Record<string, number> = {};
					arr.slice(0, labels.length).forEach((v, i) => {
						const n = typeof v === 'number' ? v : parseFloat(String(v));
						if (!isNaN(n)) map[labels[i]] = n;
					});
					return map;
				}
				if (parsed && typeof parsed === 'object') {
					// Object mapping { label: price }
					const map: Record<string, number> = {};
					Object.entries(parsed as Record<string, unknown>).forEach(([label, val]) => {
						const n = typeof val === 'number' ? val : parseFloat(String(val));
						if (label && !isNaN(n)) map[label] = n;
					});
					return map;
				}
			}
		} catch {
			return {} as Record<string, number>;
		}
		return {} as Record<string, number>;
	}, [product?.shippingPrices]);

	// Handle size selection/deselection from product-level sizes
	const handleSizeClick = (size: string) => {
		if (selectedSize === size) {
			setSelectedSize(null);
		} else {
			setSelectedSize(size);
		}
	};

	// Add to cart with validation and include size as an option
	const handleAddToCart = async () => {
		if (!product) return;
		// Prevent adding when invalid
		if (!isFormValid) return;
		const optionsObject: Record<string, string> = { ...customOptions };
		if (needsSize && selectedSize) {
			optionsObject['Size'] = selectedSize;
		}
		await addToCart(product.id, 1, undefined, [optionsObject]);
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-900 text-white">
				<Navbar />
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
					<p>Loading product...</p>
				</div>
			</div>
		);
	}

	if (error || !product) {
		return (
			<div className="min-h-screen bg-gray-900 text-white">
				<Navbar />
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
					<p>{error || 'Product not found'}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-900 text-white">
			<Navbar />

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				{/* Breadcrumb */}
				<nav className="text-sm text-gray-400 mb-6">
					<ol className="list-reset flex">
						<li>
							<a href="/" className="text-gray-400 hover:text-white">
								Home
							</a>
						</li>
						<span className="mx-2">/</span>
						<li>
							<a href="/products" className="text-gray-400 hover:text-white">
								Products
							</a>
						</li>
						<span className="mx-2">/</span>
						<li className="text-ventauri">{product.name}</li>
					</ol>
				</nav>

				{/* Product Details */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
					{/* Images */}
					<div className="space-y-4">
						<div className="aspect-square overflow-hidden rounded-lg bg-gray-800">
							<img
								src={(() => {
								try {
									const arr = JSON.parse(product.images);
									return Array.isArray(arr) && arr.length > 0 ? arr[0] : '';
								} catch {
									return '';
								}
							})()}
							alt={product.name}
							className="w-full h-full object-cover"
							onError={(e) => {
								const target = e.target as HTMLImageElement;
								target.src = 'https://picsum.photos/600/600';
							}}
						/>
						</div>
					</div>

					{/* Product Info */}
					<div>
						<h1 className="text-3xl font-bold text-white mb-4">{product.name}</h1>
						<p className="text-gray-300 mb-6">{product.description}</p>
						<div className="mb-4">
							<span className="text-2xl font-bold text-ventauri">€{product.price.toFixed(2)}</span>
						</div>

						{/* Size selector (product-level sizes) */}
						{sizeList.length > 0 && (
							<div className="mb-6">
								<div className="text-sm text-gray-400 mb-2">Select Size</div>
								<div className="flex flex-wrap gap-2">
									{sizeList.map((size) => (
										<button
											key={size}
											onClick={() => handleSizeClick(size)}
											className={`px-4 py-2 rounded border transition-colors ${
												selectedSize === size
													? 'bg-ventauri text-black border-ventauri'
													: 'bg-gray-800 text-white border-gray-700 hover:border-gray-500'
											}`}
										>
											{size}
										</button>
									))}
								</div>
								{needsSize && !selectedSize && (
									<div className="mt-2 text-sm text-red-400">Please select a size before adding to cart.</div>
								)}
							</div>
						)}

						{/* Customization options */}
						{optionLabels.length > 0 && (
							<div className="mb-6">
								<div className="text-sm text-gray-400 mb-2">Customizations</div>
								<div className="space-y-3">
									{optionLabels.map((label) => (
										<div key={label}>
											<label className="block text-sm text-gray-300 mb-1">{label}</label>
											<input
												type="text"
												className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-ventauri"
												value={customOptions[label] || ''}
												onChange={(e) =>
													setCustomOptions((prev) => ({ ...prev, [label]: e.target.value }))
												}
											/>
											{(!customOptions[label] || !customOptions[label].trim()) && (
												<div className="mt-1 text-xs text-red-400">Required</div>
											)}
										</div>
									))}
								</div>
								{needsOptions && missingOptionLabels.length > 0 && (
									<div className="mt-2 text-sm text-red-400">Please fill all customization fields.</div>
								)}
						</div>
						)}

						{/* Actions */}
						<div className="mt-8 flex flex-col sm:flex-row gap-3">
							<button
								onClick={handleAddToCart}
								disabled={cartLoading || !isFormValid}
								className="bg-ventauri text-black px-6 py-3 rounded font-semibold hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{cartLoading ? 'Adding...' : 'Add to Cart'}
							</button>
							<button
								onClick={() => setShippingModalOpen(true)}
								className="border border-ventauri text-ventauri px-6 py-3 rounded font-semibold hover:bg-ventauri hover:text-black transition-colors"
							>
								View Shipping Prices
							</button>
							<button
								onClick={toggleWishlist}
								disabled={wishlistLoading}
								className={`px-6 py-3 rounded font-semibold transition-colors ${wishlisted ? 'bg-gray-700 text-white' : 'border border-ventauri text-ventauri hover:bg-ventauri hover:text-black'}`}
							>
								{wishlistLoading ? '...' : wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
							</button>
						</div>

						{/* Shipping modal */}
						{shippingModalOpen && (
							<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
								<div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-md p-6">
									<div className="flex items-center justify-between mb-4">
										<h2 className="text-lg font-semibold text-white">Shipping Prices</h2>
										<button
											onClick={() => setShippingModalOpen(false)}
											className="text-gray-400 hover:text-white"
										>
											Close
										</button>
									</div>
									<div className="space-y-2">
										{Object.keys(shippingMap).length === 0 ? (
											<div className="text-gray-400">No shipping prices available</div>
										) : (
											Object.entries(shippingMap).map(([label, price]) => (
												<div key={label} className="flex justify-between text-gray-300">
													<span>{label}</span>
													<span>€{price.toFixed(2)}</span>
												</div>
											))
										)}
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
