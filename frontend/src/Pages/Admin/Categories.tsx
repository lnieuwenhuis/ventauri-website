import React, { useState, useEffect, useMemo } from 'react';
import FormModal from '../../Components/Admin/FormModal';

interface Category {
    id: string;
    name: string;
    desc: string;
    parent_id?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
    deletedAt?: string | null;
}

interface CategoriesResponse {
    data: Category[];
    total: number;
    page: number;
    limit: number;
}

interface CategoryFormData extends Record<string, unknown> {
    name: string;
    desc: string;
    parent_id?: string;
    isActive: boolean;
}

const AdminCategories: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCategories, setTotalCategories] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [parentCategories, setParentCategories] = useState<{id: string, name: string}[]>([]);
    const itemsPerPage = 10;

    const apiURL = import.meta.env.VITE_BACKEND_URL || "";

    const getAuthToken = () => {
        return localStorage.getItem('authToken') || localStorage.getItem('token');
    };

    const fetchCategories = async (page: number = 1, search: string = '') => {
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
            
            const response = await fetch(`${apiURL}/api/admin/categories/?${params}`, {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch categories: ${response.status}`);
            }
            
            const result: CategoriesResponse = await response.json();
            setCategories(result.data);
            setTotalCategories(result.total);
            
            // Set parent categories for the dropdown (exclude current category when editing)
            const availableParents = result.data.filter(cat => 
                editingCategory ? cat.id !== editingCategory.id : true
            );
            setParentCategories(availableParents.map(cat => ({ id: cat.id, name: cat.name })));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error fetching categories:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories(currentPage, searchTerm);
    // eslint-disable-next-line
    }, [currentPage, searchTerm]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleCreateCategory = () => {
        setEditingCategory(null);
        setIsModalOpen(true);
    };

    const handleEditCategory = (category: Category) => {
        setEditingCategory(category);
        setIsModalOpen(true);
    };

    const handleSubmitCategory = async (formData: CategoryFormData) => {
        try {
            setModalLoading(true);
            const token = getAuthToken();
            if (!token) {
                setError('No authorization token found');
                return;
            }

            const url = editingCategory 
                ? `${apiURL}/api/admin/categories/${editingCategory.id}`
                : `${apiURL}/api/admin/categories/`;
            
            const method = editingCategory ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                throw new Error(`Failed to ${editingCategory ? 'update' : 'create'} category`);
            }
            
            fetchCategories(currentPage, searchTerm);
            setIsModalOpen(false);
        } catch (err) {
            console.error('Error submitting category:', err);
            setError(err instanceof Error ? err.message : 'Failed to submit category');
        } finally {
            setModalLoading(false);
        }
    };

    const convertCategoryToFormData = (category: Category): CategoryFormData => {
        return {
            name: category.name,
            desc: category.desc,
            parent_id: category.parent_id || '',
            isActive: category.isActive
        };
    };

    const categoryFields = useMemo(() => [
        {
            name: 'name',
            label: 'Category Name',
            type: 'text' as const,
            required: true,
            placeholder: 'Enter category name'
        },
        {
            name: 'desc',
            label: 'Description',
            type: 'textarea' as const,
            required: true,
            placeholder: 'Enter category description'
        },
        {
            name: 'parent_id',
            label: 'Parent Category',
            type: 'select' as const,
            required: false,
            options: [
                { value: '', label: 'Root Category (No Parent)' },
                ...parentCategories.map(cat => ({ value: cat.id, label: cat.name }))
            ]
        },
        {
            name: 'isActive',
            label: 'Active',
            type: 'checkbox' as const,
            required: false
        }
    ], [parentCategories]);

    const toggleCategoryStatus = async (categoryId: string) => {
        try {
            const token = getAuthToken();
            if (!token) {
                setError('No authorization token found');
                return;
            }

            const response = await fetch(`${apiURL}/api/admin/categories/${categoryId}/status`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to update category status');
            }
            
            fetchCategories(currentPage, searchTerm);
        } catch (err) {
            console.error('Error updating category status:', err);
            setError(err instanceof Error ? err.message : 'Failed to update category status');
        }
    };

    const deleteCategory = async (categoryId: string) => {
        if (!confirm('Are you sure you want to delete this category?')) {
            return;
        }

        try {
            const token = getAuthToken();
            if (!token) {
                setError('No authorization token found');
                return;
            }

            const response = await fetch(`${apiURL}/api/admin/categories/${categoryId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete category');
            }
            
            fetchCategories(currentPage, searchTerm);
        } catch (err) {
            console.error('Error deleting category:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete category');
        }
    };

    const totalPages = Math.ceil(totalCategories / itemsPerPage);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Categories Management</h1>
                <button 
                    onClick={handleCreateCategory}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    Add New Category
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
                                placeholder="Search categories by name or description..."
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12">
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            <span className="ml-3 text-gray-500">Loading categories...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : categories.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No categories found
                                    </td>
                                </tr>
                            ) : (
                                categories.map((category) => {
                                    // Find parent category name
                                    const parentCategory = categories.find(cat => cat.id === category.parent_id);
                                    
                                    return (
                                        <tr key={category.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {category.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 max-w-xs truncate">
                                                    {category.desc}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {parentCategory ? parentCategory.name : 'Root Category'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    category.isActive 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {category.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(category.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button 
                                                        onClick={() => handleEditCategory(category)}
                                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                                    >
                                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Edit
                                                    </button>
                                                    <button 
                                                        onClick={() => toggleCategoryStatus(category.id)}
                                                        className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                                            category.isActive
                                                                ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500' 
                                                                : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                                                        }`}
                                                    >
                                                        {category.isActive ? (
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
                                                        onClick={() => deleteCategory(category.id)}
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
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCategories)} of {totalCategories} categories
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

            <FormModal<CategoryFormData>
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmitCategory}
                title={editingCategory ? 'Edit Category' : 'Create New Category'}
                fields={categoryFields}
                initialData={editingCategory ? convertCategoryToFormData(editingCategory) : undefined}
                isLoading={modalLoading}
            />
        </div>
    );
};

export default AdminCategories;