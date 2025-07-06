import { Link } from 'react-router-dom';
import Navbar from '../../Components/Navbar';
import { useCart } from '../../Contexts/CartContext';
import { useAuth } from '../../Contexts/AuthContext';
import { useState } from 'react';

export default function Cart() {
    const { items, total, loading, updateQuantity, removeFromCart, clearCart } = useCart();
    const { isAuthenticated } = useAuth();
    const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
    const [isOperationLoading, setIsOperationLoading] = useState(false);

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

    const handleUpdateQuantity = async (itemId: string, quantity: number) => {
        setUpdatingItems(prev => new Set(prev).add(itemId));
        setIsOperationLoading(true);
        try {
            await updateQuantity(itemId, quantity);
        } finally {
            setUpdatingItems(prev => {
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
                        <h2 className="text-2xl font-bold mb-4">Please log in to view your cart</h2>
                        <Link 
                            to="/login" 
                            className="bg-yellow-400 text-black px-6 py-3 rounded-lg font-medium hover:bg-yellow-300 transition-colors"
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
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
                        <span className="ml-3 text-gray-300">Loading cart...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-900 text-white">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
                        <p className="text-gray-400 mb-6">Add some items to get started!</p>
                        <Link 
                            to="/products" 
                            className="bg-yellow-400 text-black px-6 py-3 rounded-lg font-medium hover:bg-yellow-300 transition-colors"
                        >
                            Continue Shopping
                        </Link>
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
                        <span className="text-yellow-400 ml-2">CART</span>
                    </h1>
                    <p className="text-gray-300 text-lg">Review your items before checkout</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {items.map((item) => {
                            const productImages = parseImages(item.product.images);
                            const mainImage = productImages.length > 0 
                                ? productImages[0] 
                                : 'https://picsum.photos/400/400';
                            const isItemUpdating = updatingItems.has(item.id);

                            return (
                                <div key={item.id} className={`bg-gray-800 rounded-lg p-6 transition-opacity ${
                                    isItemUpdating ? 'opacity-70' : 'opacity-100'
                                }`}>
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
                                            <h3 className="text-lg font-semibold text-white mb-1">
                                                <Link 
                                                    to={`/product/${item.product.id}`}
                                                    className="hover:text-yellow-400 transition-colors"
                                                >
                                                    {item.product.name}
                                                </Link>
                                            </h3>
                                            {item.product.category && (
                                                <p className="text-sm text-yellow-400 mb-2">
                                                    {item.product.category.name}
                                                </p>
                                            )}
                                            <p className="text-xl font-bold text-yellow-400">
                                                ${item.product.price.toFixed(2)}
                                            </p>
                                        </div>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center space-x-3">
                                            <button
                                                onClick={() => handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
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
                                                ${(item.product.price * item.quantity).toFixed(2)}
                                            </p>
                                        </div>

                                        {/* Remove Button */}
                                        <button
                                            onClick={() => handleRemoveFromCart(item.id)}
                                            disabled={isOperationLoading}
                                            className="text-red-400 hover:text-red-300 p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
                            <h3 className="text-xl font-semibold mb-6 text-yellow-400">Order Summary</h3>
                            
                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-gray-300">
                                    <span>Subtotal ({items.length} items)</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-300">
                                    <span>Shipping</span>
                                    <span>Free</span>
                                </div>
                                <div className="border-t border-gray-700 pt-4">
                                    <div className="flex justify-between text-lg font-bold text-white">
                                        <span>Total</span>
                                        <span className="text-yellow-400">${total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button 
                                    disabled={isOperationLoading}
                                    className="w-full bg-yellow-400 text-black py-3 rounded-lg font-medium hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-600 disabled:text-gray-400"
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