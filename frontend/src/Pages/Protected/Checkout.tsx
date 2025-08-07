import { useEffect, useMemo, useRef, useState } from 'react';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import Navbar from '../../Components/Navbar';
import { useCart } from '../../Contexts/CartContext';

const backendUrl = import.meta.env.VITE_BACKEND_URL || '';

function CheckoutForm() {
    const stripe = useStripe();
    const elements = useElements();
    const { items } = useCart();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;
        setLoading(true);
        setError(null);

        const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
            return_url: window.location.origin + '/orders',
        },
        });

        if (result.error) {
        setError(result.error.message || 'Payment failed');
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
        <PaymentElement />
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <button
            disabled={!stripe || loading || items.length === 0}
            className="w-full bg-ventauri text-black py-3 rounded-lg font-medium disabled:opacity-50"
        >
            {loading ? 'Processing...' : 'Pay now'}
        </button>
        </form>
    );
}

export default function Checkout() {
    const { items } = useCart();
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
    const [piAmount, setPiAmount] = useState<number | null>(null); // cents
    const [piCurrency, setPiCurrency] = useState<string>('usd');
    const requestedRef = useRef(false);
    const [prepError, setPrepError] = useState<string | null>(null);

    useEffect(() => {
        // Prevent double-call in React StrictMode dev mounts
        if (requestedRef.current) return;
        requestedRef.current = true;
        let active = true;
        const bootstrap = async () => {
        // 1) get publishable key
        const keyRes = await fetch(`${backendUrl}/api/checkout/publishable-key`, {
            credentials: 'include',
        });
        const keyJson = await keyRes.json();
        const publishableKey = keyJson.publishableKey || 'pk_test_XXXXXXXXXXXXXXXXXXXXXXXX';
        if (active) setStripePromise(loadStripe(publishableKey));

        // 2) request PaymentIntent for current cart
        // The backend expects items with product and quantity plus default addresses; for demo, send placeholder addresses
            const persistedOrderIds = (() => {
                try { return JSON.parse(localStorage.getItem('checkout_order_ids') || '[]') as string[]; } catch { return []; }
            })();
            const startIntent = async (existingIds: string[]) => {
                setPrepError(null);
                const payload = {
                    items: items.map((i) => ({
                        productId: i.productId,
                        productVariantId: null as unknown as string | null,
                        quantity: i.quantity,
                    })),
                    shippingAddressId: '',
                    billingAddressId: '',
                    existingOrderIds: existingIds,
                };
                const res = await fetch(`${backendUrl}/api/checkout/create-payment-intent`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const text = await res.text();
                let json: { clientSecret?: string; amount?: number; currency?: string; orderIds?: string[]; error?: string } = {};
                try { json = JSON.parse(text); } catch { json = {}; }
                if (res.ok && json.clientSecret) {
                    if (active) {
                        setClientSecret(json.clientSecret);
                        if (typeof json.amount === 'number') setPiAmount(json.amount);
                        if (typeof json.currency === 'string') setPiCurrency(json.currency);
                        if (Array.isArray(json.orderIds)) {
                            try { localStorage.setItem('checkout_order_ids', JSON.stringify(json.orderIds)); } catch (err) { console.warn('persist order ids failed', err); }
                        }
                    }
                    return true;
                } else {
                    const reason = json.error || (!json.clientSecret && res.ok ? 'Missing clientSecret in response' : 'Unknown error');
                    if (active) setPrepError(`${reason}`);
                    return false;
                }
            };

            const ok = await startIntent(Array.isArray(persistedOrderIds) ? persistedOrderIds : []);
            if (!ok) {
                // Fallback: clear any stale orderIds and try once more
                try { localStorage.removeItem('checkout_order_ids'); } catch { /* ignore */ }
                await startIntent([]);
            }
        };
        bootstrap();
        return () => { active = false; };
    }, [items]);

    const options = useMemo(() => ({
        clientSecret: clientSecret || '',
        appearance: { theme: 'night' as const },
    }), [clientSecret]);

    // Helpers for displaying product images and totals
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

    const computedSubtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    const computedTax = computedSubtotal * 0.1;
    const computedShipping = 5.99 * items.length;
    const computedTotal = computedSubtotal + computedTax + computedShipping;

    const formatMoney = (amount: number, currency: string) => {
        try {
            return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.toUpperCase() }).format(amount);
        } catch {
            return `$${amount.toFixed(2)}`;
        }
    };

    const totalDisplay = piAmount != null ? formatMoney(piAmount / 100, piCurrency) : formatMoney(computedTotal, piCurrency);

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold mb-6">Checkout</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Order Summary */}
                    <div className="lg:col-span-2">
                        <div className="bg-gray-800 rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4 text-ventauri">Order Summary</h2>
                            <div className="divide-y divide-gray-700">
                                {items.map((item) => {
                                    const imgs = parseImages(item.product.images);
                                    const img = imgs[0] || 'https://picsum.photos/200/200';
                                    const lineTotal = item.product.price * item.quantity;
                                    return (
                                        <div key={item.id} className="py-4 flex items-center gap-4">
                                            <img src={img} alt={item.product.name} className="w-16 h-16 rounded object-cover bg-gray-700" onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/200/200'; }} />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium">{item.product.name}</p>
                                                        <p className="text-sm text-gray-400">Qty: {item.quantity}{item.size ? ` • Size: ${item.size}` : ''}{item.color ? ` • Color: ${item.color}` : ''}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold">{formatMoney(lineTotal, piCurrency)}</p>
                                                        <p className="text-xs text-gray-400">{formatMoney(item.product.price, piCurrency)} each</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-6 space-y-2 text-sm">
                                <div className="flex justify-between text-gray-300">
                                    <span>Subtotal</span>
                                    <span>{formatMoney(computedSubtotal, piCurrency)}</span>
                                </div>
                                <div className="flex justify-between text-gray-300">
                                    <span>Tax (10%)</span>
                                    <span>{formatMoney(computedTax, piCurrency)}</span>
                                </div>
                                <div className="flex justify-between text-gray-300">
                                    <span>Shipping</span>
                                    <span>{formatMoney(computedShipping, piCurrency)}</span>
                                </div>
                                <div className="border-t border-gray-700 pt-3 flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span className="text-ventauri">{totalDisplay}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-800 rounded-lg p-6 sticky top-24">
                            {!clientSecret || !stripePromise ? (
                                <div>
                                    <div>Preparing checkout...</div>
                                    {prepError && (
                                        <div className="mt-3 text-sm text-red-300">{prepError}</div>
                                    )}
                                </div>
                            ) : (
                                <Elements stripe={stripePromise} options={options} key={clientSecret || 'pi'}>
                                    <CheckoutForm />
                                </Elements>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


