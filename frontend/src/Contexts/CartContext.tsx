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
    options?: {
		[key: string]: string;
	}[];
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
        productVariantId?: string,
        options?: { [key: string]: string }[]
    ) => Promise<void>;
    updateQuantity: (itemId: string, quantity: number) => Promise<void>;
    removeFromCart: (itemId: string) => Promise<void>;
    clearCart: () => Promise<void>;
    refreshCart: () => Promise<void>;
    // Coupon
    appliedCouponCode?: string | null;
    couponDiscount?: number;
    appliedCoupon?: { code: string; type: string } | null;
    applyCoupon?: (code: string) => Promise<{ discount: number; finalTotal: number; coupon: { type: string } } | null>;
    clearCoupon?: () => void;
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
    const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
    const [couponDiscount, setCouponDiscount] = useState<number>(0);
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; type: string } | null>(null);
    const apiURL = import.meta.env.VITE_BACKEND_URL || '';

    // Encode options to a JSON string before sending to backend
    const encodeOptions = (opts?: { [key: string]: string }[]): string | undefined => {
        if (!opts || opts.length === 0) return undefined;
        try {
            return JSON.stringify(opts);
        } catch {
            return undefined;
        }
    };

    // Normalize options received from backend to an array of string-keyed objects
    const normalizeOptions = (value: unknown): { [key: string]: string }[] | undefined => {
        const isStringObject = (o: unknown): o is Record<string, string> => {
            if (!o || typeof o !== 'object' || Array.isArray(o)) return false;
            const vals = Object.values(o as Record<string, unknown>);
            return vals.every((v) => typeof v === 'string');
        };
        const filterStringObjectArray = (arr: unknown[]): { [key: string]: string }[] => {
            return arr.filter(isStringObject) as { [key: string]: string }[];
        };

        if (Array.isArray(value)) {
            return filterStringObjectArray(value);
        }
        if (typeof value === 'string' && value.trim() !== '') {
            try {
                const first = JSON.parse(value);
                if (Array.isArray(first)) {
                    return filterStringObjectArray(first);
                }
                if (typeof first === 'string') {
                    // Handle double-encoded string case
                    try {
                        const second = JSON.parse(first);
                        if (Array.isArray(second)) {
                            return filterStringObjectArray(second);
                        }
                    } catch {
                        // fall through
                    }
                } else if (isStringObject(first)) {
                    return [first];
                }
            } catch {
                // Decoding failed; leave undefined to avoid type mismatch
            }
        }
        if (isStringObject(value)) {
            return [value as Record<string, string>];
        }
        return undefined;
    };

	// Fetch cart when user logs in
	useEffect(() => {
		if (isAuthenticated && user) {
			refreshCart();
			// Rehydrate coupon from localStorage
			try {
				const raw = localStorage.getItem('cart_coupon');
				if (raw) {
					const parsed = JSON.parse(raw);
					if (parsed && parsed.code) {
						setAppliedCouponCode(String(parsed.code));
						setCouponDiscount(Number(parsed.discount || 0));
						if (parsed.coupon && parsed.coupon.type) {
							setAppliedCoupon({ code: String(parsed.code), type: String(parsed.coupon.type) });
						}
					}
				}
			} catch { /* ignore */ }
		} else {
			// Clear cart when user logs out
			setItems([]);
			setTotal(0);
			setItemCount(0);
			setAppliedCouponCode(null);
			setCouponDiscount(0);
			setAppliedCoupon(null);
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
                const rawItems = (data.data || []) as Array<Record<string, unknown>>;
                const normalizedItems: CartItem[] = rawItems.map((item) => {
                    const optionsValue = (item as { options?: unknown }).options;
                    const parsedOptions = normalizeOptions(optionsValue);
                    // Preserve already-structured options when available
                    return { ...item, options: parsedOptions } as CartItem;
                });
                setItems(normalizedItems);
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
    productVariantId?: string,
    options?: { [key: string]: string }[]
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
                    // Always encode options as a JSON string when sending
                    options: encodeOptions(options),
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

	const applyCoupon = async (code: string) => {
        if (!isAuthenticated) return null;
        try {
            setLoading(true);
            const res = await fetch(`${apiURL}/api/coupons/validate`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, orderTotal: total }),
            });
            const json = await res.json();
            if (!res.ok || !json.valid) {
                throw new Error(json.error || 'Invalid coupon');
            }
            const discount = Number(json.discount || 0);
            const couponType = String(json.coupon?.type || '');
            setAppliedCouponCode(code);
            setCouponDiscount(discount);
            setAppliedCoupon({ code, type: couponType });
            try { localStorage.setItem('cart_coupon', JSON.stringify({ code, discount, coupon: json.coupon })); } catch { /* ignore */ }
            return { discount, finalTotal: Number(json.finalTotal || total - discount), coupon: { type: couponType } };
        } catch (e) {
            // Clear state on invalid
            setAppliedCouponCode(null);
            setCouponDiscount(0);
            setAppliedCoupon(null);
            try { localStorage.removeItem('cart_coupon'); } catch { /* ignore */ }
            throw e;
        } finally {
            setLoading(false);
        }
    };

    const clearCoupon = () => {
        setAppliedCouponCode(null);
        setCouponDiscount(0);
        setAppliedCoupon(null);
        try { localStorage.removeItem('cart_coupon'); } catch { /* ignore */ }
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
				appliedCouponCode,
				couponDiscount,
				appliedCoupon,
				applyCoupon,
				clearCoupon,
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
