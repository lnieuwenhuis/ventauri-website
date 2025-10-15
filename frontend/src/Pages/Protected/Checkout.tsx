import { useEffect, useMemo, useRef, useState } from 'react';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import Navbar from '../../Components/Navbar';
import countries from 'i18n-iso-countries';
import enCountries from 'i18n-iso-countries/langs/en.json';
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
    const [piCurrency, setPiCurrency] = useState<string>('eur');
    const [prepError, setPrepError] = useState<string | null>(null);
    const piRequestedRef = useRef(false);
    const [addressesReady, setAddressesReady] = useState(false);

    // Load Stripe publishable key once
    useEffect(() => {
        const loadKey = async () => {
            const keyRes = await fetch(`${backendUrl}/api/checkout/publishable-key`, { credentials: 'include' });
            const keyJson = await keyRes.json();
            const publishableKey = keyJson.publishableKey || 'pk_test_XXXXXXXXXXXXXXXXXXXXXXXX';
            setStripePromise(loadStripe(publishableKey));
        };
        loadKey();
    }, []);

    useEffect(() => {
        if (!addressesReady) return; // controlled by AddressSection readiness
        if (items.length === 0) return;
        if (piRequestedRef.current || clientSecret) return;

        const start = async () => {
            const persistedOrderIds = (() => {
                try { return JSON.parse(localStorage.getItem('checkout_order_ids') || '[]') as string[]; } catch { return []; }
            })();
            const startIntent = async (existingIds: string[]) => {
                setPrepError(null);
                const payload = {
                    items: items.map((i) => ({
                        productId: i.product.id,  
                        productVariantId: i.productVariantId || null, 
                        quantity: i.quantity,
                    })),
                    shippingAddressId: localStorage.getItem('default_shipping_address_id') || '',
                    billingAddressId: localStorage.getItem('default_billing_address_id') || '',
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
                    setClientSecret(json.clientSecret);
                    if (typeof json.amount === 'number') setPiAmount(json.amount);
                    if (typeof json.currency === 'string') setPiCurrency(json.currency);
                    if (Array.isArray(json.orderIds)) {
                        try { localStorage.setItem('checkout_order_ids', JSON.stringify(json.orderIds)); } catch (err) { console.warn('persist order ids failed', err); }
                    }
                    piRequestedRef.current = true;
                    return true;
                } else {
                    const reason = json.error || (!json.clientSecret && res.ok ? 'Missing clientSecret in response' : 'Unknown error');
                    setPrepError(`${reason}`);
                    return false;
                }
            };
            const ok = await startIntent(Array.isArray(persistedOrderIds) ? persistedOrderIds : []);
            if (!ok) {
                try { localStorage.removeItem('checkout_order_ids'); } catch { /* ignore */ }
                await startIntent([]);
            }
        };
        start();
    }, [addressesReady, items, clientSecret]);

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

    const computedSubtotal = items.reduce((sum, i) => {
        const unitPrice = i.product.price + (i.productVariant?.priceAdjust || 0);
        return sum + unitPrice * i.quantity;
    }, 0);
    // All-inclusive pricing: tax and shipping are included in product prices
    const computedTotal = computedSubtotal;

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
                                    const unitPrice = item.product.price + (item.productVariant?.priceAdjust || 0);
                                    const lineTotal = unitPrice * item.quantity;
                                    return (
                                        <div key={item.id} className="py-4 flex items-center gap-4">
                                            <img src={img} alt={item.product.name} className="w-16 h-16 rounded object-cover bg-gray-700" onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/200/200'; }} />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium">{item.product.name}</p>
                                                        <p className="text-sm text-gray-400">
                                                            Qty: {item.quantity}
                                                            {item.productVariant && (
                                                                <>
                                                                    • Size: {item.productVariant.size}
                                                                    • {item.productVariant.title}
                                                                </>
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold">{formatMoney(lineTotal, piCurrency)}</p>
                                                        <p className="text-xs text-gray-400">{formatMoney(unitPrice, piCurrency)} each</p>
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
                                <div className="text-xs text-gray-400">Prices include tax and shipping.</div>
                                <div className="border-t border-gray-700 pt-3 flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span className="text-ventauri">{totalDisplay}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Address + Payment */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Address selection */}
                        <AddressSection onSelectionChange={(ready) => {
                            setAddressesReady(ready);
                            if (!ready) {
                                // Reset any pending PI state to avoid backend calls when not ready
                                piRequestedRef.current = false;
                                setClientSecret(null);
                                setPiAmount(null);
                                try { localStorage.removeItem('checkout_order_ids'); } catch { /* ignore */ }
                            }
                        }} />
                        <div className="bg-gray-800 rounded-lg p-6 sticky top-24">
                            {!addressesReady ? (
                                <div className="text-sm text-gray-300">Select a shipping and billing address to start payment.</div>
            ) : !clientSecret || !stripePromise ? (
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

// Address selection UI
function AddressSection({ onSelectionChange }: { onSelectionChange?: (ready: boolean) => void }) {
    const [addresses, setAddresses] = useState<Array<{ id: string; street: string; city: string; state: string; zipCode: string; country: string; isDefault: boolean }>>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedShip, setSelectedShip] = useState<string>('');
    const [selectedBill, setSelectedBill] = useState<string>('');
    const [creating, setCreating] = useState(false);
    const [sameAsShipping, setSameAsShipping] = useState(true);
    const [newAddr, setNewAddr] = useState({ country: '', zipCode: '', house: '', add: '', street: '', city: '', state: '' });
    const createFormRef = useRef<HTMLDivElement | null>(null);
    const openCreateAddress = () => {
        setCreating(true);
        setTimeout(() => {
            try { createFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch { /* ignore */ }
        }, 0);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    countries.registerLocale(enCountries as any);
    const countryOptions = useMemo(() => {
        return Object.entries(countries.getNames('en', { select: 'official' })).map(([code, name]) => ({ code, name }));
    }, []);

    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${backendUrl}/api/addresses/`, { credentials: 'include' });
                const json: { data?: Array<{ id: string; street: string; city: string; state: string; zipCode: string; country: string; isDefault: boolean }> } = await res.json();
                const list = json.data || [];
                setAddresses(list);
                const def = list.find((a) => (a as { isDefault?: boolean }).isDefault);
                const inList = (id: string) => list.some((a) => a.id === id);
                const shipStored = localStorage.getItem('default_shipping_address_id') || '';
                const billStored = localStorage.getItem('default_billing_address_id') || '';

                if (list.length === 0) {
                    setSelectedShip('');
                    setSelectedBill('');
                    try { localStorage.removeItem('default_shipping_address_id'); } catch { /* ignore */ }
                    try { localStorage.removeItem('default_billing_address_id'); } catch { /* ignore */ }
                } else {
                    const ship = inList(shipStored) ? shipStored : (def ? def.id : '');
                    const bill = sameAsShipping ? ship : (inList(billStored) && billStored !== ship ? billStored : '');
                    setSelectedShip(ship);
                    setSelectedBill(bill);
                }
            } catch {
                setError('Failed to load addresses');
            } finally {
                setLoading(false);
            }
        };
        fetchAddresses();
    }, [sameAsShipping]);

    // Auto-resolve disabled: full manual entry in inline form

    useEffect(() => {
        const inList = (id: string) => addresses.some((a) => a.id === id);
        if (!inList(selectedShip)) {
            try { localStorage.removeItem('default_shipping_address_id'); } catch { /* ignore */ }
        } else if (selectedShip) {
            localStorage.setItem('default_shipping_address_id', selectedShip);
        }
        if (sameAsShipping) {
            if (selectedBill !== selectedShip) setSelectedBill(selectedShip);
        } else if (!inList(selectedBill) || selectedBill === selectedShip) {
            // user wants separate billing, but it must be different and valid
            setSelectedBill('');
            try { localStorage.removeItem('default_billing_address_id'); } catch { /* ignore */ }
        } else if (selectedBill) {
            localStorage.setItem('default_billing_address_id', selectedBill);
        }
        const ready = Boolean(inList(selectedShip) && inList(selectedBill));
        if (onSelectionChange) onSelectionChange(ready);
    }, [selectedShip, selectedBill, sameAsShipping, addresses, onSelectionChange]);

    return (
        <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-ventauri">Shipping & Billing Address</h2>
            {loading ? (
                <div className="text-gray-300 text-sm">Loading addresses…</div>
            ) : error ? (
                <div className="text-red-300 text-sm">{error}</div>
            ) : addresses.length === 0 ? (
                <div className="text-gray-300 text-sm">
                    You have no saved addresses yet. Create one below.
                </div>
            ) : (
                <div className="space-y-4">
                    <label className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" className="accent-ventauri" checked={sameAsShipping} onChange={(e) => setSameAsShipping(e.target.checked)} />
                        <span>Billing same as shipping</span>
                    </label>
                    <div>
                        <label className="block text-sm text-gray-300 mb-1">Shipping Address</label>
                        <select value={selectedShip} onChange={(e) => setSelectedShip(e.target.value)} className="w-full bg-gray-700 text-white px-3 py-2 rounded">
                            <option value="">Select an address</option>
                            {addresses.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.street}, {a.city}, {a.state} {a.zipCode}, {a.country}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <div className="flex items-center justify-between">
                            <label className="block text-sm text-gray-300 mb-1">Billing Address</label>
                            {!sameAsShipping && addresses.length < 2 && (
                                <button type="button" onClick={openCreateAddress} className="text-xs text-ventauri underline underline-offset-2">Create new</button>
                            )}
                        </div>
                        <select value={selectedBill} onChange={(e) => setSelectedBill(e.target.value)} className="w-full bg-gray-700 text-white px-3 py-2 rounded" disabled={sameAsShipping}>
                            <option value="">Select an address</option>
                            {addresses.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.street}, {a.city}, {a.state} {a.zipCode}, {a.country}
                                </option>
                            ))}
                        </select>
                        {!sameAsShipping && addresses.length < 2 && (
                            <p className="mt-1 text-xs text-red-300">You only have one address. Please create a separate billing address or enable “Billing same as shipping”.</p>
                        )}
                    </div>
                    <p className="text-xs text-gray-400">The selected addresses will be used for this order. You can manage addresses in your profile.</p>
                </div>
            )}

            {/* Inline create address */}
            <div ref={createFormRef} className="mt-6 border-t border-gray-700 pt-4">
                <button onClick={() => setCreating((v) => !v)} className="text-sm bg-gray-700 px-3 py-2 rounded">
                    {creating ? 'Hide address form' : 'Add new address'}
                </button>
                {creating && (
                    <div className="mt-3 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <select className="w-full bg-gray-700 text-white px-3 py-2 rounded" value={newAddr.country} onChange={(e) => setNewAddr((a) => ({ ...a, country: e.target.value }))}>
                                <option value="">Country</option>
                                {countryOptions.map((c) => (
                                    <option key={c.code} value={c.code}>{c.name}</option>
                                ))}
                            </select>
                            <input className="w-full bg-gray-700 text-white px-3 py-2 rounded" placeholder="ZIP / Postal" value={newAddr.zipCode} onChange={(e) => setNewAddr((a) => ({ ...a, zipCode: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <input className="w-full bg-gray-700 text-white px-3 py-2 rounded" placeholder="House number" value={newAddr.house} onChange={(e) => setNewAddr((a) => ({ ...a, house: e.target.value }))} />
                            <input className="w-full bg-gray-700 text-white px-3 py-2 rounded" placeholder="Addition (optional)" value={newAddr.add} onChange={(e) => setNewAddr((a) => ({ ...a, add: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <input className="w-full bg-gray-700 text-white px-3 py-2 rounded" placeholder="Street name" value={newAddr.street} onChange={(e) => setNewAddr((a) => ({ ...a, street: e.target.value }))} />
                            <input className="w-full bg-gray-700 text-white px-3 py-2 rounded" placeholder="City" value={newAddr.city} onChange={(e) => setNewAddr((a) => ({ ...a, city: e.target.value }))} />
                        </div>
                        <input className="w-full bg-gray-700 text-white px-3 py-2 rounded" placeholder="State" value={newAddr.state} onChange={(e) => setNewAddr((a) => ({ ...a, state: e.target.value }))} />
                        <button type="button" onClick={async () => {
                            const payload = { street: `${newAddr.house} ${newAddr.street}`.trim(), city: newAddr.city, state: newAddr.state, zipCode: newAddr.zipCode, country: newAddr.country };
                            const res = await fetch(`${backendUrl}/api/addresses/`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                            if (res.ok) {
                                // refresh list and set as selected
                                const j = await fetch(`${backendUrl}/api/addresses/`, { credentials: 'include' });
                                const jj = await j.json();
                                type Addr = { id: string; street: string; city: string; state: string; zipCode: string; country: string; isDefault: boolean };
                                const raw: Array<Partial<Addr>> = jj.data || [];
                                const list: Addr[] = raw.map((x) => ({
                                    id: String(x.id || ''),
                                    street: String(x.street || ''),
                                    city: String(x.city || ''),
                                    state: String(x.state || ''),
                                    zipCode: String(x.zipCode || ''),
                                    country: String(x.country || ''),
                                    isDefault: Boolean(x.isDefault),
                                }));
                                setAddresses(list);
                                const created = list.find((x: Addr) => x.street === payload.street && x.zipCode === payload.zipCode);
                                if (created) { setSelectedShip(created.id); setSelectedBill(created.id); }
                                if (onSelectionChange) onSelectionChange(true);
                                setCreating(false);
                            }
                        }} className="bg-ventauri text-black px-3 py-2 rounded">Save Address</button>
                    </div>
                )}
            </div>
        </div>
    );
}


