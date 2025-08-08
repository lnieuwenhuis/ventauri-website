import { useEffect, useMemo, useState } from 'react';
import Navbar from '../../Components/Navbar';
import usePageTitle from '../../hooks/usePageTitle';
import countries from 'i18n-iso-countries';
import enCountries from 'i18n-iso-countries/langs/en.json';

type Address = {
    id: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
};

const backendUrl = import.meta.env.VITE_BACKEND_URL || '';

export default function Addresses() {
    usePageTitle('Addresses');
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState<Partial<Address>>({ street: '', city: '', state: '', zipCode: '', country: '' });
    const [editingId, setEditingId] = useState<string | null>(null);
    const isEditing = useMemo(() => !!editingId, [editingId]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    countries.registerLocale(enCountries as any);
    const countryOptions = useMemo(() => Object.entries(countries.getNames('en', { select: 'official' })).map(([code, name]) => ({ code, name })), []);

    const fetchAddresses = async () => {
        try {
        setLoading(true);
        const res = await fetch(`${backendUrl}/api/addresses/`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load addresses');
        const data: { data?: Address[] } = await res.json();
        setAddresses(data.data || []);
        } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load addresses');
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, []);

    const clearForm = () => {
            setForm({ street: '', city: '', state: '', zipCode: '', country: '' });
            setEditingId(null);
        };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const payload = {
        street: String(form.street || '').trim(),
        city: String(form.city || '').trim(),
        state: String(form.state || '').trim(),
        zipCode: String(form.zipCode || '').trim(),
        country: String(form.country || '').trim(),
        };
        if (!payload.street || !payload.city || !payload.state || !payload.zipCode || !payload.country) {
        setError('All fields are required');
        return;
        }
        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing ? `${backendUrl}/api/addresses/${editingId}` : `${backendUrl}/api/addresses/`;
        const res = await fetch(url, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) {
        const t = await res.text();
        setError(t || 'Failed to save address');
        return;
        }
        clearForm();
        fetchAddresses();
    };

    const remove = async (id: string) => {
        if (!confirm('Delete this address?')) return;
        const res = await fetch(`${backendUrl}/api/addresses/${id}`, { method: 'DELETE', credentials: 'include' });
        if (res.ok) fetchAddresses();
    };

    const setDefault = async (id: string) => {
        const res = await fetch(`${backendUrl}/api/addresses/${id}/default`, { method: 'PUT', credentials: 'include' });
        if (res.ok) fetchAddresses();
    };

    const startEdit = (a: Address) => {
        setEditingId(a.id);
        setForm({ street: a.street, city: a.city, state: a.state, zipCode: a.zipCode, country: a.country });
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold mb-6">My Addresses</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-ventauri">{isEditing ? 'Edit Address' : 'Add New Address'}</h2>
                {error && <div className="mb-3 text-sm text-red-300">{error}</div>}
                <form onSubmit={submit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <select className="w-full bg-gray-700 text-white px-3 py-2 rounded" value={form.country || ''} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}>
                    <option value="">Country</option>
                    {countryOptions.map((c) => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                    </select>
                    <input className="w-full bg-gray-700 text-white px-3 py-2 rounded" placeholder="ZIP / Postal" value={form.zipCode || ''} onChange={(e) => setForm((f) => ({ ...f, zipCode: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <input className="w-full bg-gray-700 text-white px-3 py-2 rounded" placeholder="House number" value={(form.street || '').split(' ')[0]} onChange={(e) => setForm((f) => ({ ...f, street: `${e.target.value} ${String(f.street||'').split(' ').slice(1).join(' ').trim()}`.trim() }))} />
                    <input className="w-full bg-gray-700 text-white px-3 py-2 rounded" placeholder="Addition (optional)" value={String(form.street||'').split(' ').slice(1).join(' ')} onChange={(e) => setForm((f) => ({ ...f, street: `${String(f.street||'').split(' ')[0]} ${e.target.value}`.trim() }))} />
                </div>
                <div className="text-xs text-gray-400">Auto-fills when country, postal code and house number are entered.</div>
                <div className="grid grid-cols-2 gap-3">
                    <input className="w-full bg-gray-700 text-white px-3 py-2 rounded" placeholder="Street name" value={form.street ? String(form.street).split(' ').slice(1).join(' ') : ''} onChange={(e) => setForm((f) => ({ ...f, street: `${String(f.street||'').split(' ')[0]} ${e.target.value}`.trim() }))} />
                    <input className="w-full bg-gray-700 text-white px-3 py-2 rounded" placeholder="City" value={form.city || ''} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
                </div>
                <input className="w-full bg-gray-700 text-white px-3 py-2 rounded" placeholder="State" value={form.state || ''} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
                <div className="flex gap-2">
                    <button className="bg-ventauri text-black px-4 py-2 rounded">{isEditing ? 'Update' : 'Add Address'}</button>
                    {isEditing && (
                    <button type="button" onClick={clearForm} className="bg-gray-700 text-white px-4 py-2 rounded">Cancel</button>
                    )}
                </div>
                </form>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-ventauri">Saved Addresses</h2>
                {loading ? (
                <div className="text-gray-300">Loading…</div>
                ) : addresses.length === 0 ? (
                <div className="text-gray-300">No addresses yet.</div>
                ) : (
                <ul className="space-y-4">
                    {addresses.map((a) => (
                    <li key={a.id} className="border border-gray-700 rounded p-4 flex items-start justify-between gap-4">
                        <div>
                        <div className="font-medium">{a.street}</div>
                        <div className="text-sm text-gray-300">{a.city}, {a.state} {a.zipCode}</div>
                        <div className="text-sm text-gray-300">{a.country}</div>
                        {a.isDefault && <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-green-900 text-green-300">Default</span>}
                        </div>
                        <div className="flex gap-2">
                        {!a.isDefault && (
                            <button onClick={() => setDefault(a.id)} className="text-xs bg-gray-700 px-3 py-2 rounded">Set Default</button>
                        )}
                        <button onClick={() => startEdit(a)} className="text-xs bg-blue-700 px-3 py-2 rounded">Edit</button>
                        <button onClick={() => remove(a.id)} className="text-xs bg-red-700 px-3 py-2 rounded">Delete</button>
                        </div>
                    </li>
                    ))}
                </ul>
                )}
            </div>
            </div>
        </div>
        </div>
    );
}


