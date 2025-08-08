import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';

interface CartItem {
	id: string;
	productId: string;
	productVariantId?: string;
	quantity: number;
	product: {
		id: string;
		name: string;
		price: number;
		images: string;
		category?: {
			id: string;
			name: string;
		};
	};
	productVariant?: {
		id: string;
		title: string;
		description: string;
		size: string;
		priceAdjust: number;
	};
}

interface CartContextType {
	items: CartItem[];
	total: number;
	itemCount: number;
	loading: boolean;
	addToCart: (
		productId: string,
		quantity: number,
		productVariantId?: string
	) => Promise<void>;
	updateQuantity: (itemId: string, quantity: number) => Promise<void>;
	removeFromCart: (itemId: string) => Promise<void>;
	clearCart: () => Promise<void>;
	refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const { user, isAuthenticated } = useAuth();
	const [items, setItems] = useState<CartItem[]>([]);
	const [total, setTotal] = useState(0);
	const [itemCount, setItemCount] = useState(0);
	const [loading, setLoading] = useState(false);
	const apiURL = import.meta.env.VITE_BACKEND_URL || '';

	// Fetch cart when user logs in
	useEffect(() => {
		if (isAuthenticated && user) {
			refreshCart();
		} else {
			// Clear cart when user logs out
			setItems([]);
			setTotal(0);
			setItemCount(0);
		}
		// eslint-disable-next-line
	}, [isAuthenticated, user]);

	const refreshCart = async () => {
		if (!isAuthenticated) return;

		try {
			setLoading(true);
			const response = await fetch(`${apiURL}/api/cart/`, {
				credentials: 'include',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				setItems(data.data || []);
				setTotal(data.total || 0);
				setItemCount(data.itemCount || 0);
			}
		} catch (error) {
			console.error('Error fetching cart:', error);
		} finally {
			setLoading(false);
		}
	};

	const addToCart = async (
		productId: string,
		quantity: number,
		productVariantId?: string
	) => {
		if (!isAuthenticated) {
			alert('Please log in to add items to cart');
			return;
		}

		try {
			setLoading(true);
			const response = await fetch(`${apiURL}/api/cart/add`, {
				method: 'POST',
				credentials: 'include',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					productId,
					quantity,
					productVariantId: productVariantId || '',
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to add to cart');
			}

			await refreshCart();
		} catch (error) {
			console.error('Error adding to cart:', error);
			alert('Failed to add item to cart');
		} finally {
			setLoading(false);
		}
	};

	const updateQuantity = async (itemId: string, quantity: number) => {
		try {
			setLoading(true);
			const response = await fetch(`${apiURL}/api/cart/update/${itemId}`, {
				method: 'PUT',
				credentials: 'include',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ quantity }),
			});

			if (response.ok) {
				await refreshCart();
			}
		} catch (error) {
			console.error('Error updating cart:', error);
		} finally {
			setLoading(false);
		}
	};

	const removeFromCart = async (itemId: string) => {
		try {
			setLoading(true);
			const response = await fetch(`${apiURL}/api/cart/remove/${itemId}`, {
				method: 'DELETE',
				credentials: 'include',
			});

			if (response.ok) {
				await refreshCart();
			}
		} catch (error) {
			console.error('Error removing from cart:', error);
		} finally {
			setLoading(false);
		}
	};

	const clearCart = async () => {
		try {
			setLoading(true);
			const response = await fetch(`${apiURL}/api/cart/clear`, {
				method: 'DELETE',
				credentials: 'include',
			});

			if (response.ok) {
				setItems([]);
				setTotal(0);
				setItemCount(0);
			}
		} catch (error) {
			console.error('Error clearing cart:', error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<CartContext.Provider
			value={{
				items,
				total,
				itemCount,
				loading,
				addToCart,
				updateQuantity,
				removeFromCart,
				clearCart,
				refreshCart,
			}}
		>
			{children}
		</CartContext.Provider>
	);
};

// eslint-disable-next-line
export const useCart = () => {
	const context = useContext(CartContext);
	if (context === undefined) {
		throw new Error('useCart must be used within a CartProvider');
	}
	return context;
};
