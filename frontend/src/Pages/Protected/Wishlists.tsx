import React, { useEffect, useState } from 'react';
import Navbar from '../../Components/Navbar';
import { Link } from 'react-router-dom';
import { useAuth } from '../../Contexts/AuthContext';
import usePageTitle from '../../hooks/usePageTitle';

interface Category { id: string; name: string; }
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string;
  category?: Category;
}
interface WishlistItem {
  id: string;
  productId: string;
  createdAt: string;
  product: Product;
}

export default function Wishlists() {
  usePageTitle('Wishlists');
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiURL = import.meta.env.VITE_BACKEND_URL || '';

  const parseImages = (images: string): string[] => {
    try { const arr = JSON.parse(images); return Array.isArray(arr) ? arr : []; } catch { return []; }
  };

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${apiURL}/api/wishlist/`, { credentials: 'include' });
      if (!res.ok) throw new Error(`Failed to fetch wishlist: ${res.status}`);
      const data = await res.json();
      setItems(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch wishlist');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (id: string) => {
    try {
      const res = await fetch(`${apiURL}/api/wishlist/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to remove item');
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item');
    }
  };

  useEffect(() => { if (isAuthenticated) fetchWishlist(); /* eslint-disable-next-line */ }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p>Please log in to view your wishlist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">
            <span className="text-white">MY</span>
            <span className="text-ventauri ml-2">WISHLIST</span>
          </h1>
          <Link to="/products" className="border-2 border-ventauri text-ventauri px-4 py-2 rounded hover:bg-ventauri hover:text-black">Continue Shopping</Link>
        </div>

        {loading ? (
          <div>Loading wishlist...</div>
        ) : error ? (
          <div className="text-red-400">{error}</div>
        ) : items.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-300 mb-4">Your wishlist is empty.</p>
            <Link to="/products" className="bg-ventauri text-black px-6 py-3 rounded font-semibold">Browse Products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const imgs = parseImages(item.product.images);
              const img = imgs[0] || 'https://picsum.photos/400/400';
              return (
                <div key={item.id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                  <Link to={`/product/${item.product.id}`}>
                    <img src={img} alt={item.product.name} className="w-full h-48 object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/400/400'; }} />
                  </Link>
                  <div className="p-4">
                    <Link to={`/product/${item.product.id}`} className="block text-lg font-semibold text-white hover:text-ventauri">
                      {item.product.name}
                    </Link>
                    <div className="text-gray-400 text-sm truncate mb-3">{item.product.description}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-ventauri font-bold">€{item.product.price.toFixed(2)}</span>
                      <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-300">Remove</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}