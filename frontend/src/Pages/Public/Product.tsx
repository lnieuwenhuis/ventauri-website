import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../../Components/Navbar';
import { useCart } from '../../Contexts/CartContext';


interface ProductVariant {
    id: string;
    sku: string;
    size: string;
    color: string;
    stock: number;
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
    reviews?: Review[];
}

export default function Product() {
    const { id } = useParams<{ id: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const apiURL = import.meta.env.VITE_BACKEND_URL || "";
    const { addToCart, loading: cartLoading } = useCart();

    const handleAddToCart = async () => {
        if (product && selectedVariant && selectedVariant.stock > 0) {
            await addToCart(product.id, 1, selectedSize || '', selectedColor || '');
        }
    }

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

    // Get the currently selected variant based on size and color
    const getSelectedVariant = (): ProductVariant | null => {
        if (!product?.variants || !selectedSize || !selectedColor) return null;
        return product.variants.find(v => v.size === selectedSize && v.color === selectedColor) || null;
    };

    // Check if a size is available for the current color selection
    const isSizeAvailable = (size: string): boolean => {
        if (!product?.variants) return false;
        if (!selectedColor) {
            return product.variants.some(v => v.size === size && v.stock > 0);
        }
        return product.variants.some(v => v.size === size && v.color === selectedColor && v.stock > 0);
    };

    // Check if a color is available for the current size selection
    const isColorAvailable = (color: string): boolean => {
        if (!product?.variants) return false;
        if (!selectedSize) {
            return product.variants.some(v => v.color === color && v.stock > 0);
        }
        return product.variants.some(v => v.color === color && v.size === selectedSize && v.stock > 0);
    };

    // Handle size selection/deselection
    const handleSizeClick = (size: string) => {
        if (selectedSize === size) {
            // Deselect if clicking on already selected size
            setSelectedSize(null);
        } else if (isSizeAvailable(size)) {
            setSelectedSize(size);
            // Reset color if current combination is not available
            if (selectedColor && !product?.variants?.some(v => 
                v.size === size && v.color === selectedColor && v.stock > 0
            )) {
                setSelectedColor(null);
            }
        }
    };

    // Handle color selection/deselection
    const handleColorClick = (color: string) => {
        if (selectedColor === color) {
            // Deselect if clicking on already selected color
            setSelectedColor(null);
        } else if (isColorAvailable(color)) {
            setSelectedColor(color);
            // Reset size if current combination is not available
            if (selectedSize && !product?.variants?.some(v => 
                v.color === color && v.size === selectedSize && v.stock > 0
            )) {
                setSelectedSize(null);
            }
        }
    };

    // Clear all selections
    const clearSelections = () => {
        setSelectedSize(null);
        setSelectedColor(null);
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

    const getStarRating = (rating: number) => {
        return '★'.repeat(rating) + '☆'.repeat(5 - rating);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
                        <span className="ml-3 text-gray-300">Loading product...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-gray-900 text-white">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-lg mb-4">
                            {error || 'Product not found'}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const productImages = parseImages(product.images);
    const mainImage = productImages.length > 0 ? productImages[0] : 'https://picsum.photos/400/400';
    const selectedVariant = getSelectedVariant();

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb */}
                <nav className="mb-8">
                    <ol className="flex space-x-2 text-sm text-gray-400">
                        <li><a href="/" className="hover:text-yellow-400">Home</a></li>
                        <li>/</li>
                        <li><a href="/products" className="hover:text-yellow-400">Products</a></li>
                        <li>/</li>
                        <li className="text-yellow-400">{product.name}</li>
                    </ol>
                </nav>

                {/* Product Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                    {/* Images */}
                    <div className="space-y-4">
                        <div className="aspect-square overflow-hidden rounded-lg bg-gray-800">
                            <img
                                src={selectedVariant?.images?.[0] || mainImage}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'https://picsum.photos/400/400';
                                }}
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            {productImages.map((img, index) => (
                                <button
                                    key={index}
                                    className="aspect-square rounded-lg overflow-hidden bg-gray-800 hover:ring-2 hover:ring-yellow-400"
                                    onClick={clearSelections}
                                >
                                    <img
                                        src={img}
                                        alt={`${product.name} ${index + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = 'https://picsum.photos/400/400';
                                        }}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="space-y-6">
                        {product.category && (
                            <div className="text-sm text-yellow-400 font-medium uppercase tracking-wide">
                                {product.category.name}
                            </div>
                        )}
                        <h1 className="text-4xl font-bold text-white">{product.name}</h1>
                        <p className="text-gray-300 text-lg leading-relaxed">{product.description}</p>
                        
                        {/* Price */}
                        <div className="text-3xl font-bold text-yellow-400">
                            ${(product.price || 0).toFixed(2)}
                        </div>

                        {/* Variants */}
                        {product.variants && product.variants.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold">Available Options</h3>
                                    {(selectedSize || selectedColor) && (
                                        <button
                                            onClick={clearSelections}
                                            className="text-sm text-yellow-400 hover:text-yellow-300 underline"
                                        >
                                            Clear Selection
                                        </button>
                                    )}
                                </div>
                                
                                {/* Sizes */}
                                {Array.from(new Set(product.variants.map(v => v.size))).length > 0 && (
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-300">
                                            Size {selectedSize && <span className="text-yellow-400">(Click to deselect)</span>}
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {Array.from(new Set(product.variants.map(v => v.size))).map(size => {
                                                const isAvailable = isSizeAvailable(size);
                                                const isSelected = selectedSize === size;
                                                return (
                                                    <button
                                                        key={size}
                                                        className={`px-4 py-2 rounded-lg border transition-all ${
                                                            isSelected
                                                                ? 'border-yellow-400 bg-yellow-400 text-black hover:bg-yellow-300' 
                                                                : isAvailable
                                                                    ? 'border-gray-600 hover:border-yellow-400 text-white'
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

                                {/* Colors */}
                                {Array.from(new Set(product.variants.map(v => v.color))).length > 0 && (
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-300">
                                            Color {selectedColor && <span className="text-yellow-400">(Click to deselect)</span>}
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {Array.from(new Set(product.variants.map(v => v.color))).map(color => {
                                                const isAvailable = isColorAvailable(color);
                                                const isSelected = selectedColor === color;
                                                return (
                                                    <button
                                                        key={color}
                                                        className={`px-4 py-2 rounded-lg border transition-all ${
                                                            isSelected
                                                                ? 'border-yellow-400 bg-yellow-400 text-black hover:bg-yellow-300' 
                                                                : isAvailable
                                                                    ? 'border-gray-600 hover:border-yellow-400 text-white'
                                                                    : 'border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed'
                                                        }`}
                                                        disabled={!isAvailable && !isSelected}
                                                        onClick={() => handleColorClick(color)}
                                                    >
                                                        {color}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Selection Status */}
                        {(selectedSize || selectedColor) && (
                            <div className="bg-gray-800 rounded-lg p-4">
                                <h4 className="font-medium mb-2">Current Selection:</h4>
                                <div className="text-sm text-gray-300">
                                    {selectedSize && <span>Size: <span className="text-yellow-400">{selectedSize}</span></span>}
                                    {selectedSize && selectedColor && <span className="mx-2">•</span>}
                                    {selectedColor && <span>Color: <span className="text-yellow-400">{selectedColor}</span></span>}
                                </div>
                                {selectedVariant && (
                                    <div className="text-sm text-gray-400 mt-1">
                                        Stock: {selectedVariant.stock > 0 ? `${selectedVariant.stock} units` : 'Out of stock'}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Add to Cart */}
                        <button 
                            className="w-full md:w-auto bg-yellow-400 text-black px-8 py-3 rounded-lg font-medium hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!selectedVariant || selectedVariant.stock <= 0 || cartLoading}
                            onClick={handleAddToCart}
                        >
                            {cartLoading 
                                ? 'Adding to Cart...' 
                                : !selectedSize || !selectedColor 
                                    ? 'Select Size and Color' 
                                    : selectedVariant && selectedVariant.stock <= 0 
                                        ? 'Out of Stock' 
                                        : 'Add to Cart'
                            }
                        </button>
                    </div>
                </div>

                {/* Reviews Section */}
                {product.reviews && product.reviews.length > 0 && (
                    <div className="border-t border-gray-800 pt-12">
                        <h2 className="text-2xl font-bold mb-8">Customer Reviews</h2>
                        <div className="space-y-8">
                            {product.reviews
                                .filter(review => review.isApproved)
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                .map(review => (
                                    <div key={review.id} className="bg-gray-800 rounded-lg p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <div className="text-yellow-400 text-lg mb-1">
                                                    {getStarRating(review.rating)}
                                                </div>
                                                <h3 className="font-semibold text-lg">{review.title}</h3>
                                            </div>
                                            <div className="text-sm text-gray-400">
                                                {formatDate(review.createdAt)}
                                            </div>
                                        </div>
                                        <p className="text-gray-300 mb-4">{review.comment}</p>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-gray-400">By {review.user.firstName} {review.user.lastName}</span>
                                            </div>
                                            {review.isVerified && (
                                                    <span className="text-green-400 ml-auto">✓ Verified Purchase</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}