import React, { useState, useEffect } from 'react';

interface Variant {
    id: string;
    size: string;
    title: string;
    description: string;
    stock: number;
    priceAdjust: number;
    weight: number;
    isActive: boolean;
    images: string[];
}

interface VariantManagerProps {
    productId: string;
    onClose: () => void;
}

const VariantManager: React.FC<VariantManagerProps> = ({ productId, onClose }) => {
    const [variants, setVariants] = useState<Variant[]>([]);
    const [availableSizes, setAvailableSizes] = useState<string[]>([]);
    const [enabledSizes, setEnabledSizes] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [newVariant, setNewVariant] = useState({
        title: '',
        description: '',
        stock: 0,
        priceAdjust: 0,
        weight: 0,
        isActive: true,
    });

    const apiURL = import.meta.env.VITE_BACKEND_URL || '';

    useEffect(() => {
        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch available sizes
            const sizesResponse = await fetch(`${apiURL}/api/products/sizes`, {
                credentials: 'include',
            });
            if (sizesResponse.ok) {
                const sizesData = await sizesResponse.json();
                setAvailableSizes(sizesData.data);
            }

            // Fetch product sizes configuration
            const productSizesResponse = await fetch(`${apiURL}/api/admin/products/${productId}/sizes`, {
                credentials: 'include',
            });
            if (productSizesResponse.ok) {
                const productSizesData = await productSizesResponse.json();
                setEnabledSizes(productSizesData.data.enabledSizes);
            }

            // Fetch existing variants
            const variantsResponse = await fetch(`${apiURL}/api/products/${productId}/variants`, {
                credentials: 'include',
            });
            if (variantsResponse.ok) {
                const variantsData = await variantsResponse.json();
                setVariants(variantsData.data || []);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSizes = async (enabledSizes: string[]) => {
        try {
            const response = await fetch(`${apiURL}/api/admin/products/${productId}/sizes`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabledSizes }),
            });

            if (response.ok) {
                setEnabledSizes(enabledSizes);
                // Refresh variants to show/hide based on new size configuration
                fetchData();
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to update sizes');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update sizes');
        }
    };

    const handleCreateVariant = async () => {
        if (!selectedSize) {
            setError('Please select a size');
            return;
        }

        try {
            const response = await fetch(`${apiURL}/api/admin/products/${productId}/variants`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newVariant,
                    size: selectedSize,
                }),
            });

            if (response.ok) {
                setShowCreateForm(false);
                setSelectedSize('');
                setNewVariant({
                    title: '',
                    description: '',
                    stock: 0,
                    priceAdjust: 0,
                    weight: 0,
                    isActive: true,
                });
                fetchData();
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to create variant');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create variant');
        }
    };

    const handleDeleteVariant = async (variantId: string) => {
        if (!confirm('Are you sure you want to delete this variant?')) return;

        try {
            const response = await fetch(`${apiURL}/api/admin/products/variants/${variantId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.ok) {
                fetchData();
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to delete variant');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete variant');
        }
    };

    const getAvailableSizesForCreation = () => {
        return enabledSizes.filter(size => !variants.some(v => v.size === size));
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-900 mt-2">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Manage Product Variants</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
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

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Size Configuration */}
                <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Size Configuration</h3>
                    <div className="grid grid-cols-7 gap-2">
                        {availableSizes.map(size => (
                            <label key={size} className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={enabledSizes.includes(size)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            handleUpdateSizes([...enabledSizes, size]);
                                        } else {
                                            handleUpdateSizes(enabledSizes.filter(s => s !== size));
                                        }
                                    }}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="text-gray-700 text-sm">{size}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Existing Variants */}
                <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Existing Variants</h3>
                    {variants.length === 0 ? (
                        <p className="text-gray-500">No variants created yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {variants.map(variant => (
                                <div key={variant.id} className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-gray-900 font-medium">
                                                {variant.size} - {variant.title}
                                            </h4>
                                            <p className="text-gray-600 text-sm mt-1">
                                                {variant.description}
                                            </p>
                                            <div className="text-gray-500 text-sm mt-2">
                                                Stock: {variant.stock} | 
                                                Price Adjust: €{variant.priceAdjust.toFixed(2)} | 
                                                Weight: {variant.weight}g
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteVariant(variant.id)}
                                            className="text-red-600 hover:text-red-700 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Create New Variant */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Create New Variant</h3>
                        {getAvailableSizesForCreation().length > 0 && (
                            <button
                                onClick={() => setShowCreateForm(!showCreateForm)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                {showCreateForm ? 'Cancel' : 'Add Variant'}
                            </button>
                        )}
                    </div>
                    {getAvailableSizesForCreation().length === 0 ? (
                        <p className="text-gray-500">All enabled sizes have variants. Enable more sizes above to create new variants.</p>
                    ) : showCreateForm ? (
                        <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                                <select
                                    value={selectedSize}
                                    onChange={(e) => setSelectedSize(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Select a size</option>
                                    {getAvailableSizesForCreation().map(size => (
                                        <option key={size} value={size}>{size}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={newVariant.title}
                                        onChange={(e) => setNewVariant({...newVariant, title: e.target.value})}
                                        placeholder="e.g., Black, Premium Print"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                                    <input
                                        type="number"
                                        value={newVariant.stock}
                                        onChange={(e) => setNewVariant({...newVariant, stock: parseInt(e.target.value) || 0})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={newVariant.description}
                                    onChange={(e) => setNewVariant({...newVariant, description: e.target.value})}
                                    placeholder="Describe this variant (color, print, material, etc.)"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price Adjustment</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newVariant.priceAdjust}
                                        onChange={(e) => setNewVariant({...newVariant, priceAdjust: parseFloat(e.target.value) || 0})}
                                        placeholder="0.00"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (g)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={newVariant.weight}
                                        onChange={(e) => setNewVariant({...newVariant, weight: parseFloat(e.target.value) || 0})}
                                        placeholder="0.0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleCreateVariant}
                                disabled={!selectedSize || !newVariant.title}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                            >
                                Create Variant
                            </button>
                        </div>
                    ) : (
                        <p className="text-gray-500">Click "Add Variant" to create a new product variant.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VariantManager;
