import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../../Components/Navbar';
import { Link } from 'react-router-dom';
import { useCart } from '../../Contexts/CartContext';

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

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [sortBy, setSortBy] = useState<string>('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);
    const [priceRange, setPriceRange] = useState<{min: number, max: number}>({min: 0, max: 1000});
    const [searchParams, setSearchParams] = useSearchParams();
    
    const itemsPerPage = 12;
    const apiURL = import.meta.env.VITE_BACKEND_URL || "";

    const { addToCart, loading: cartLoading } = useCart();
    const handleAddToCart = async (productId: string) => {
        await addToCart(productId, 1);
    }

    // Initialize filters from URL parameters
    useEffect(() => {
        const categoryFromUrl = searchParams.get('category');
        const searchFromUrl = searchParams.get('search');
        const sortFromUrl = searchParams.get('sort');
        
        if (categoryFromUrl) setSelectedCategory(categoryFromUrl);
        if (searchFromUrl) setSearchTerm(searchFromUrl);
        if (sortFromUrl) setSortBy(sortFromUrl);
    }, [searchParams]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: itemsPerPage.toString(),
                ...(searchTerm && { search: searchTerm }),
                ...(selectedCategory && { categoryId: selectedCategory }),
                ...(sortBy && { sort: sortBy })
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
    }, [currentPage, searchTerm, selectedCategory, sortBy]);

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
        updateURL({ search: e.target.value || undefined });
    };

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

    const filteredProducts = products.filter(product => {
        const matchesPrice = product.price >= priceRange.min && product.price <= priceRange.max;
        return matchesPrice;
    });

    const totalPages = Math.ceil(totalProducts / itemsPerPage);

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <Navbar />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-4">
                        <span className="text-white">SHOP</span>
                        <span className="text-yellow-400 ml-2">COLLECTION</span>
                    </h1>
                    <p className="text-gray-300 text-lg">Discover our premium F1 Esports merchandise</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Filters Sidebar */}
                    <div className="lg:w-1/4">
                        <div className="bg-gray-800 rounded-lg p-6 sticky top-24">
                            <h3 className="text-xl font-semibold mb-6 text-yellow-400">Filters</h3>
                            
                            {/* Search */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    placeholder="Search products..."
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                />
                            </div>

                            {/* Categories */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Categories</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => handleCategoryFilter(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Price Range */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Price Range</label>
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={priceRange.min}
                                            onChange={(e) => setPriceRange(prev => ({...prev, min: Number(e.target.value)}))}
                                            placeholder="Min"
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                        />
                                        <input
                                            type="number"
                                            value={priceRange.max}
                                            onChange={(e) => setPriceRange(prev => ({...prev, max: Number(e.target.value)}))}
                                            placeholder="Max"
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
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
                                    className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
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
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
                                <span className="ml-3 text-gray-300">Loading products...</span>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-gray-400 text-lg mb-4">No products found</div>
                                <p className="text-gray-500">Try adjusting your filters or search terms</p>
                            </div>
                        ) : (
                            // In the Products Grid section, wrap the product card with Link:
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredProducts.map((product) => {
                                    const productImages = parseImages(product.images);
                                    const mainImage = productImages.length > 0 
                                        ? productImages[0] 
                                        : 'https://picsum.photos/400/400';
                                
                                    return (
                                        <Link 
                                            key={product.id} 
                                            to={`/product/${product.id}`} 
                                            className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors group"
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
                                            </div>
                                            <div className="p-4">
                                                <div className="mb-2">
                                                    {product.category && (
                                                        <span className="text-xs text-yellow-400 font-medium uppercase tracking-wide">
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
                                                    <span className="text-xl font-bold text-yellow-400">
                                                        ${product.price.toFixed(2)}
                                                    </span>
                                                    <button 
                                                        className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-medium hover:bg-yellow-300 transition-colors"
                                                        onClick={(e) => {
                                                            e.preventDefault(); 
                                                            handleAddToCart(product.id)
                                                        }}
                                                        disabled={cartLoading}
                                                    >
                                                        {cartLoading ? 'Adding...' : 'Add to Cart'}
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
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                                                        ? 'bg-yellow-400 text-black font-medium'
                                                        : 'bg-gray-800 text-white hover:bg-gray-700'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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
        </div>
    );
}