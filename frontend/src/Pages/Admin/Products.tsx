import React, { useState, useEffect, useMemo } from 'react';
import FormModal from '../../Components/Admin/FormModal';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    categoryId: string;
    images: string; // This is a JSON string from the backend
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
}

interface ProductsResponse {
    data: Product[];
    total: number;
    page: number;
    limit: number;
}

interface ProductFormData {
    name: string;
    description: string;
    price: number;
    categoryId: string;
    images?: string[]; // This remains an array for the form
    isActive: boolean;
}

const Products: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
    const itemsPerPage = 10;

    const apiURL = import.meta.env.VITE_BACKEND_URL || "";

    const getAuthToken = () => {
        return localStorage.getItem('authToken') || localStorage.getItem('token');
    };

    const fetchProducts = async (page: number = 1, search: string = '') => {
        try {
            setLoading(true);
            setError(null);
            
            const params = new URLSearchParams({
                page: page.toString(),
                limit: itemsPerPage.toString(),
                ...(search && { search })
            });
            
            const token = getAuthToken();
            if (!token) {
                setError('No authorization token found');
                setLoading(false);
                return;
            }
            
            const response = await fetch(`${apiURL}/api/admin/products/?${params}`, {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch products: ${response.status}`);
            }
            
            const result: ProductsResponse = await response.json();

            console.log(result)
            setProducts(result.data);
            setTotalProducts(result.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error fetching products:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const token = getAuthToken();
            if (!token) return;
            
            const response = await fetch(`${apiURL}/api/admin/categories/`, {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                setCategories(result.data || []);
            } else {
                console.error('Failed to fetch categories:', response.status);
            }
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    useEffect(() => {
        fetchProducts(currentPage, searchTerm);
        fetchCategories();
    // eslint-disable-next-line
    }, [currentPage, searchTerm]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleCreateProduct = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleSubmitProduct = async (formData: any) => {
        try {
            setModalLoading(true);
            const token = getAuthToken();
            if (!token) {
                setError('No authorization token found');
                return;
            }
    
            // Convert images array to JSON string for backend
            const processedData = {
                ...formData,
                images: Array.isArray(formData.images) 
                    ? JSON.stringify(formData.images.filter((url: string) => url.trim() !== ''))
                    : JSON.stringify([])
            };
    
            const url = editingProduct 
                ? `${apiURL}/api/admin/products/${editingProduct.id}`
                : `${apiURL}/api/admin/products/`;
            
            const method = editingProduct ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(processedData)
            });
            
            if (!response.ok) {
                throw new Error(`Failed to ${editingProduct ? 'update' : 'create'} product`);
            }
            
            fetchProducts(currentPage, searchTerm);
            setIsModalOpen(false);
        } catch (err) {
            console.error('Error submitting product:', err);
            setError(err instanceof Error ? err.message : 'Failed to submit product');
        } finally {
            setModalLoading(false);
        }
    };

    const convertProductToFormData = (product: Product): ProductFormData => {
        let parsedImages: string[] = [];
        try {
            if (product.images && product.images.trim() !== '') {
                parsedImages = JSON.parse(product.images);
                if (!Array.isArray(parsedImages)) {
                    parsedImages = [];
                }
            }
        } catch (error) {
            console.error('Error parsing product images:', error);
            parsedImages = [];
        }
        
        return {
            name: product.name,
            description: product.description,
            price: product.price,
            categoryId: product.categoryId,
            images: parsedImages,
            isActive: product.isActive
        };
    };

    const productFields = useMemo(() => [
        {
            name: 'name',
            label: 'Product Name',
            type: 'text' as const,
            required: true,
            placeholder: 'Enter product name'
        },
        {
            name: 'description',
            label: 'Description',
            type: 'textarea' as const,
            required: true,
            placeholder: 'Enter product description'
        },
        {
            name: 'price',
            label: 'Price',
            type: 'number' as const,
            required: true,
            placeholder: '0.00'
        },
        {
            name: 'categoryId',
            label: 'Category',
            type: 'select' as const,
            required: true,
            options: categories.map(cat => ({ value: cat.id, label: cat.name }))
        },
        {
            name: 'images',
            label: 'Image URL',
            type: 'array' as const,
            arrayType: 'url' as const,
            required: false,
            placeholder: 'https://example.com/image.jpg'
        },
        {
            name: 'isActive',
            label: 'Active',
            type: 'checkbox' as const,
            required: false
        }
    ], [categories]);

    const toggleProductStatus = async (productId: string) => {
        try {
            const token = getAuthToken();
            if (!token) {
                setError('No authorization token found');
                return;
            }

            const response = await fetch(`${apiURL}/api/admin/products/${productId}/status`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to update product status');
            }
            
            fetchProducts(currentPage, searchTerm);
        } catch (err) {
            console.error('Error updating product status:', err);
            setError(err instanceof Error ? err.message : 'Failed to update product status');
        }
    };

    const deleteProduct = async (productId: string) => {
        if (!confirm('Are you sure you want to delete this product?')) {
            return;
        }

        try {
            const token = getAuthToken();
            if (!token) {
                setError('No authorization token found');
                return;
            }

            const response = await fetch(`${apiURL}/api/admin/products/${productId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete product');
            }
            
            fetchProducts(currentPage, searchTerm);
        } catch (err) {
            console.error('Error deleting product:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete product');
        }
    };

    const totalPages = Math.ceil(totalProducts / itemsPerPage);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
                <button 
                    onClick={handleCreateProduct}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    Add New Product
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search products by name or description..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12">
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            <span className="ml-3 text-gray-500">Loading products...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No products found
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => {
                                    // Parse images from JSON string to array
                                    let productImages: string[] = [];
                                    try {
                                        if (typeof product.images === 'string' && product.images.trim()) {
                                            productImages = JSON.parse(product.images);
                                        } else if (Array.isArray(product.images)) {
                                            productImages = product.images;
                                        }
                                    } catch (error) {
                                        console.warn('Failed to parse product images:', error);
                                        productImages = [];
                                    }
                                
                                    return (
                                        <tr key={product.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {productImages && productImages.length > 0 && (
                                                        <div className="flex -space-x-2 mr-4">
                                                            {productImages.slice(0, 3).map((imageUrl, index) => (
                                                                <img 
                                                                    key={index}
                                                                    className="h-12 w-12 rounded-lg object-cover border-2 border-white" 
                                                                    src={imageUrl && /^https?:\/\/.+/.test(imageUrl) ? imageUrl : 'https://picsum.photos/200'} 
                                                                    alt={`${product.name} ${index + 1}`}
                                                                />
                                                            ))}
                                                            {productImages.length > 3 && (
                                                                <div className="h-12 w-12 rounded-lg bg-gray-200 border-2 border-white flex items-center justify-center text-xs text-gray-600">
                                                                    +{productImages.length - 3}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {product.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500 max-w-xs truncate">
                                                            {product.description}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    ${product.price.toFixed(2)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    product.isActive 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {product.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(product.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button 
                                                        onClick={() => handleEditProduct(product)}
                                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                                    >
                                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Edit
                                                    </button>
                                                    <button 
                                                        onClick={() => toggleProductStatus(product.id)}
                                                        className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                                            product.isActive 
                                                                ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500' 
                                                                : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                                                        }`}
                                                    >
                                                        {product.isActive ? (
                                                            <>
                                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                                                                </svg>
                                                                Deactivate
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                Activate
                                                            </>
                                                        )}
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteProduct(product.id)}
                                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                                                    >
                                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalProducts)} of {totalProducts} products
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Previous
                            </button>
                            <span className="px-3 py-1 text-sm">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            <FormModal<ProductFormData>
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmitProduct}
                title={editingProduct ? 'Edit Product' : 'Create New Product'}
                fields={productFields}
                initialData={editingProduct ? convertProductToFormData(editingProduct) : { isActive: true }}
                isLoading={modalLoading}
            />
        </div>
    );
};

export default Products;