import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../../Components/Navbar';
import { Link } from 'react-router-dom';
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
	variants?: ProductVariant[];
	// Selection-relevant fields from backend
	enabledSizes?: string;
	options?: string;
}

interface Category {
	id: string;
	name: string;
}

interface ProductsResponse {
	data: Product[];
	total: number;
	page: number;
	limit: number;
}

interface WishlistItem { id: string; productId: string; }

// In the component
export default function Products() {
	usePageTitle('Shop');
	const [products, setProducts] = useState<Product[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<string>('');
	const [sortBy, setSortBy] = useState<string>('newest');
	const [currentPage, setCurrentPage] = useState(1);
	const [totalProducts, setTotalProducts] = useState(0);
	const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({
		min: 0,
		max: 1000,
	});
	const [searchParams, setSearchParams] = useSearchParams();

	// Variant selection popup state
	const [showVariantPopup, setShowVariantPopup] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [selectedSize, setSelectedSize] = useState<string | null>(null);
	const [selectedVariantTitle, setSelectedVariantTitle] = useState<string | null>(null);

	const itemsPerPage = 12;
	const apiURL = import.meta.env.VITE_BACKEND_URL || '';

	const { addToCart, loading: cartLoading } = useCart();
	const { isAuthenticated } = useAuth();
	const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
	const [wishlistLoadingId, setWishlistLoadingId] = useState<string | null>(null);

	// Fetch wishlist to mark toggles
	useEffect(() => {
		const fetchWishlist = async () => {
			if (!isAuthenticated) return;
			try {
				const res = await fetch(`${apiURL}/api/wishlist/`, { credentials: 'include' });
				if (!res.ok) return;
				const data = await res.json();
				const ids = new Set<string>((data.data || []).map((w: WishlistItem) => String(w.productId)));
				setWishlistIds(ids);
			} catch (e) { console.warn('Failed to fetch wishlist', e); }
		};
		fetchWishlist();
	}, [isAuthenticated, apiURL]);

	const toggleWishlist = async (productId: string, e?: React.MouseEvent) => {
		if (e) { e.preventDefault(); e.stopPropagation(); }
		if (!isAuthenticated) { window.location.href = '/login'; return; }
		try {
			setWishlistLoadingId(productId);
			if (!wishlistIds.has(productId)) {
				const res = await fetch(`${apiURL}/api/wishlist/`, {
					method: 'POST',
					credentials: 'include',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ productId }),
				});
				if (res.ok) setWishlistIds((prev) => new Set([...prev, productId]));
			} else {
				const res = await fetch(`${apiURL}/api/wishlist/product/${productId}`, {
					method: 'DELETE',
					credentials: 'include',
				});
				if (res.ok) setWishlistIds((prev) => { const next = new Set([...prev]); next.delete(productId); return next; });
			}
		} finally {
			setWishlistLoadingId(null);
		}
	};

	// Helper to detect if selection is required
	const parseList = (json?: string): string[] => {
		try {
			if (json && json.trim()) {
				const parsed = JSON.parse(json);
				if (Array.isArray(parsed)) {
					return parsed.map((v) => String(v)).filter((s) => s.trim().length > 0);
				}
			}
		} catch (err) {
			void err;
		}
		return [];
	};
	const requiresSelection = (p: Product): boolean => {
		return parseList(p.enabledSizes).length > 0 || parseList(p.options).length > 0;
	};

	// Variant selection logic (same as Product.tsx)
	const getSelectedVariant = (): ProductVariant | null => {
		if (!selectedProduct?.variants || !selectedSize || !selectedVariantTitle)
			return null;
		return (
			selectedProduct.variants.find(
				(v) => v.size === selectedSize && v.title === selectedVariantTitle
			) || null
		);
	};

	const isSizeAvailable = (size: string): boolean => {
		if (!selectedProduct?.variants) return false;
		if (!selectedVariantTitle) {
			return selectedProduct.variants.some((v) => v.size === size && v.stock > 0);
		}
		return selectedProduct.variants.some(
			(v) => v.size === size && v.title === selectedVariantTitle && v.stock > 0
		);
	};

	const isVariantTitleAvailable = (title: string): boolean => {
		if (!selectedProduct?.variants) return false;
		if (!selectedSize) {
			return selectedProduct.variants.some(
				(v) => v.title === title && v.stock > 0
			);
		}
		return selectedProduct.variants.some(
			(v) => v.title === title && v.size === selectedSize && v.stock > 0
		);
	};

	const handleSizeClick = (size: string) => {
		if (selectedSize === size) {
			setSelectedSize(null);
		} else if (isSizeAvailable(size)) {
			setSelectedSize(size);
			if (
				selectedVariantTitle &&
				!selectedProduct?.variants?.some(
					(v) => v.size === size && v.title === selectedVariantTitle && v.stock > 0
				)
			) {
				setSelectedVariantTitle(null);
			}
		}
	};

	const handleVariantTitleClick = (title: string) => {
		if (selectedVariantTitle === title) {
			setSelectedVariantTitle(null);
		} else if (isVariantTitleAvailable(title)) {
			setSelectedVariantTitle(title);
			if (
				selectedSize &&
				!selectedProduct?.variants?.some(
					(v) => v.title === title && v.size === selectedSize && v.stock > 0
				)
			) {
				setSelectedSize(null);
			}
		}
	};

	const clearSelections = () => {
		setSelectedSize(null);
		setSelectedVariantTitle(null);
	};

	const handleAddToCartClick = async (product: Product, e: React.MouseEvent) => {
		const needsSelection = requiresSelection(product);
		if (!needsSelection) {
			e.preventDefault();
			await addToCart(product.id, 1);
		}
	};

	const handleConfirmAddToCart = async () => {
		if (selectedProduct && selectedVariant && selectedVariant.stock > 0) {
			await addToCart(selectedProduct.id, 1, selectedVariant.id);
			closePopup();
		}
	};

	const closePopup = () => {
		setShowVariantPopup(false);
		setSelectedProduct(null);
		clearSelections();
	};

	// ... existing code ...

	// Initialize filters from URL parameters
	useEffect(() => {
		const categoryFromUrl = searchParams.get('category');
		const searchFromUrl = searchParams.get('search');
		const sortFromUrl = searchParams.get('sort');

		if (categoryFromUrl) setSelectedCategory(categoryFromUrl);
		if (searchFromUrl) {
			setSearchTerm(searchFromUrl);
			setDebouncedSearch(searchFromUrl);
		}
		if (sortFromUrl) setSortBy(sortFromUrl);
	}, [searchParams]);

	const fetchProducts = async () => {
		try {
			setLoading(true);
			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: itemsPerPage.toString(),
				...(debouncedSearch && { search: debouncedSearch }),
				...(selectedCategory && { categoryId: selectedCategory }),
				...(sortBy && { sort: sortBy }),
			});

			const response = await fetch(`${apiURL}/api/products/?${params}`);
			if (response.ok) {
				const result: ProductsResponse = await response.json();
				setProducts(result.data || []);
				setTotalProducts(result.total || 0);
			}
		} catch (error) {
			console.error('Error fetching products:', error);
		} finally {
			setLoading(false);
		}
	};

	const fetchCategories = async () => {
		try {
			const response = await fetch(`${apiURL}/api/categories/`);
			if (response.ok) {
				const result = await response.json();
				setCategories(result.data || []);
			}
		} catch (error) {
			console.error('Error fetching categories:', error);
		}
	};

	useEffect(() => {
		fetchProducts();
		// eslint-disable-next-line
	}, [currentPage, debouncedSearch, selectedCategory, sortBy]);

	useEffect(() => {
		fetchCategories();
		// eslint-disable-next-line
	}, []);

	const handleCategoryFilter = (categoryId: string) => {
		setSelectedCategory(categoryId);
		setCurrentPage(1);
		updateURL({ category: categoryId || undefined });
	};

	const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value);
		setCurrentPage(1);
	};

	useEffect(() => {
		const id = setTimeout(() => {
			setDebouncedSearch(searchTerm);
		}, 300);
		return () => clearTimeout(id);
	}, [searchTerm]);

	const handleSortChange = (sort: string) => {
		setSortBy(sort);
		setCurrentPage(1);
		updateURL({ sort });
	};

	const updateURL = (params: Record<string, string | undefined>) => {
		const newSearchParams = new URLSearchParams(searchParams);

		Object.entries(params).forEach(([key, value]) => {
			if (value) {
				newSearchParams.set(key, value);
			} else {
				newSearchParams.delete(key);
			}
		});

		setSearchParams(newSearchParams);
	};

	useEffect(() => {
		updateURL({ search: debouncedSearch || undefined });
		// eslint-disable-next-line
	}, [debouncedSearch]);

	const parseImages = (images: string): string[] => {
		try {
			if (images && images.trim()) {
				const parsed = JSON.parse(images);
				return Array.isArray(parsed) ? parsed : [];
			}
		} catch (error) {
			console.warn('Failed to parse product images:', error);
		}
		return [];
	};

	const filteredProducts = products.filter((product) => {
		const matchesPrice =
			product.price >= priceRange.min && product.price <= priceRange.max;
		return matchesPrice;
	});

	const totalPages = Math.ceil(totalProducts / itemsPerPage);
	const selectedVariant = getSelectedVariant();

	return (
		<div className="min-h-screen bg-gray-900 text-white">
			<Navbar />

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold mb-4">
						<span className="text-white">SHOP</span>
						<span className="text-ventauri ml-2">COLLECTION</span>
					</h1>
					<p className="text-gray-300 text-lg">
						Discover our premium F1 Esports merchandise
					</p>
				</div>

				<div className="flex flex-col lg:flex-row gap-8">
					{/* Filters Sidebar */}
					<div className="lg:w-1/4">
						<div className="bg-gray-800 rounded-lg p-6 sticky top-24">
							<h3 className="text-xl font-semibold mb-6 text-ventauri">Filters</h3>

							{/* Search */}
							<div className="mb-6">
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Search
								</label>
								<input
									type="text"
									value={searchTerm}
									onChange={handleSearch}
									placeholder="Search products..."
									className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-ventauri focus:border-transparent"
								/>
							</div>

							{/* Categories */}
							<div className="mb-6">
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Categories
								</label>
								<select
									value={selectedCategory}
									onChange={(e) => handleCategoryFilter(e.target.value)}
									className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-ventauri focus:border-transparent"
								>
									<option value="">All Categories</option>
									{categories.map((category) => (
										<option key={category.id} value={category.id}>
											{category.name}
										</option>
									))}
								</select>
							</div>

							{/* Price Range */}
							<div className="mb-6">
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Price Range
								</label>
								<div className="space-y-3">
									<div className="flex gap-2">
										<input
											type="number"
											value={priceRange.min}
											onChange={(e) =>
												setPriceRange((prev) => ({ ...prev, min: Number(e.target.value) }))
											}
											placeholder="Min"
											className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-ventauri focus:border-transparent"
										/>
										<input
											type="number"
											value={priceRange.max}
											onChange={(e) =>
												setPriceRange((prev) => ({ ...prev, max: Number(e.target.value) }))
											}
											placeholder="Max"
											className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-ventauri focus:border-transparent"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Main Content */}
					<div className="lg:w-3/4">
						{/* Sort and Results Info */}
						<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
							<div className="text-gray-300">
								Showing {filteredProducts.length} of {totalProducts} products
							</div>
							<div className="flex items-center gap-2">
								<label className="text-sm font-medium text-gray-300">Sort by:</label>
								<select
									value={sortBy}
									onChange={(e) => handleSortChange(e.target.value)}
									className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-ventauri focus:border-transparent"
								>
									<option value="newest">Newest First</option>
									<option value="oldest">Oldest First</option>
									<option value="price-low">Price: Low to High</option>
									<option value="price-high">Price: High to Low</option>
									<option value="name-asc">Name: A to Z</option>
									<option value="name-desc">Name: Z to A</option>
								</select>
							</div>
						</div>

						{/* Products Grid */}
						{loading ? (
							<div className="flex items-center justify-center py-12">
								<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ventauri"></div>
								<span className="ml-3 text-gray-300">Loading products...</span>
							</div>
						) : filteredProducts.length === 0 ? (
							<div className="text-center py-12">
								<div className="text-gray-400 text-lg mb-4">No products found</div>
								<p className="text-gray-500">
									Try adjusting your filters or search terms
								</p>
							</div>
						) : (
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
								{filteredProducts.map((product) => {
									const productImages = parseImages(product.images);
									const mainImage =
										productImages.length > 0
											? productImages[0]
											: 'https://picsum.photos/400/400';

									return (
										<Link
											key={product.id}
											to={`/product/${product.id}`}
											className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors group relative"
										>
											<div className="aspect-square overflow-hidden">
												<img
													src={mainImage}
													alt={product.name}
													className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
													onError={(e) => {
														const target = e.target as HTMLImageElement;
														target.src = 'https://picsum.photos/400/400';
													}}
												/>
												<button
													className={`absolute top-2 right-2 px-3 py-1 rounded text-sm font-medium ${wishlistIds.has(product.id) ? 'bg-gray-700 text-white' : 'border border-ventauri text-ventauri hover:bg-ventauri hover:text-black'}`}
													onClick={(e) => toggleWishlist(product.id, e)}
													disabled={wishlistLoadingId === product.id}
												>
													{wishlistLoadingId === product.id ? '...' : wishlistIds.has(product.id) ? 'Saved' : 'Wishlist'}
												</button>
											</div>
											<div className="p-4">
												<div className="mb-2">
													{product.category && (
														<span className="text-xs text-ventauri font-medium uppercase tracking-wide">
															{product.category.name}
														</span>
													)}
												</div>
												<h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
													{product.name}
												</h3>
												<p className="text-gray-400 text-sm mb-3 line-clamp-2">
													{product.description}
												</p>
												<div className="flex items-center justify-between">
													<span className="text-xl font-bold text-ventauri">
														${product.price.toFixed(2)}
													</span>
													<button
														className="bg-ventauri text-black px-4 py-2 rounded-lg font-medium hover:bg-yellow-300 transition-colors"
														onClick={(e) => handleAddToCartClick(product, e)}
														disabled={cartLoading}
													>
														{cartLoading ? 'Adding...' : requiresSelection(product) ? 'Select Options' : 'Add to Cart'}
													</button>
												</div>
											</div>
										</Link>
									);
								})}
							</div>
						)}

						{/* Pagination */}
						{totalPages > 1 && (
							<div className="flex justify-center items-center mt-8 gap-2">
								<button
									onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
									disabled={currentPage === 1}
									className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
								>
									Previous
								</button>

								<div className="flex gap-1">
									{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
										const pageNum = i + 1;
										return (
											<button
												key={pageNum}
												onClick={() => setCurrentPage(pageNum)}
												className={`px-3 py-2 rounded-lg transition-colors ${
													currentPage === pageNum
														? 'bg-ventauri text-black font-medium'
														: 'bg-gray-800 text-white hover:bg-gray-700'
												}`}
											>
												{pageNum}
											</button>
										);
									})}
								</div>

								<button
									onClick={() =>
										setCurrentPage((prev) => Math.min(prev + 1, totalPages))
									}
									disabled={currentPage === totalPages}
									className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
								>
									Next
								</button>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Variant Selection Popup */}
			{showVariantPopup && selectedProduct && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
						<div className="p-6">
							{/* Header */}
							<div className="flex items-center justify-between mb-6">
								<h3 className="text-xl font-semibold text-white">Select Options</h3>
								<button
									onClick={closePopup}
									className="text-gray-400 hover:text-white transition-colors"
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

							{/* Product Info */}
							<div className="mb-6">
								<h4 className="text-lg font-medium text-white mb-2">
									{selectedProduct.name}
								</h4>
								<p className="text-ventauri text-xl font-bold">
									${selectedProduct.price.toFixed(2)}
								</p>
							</div>

							{/* Variants */}
							{selectedProduct.variants && selectedProduct.variants.length > 0 && (
								<div className="space-y-4 mb-6">
									<div className="flex items-center justify-between">
										<h4 className="text-lg font-semibold text-white">
											Available Options
										</h4>
										{(selectedSize || selectedVariantTitle) && (
											<button
												onClick={clearSelections}
												className="text-sm text-ventauri hover:text-ventauri underline"
											>
												Clear Selection
											</button>
										)}
									</div>

									{/* Sizes */}
									{Array.from(new Set(selectedProduct.variants.map((v) => v.size)))
										.length > 0 && (
										<div className="space-y-2">
											<label className="block text-sm font-medium text-gray-300">
												Size{' '}
												{selectedSize && (
													<span className="text-ventauri">(Click to deselect)</span>
												)}
											</label>
											<div className="flex flex-wrap gap-2">
												{Array.from(
													new Set(selectedProduct.variants.map((v) => v.size))
												).map((size) => {
													const isAvailable = isSizeAvailable(size);
													const isSelected = selectedSize === size;
													return (
														<button
															key={size}
															className={`px-4 py-2 rounded-lg border transition-all ${
																isSelected
																	? 'border-ventauri bg-ventauri text-black hover:bg-yellow-300'
																	: isAvailable
																		? 'border-gray-600 hover:border-yellow-300 text-white'
																		: 'border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed'
															}`}
															disabled={!isAvailable && !isSelected}
															onClick={() => handleSizeClick(size)}
														>
															{size}
														</button>
													);
												})}
											</div>
										</div>
									)}

									{/* Variant Titles */}
									{Array.from(new Set(selectedProduct.variants.map((v) => v.title)))
										.length > 0 && (
										<div className="space-y-2">
											<label className="block text-sm font-medium text-gray-300">
												Style{' '}
												{selectedVariantTitle && (
													<span className="text-ventauri">(Click to deselect)</span>
												)}
											</label>
											<div className="flex flex-wrap gap-2">
												{Array.from(
													new Set(selectedProduct.variants.map((v) => v.title))
												).map((title) => {
													const isAvailable = isVariantTitleAvailable(title);
													const isSelected = selectedVariantTitle === title;
													return (
														<button
															key={title}
															className={`px-4 py-2 rounded-lg border transition-all ${
																isSelected
																	? 'border-ventauri bg-ventauri text-black hover:bg-yellow-300'
																	: isAvailable
																		? 'border-gray-600 hover:border-yellow-300 text-white'
																		: 'border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed'
															}`}
															disabled={!isAvailable && !isSelected}
															onClick={() => handleVariantTitleClick(title)}
														>
															{title}
														</button>
													);
												})}
											</div>
										</div>
									)}
								</div>
							)}

							{/* Selection Status */}
							{(selectedSize || selectedVariantTitle) && (
								<div className="bg-gray-700 rounded-lg p-4 mb-6">
									<h5 className="font-medium mb-2 text-white">Current Selection:</h5>
									<div className="text-sm text-gray-300">
										{selectedSize && (
											<span>
												Size: <span className="text-ventauri">{selectedSize}</span>
											</span>
										)}
										{selectedSize && selectedVariantTitle && <span className="mx-2">•</span>}
										{selectedVariantTitle && (
											<span>
												Style: <span className="text-ventauri">{selectedVariantTitle}</span>
											</span>
										)}
									</div>
									{selectedVariant && (
										<div className="text-sm text-gray-400 mt-1">
											Stock:{' '}
											{selectedVariant.stock > 0
												? `${selectedVariant.stock} units`
												: 'Out of stock'}
										</div>
									)}
								</div>
							)}

							{/* Action Buttons */}
							<div className="flex gap-3">
								<button
									onClick={closePopup}
									className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
								>
									Cancel
								</button>
								<button
									onClick={handleConfirmAddToCart}
									disabled={
										!selectedVariant || selectedVariant.stock <= 0 || cartLoading
									}
									className="flex-1 bg-ventauri text-black px-4 py-3 rounded-lg font-medium hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{cartLoading
										? 'Adding...'
										: !selectedSize || !selectedVariantTitle
											? 'Select Options'
											: selectedVariant && selectedVariant.stock <= 0
												? 'Out of Stock'
												: 'Add to Cart'}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
