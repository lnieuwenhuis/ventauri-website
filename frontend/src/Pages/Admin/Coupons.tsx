import React, { useState, useEffect } from 'react';
import FormModal from '../../Components/Admin/FormModal';

interface Coupon {
    id: string;
    code: string;
    name: string;
    description: string;
    type: string;
    value: number;
    minOrderAmount: number;
    maxDiscount?: number;
    usageLimit?: number;
    usageCount: number;
    userUsageLimit?: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface CouponsResponse {
    data: Coupon[];
    total: number;
    page: number;
    limit: number;
}

interface CouponFormData extends Record<string, unknown> {
    id: string;
    code: string;
    name: string;
    description: string;
    type: string;
    value: number;
    minOrderAmount: number;
    maxDiscount?: number;
    usageLimit?: number;
    userUsageLimit?: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

const AdminCoupons: React.FC = () => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCoupons, setTotalCoupons] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const itemsPerPage = 10;

    const apiURL = import.meta.env.VITE_BACKEND_URL || "";

    const getAuthToken = () => {
        return localStorage.getItem('authToken') || localStorage.getItem('token');
    };

    const fetchCoupons = async (page: number = 1, search: string = '') => {
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
            
            const response = await fetch(`${apiURL}/api/admin/coupons/?${params}`, {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch coupons: ${response.status}`);
            }
            
            const result: CouponsResponse = await response.json();
            setCoupons(result.data);
            setTotalCoupons(result.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error fetching coupons:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons(currentPage, searchTerm);
    // eslint-disable-next-line
    }, [currentPage, searchTerm]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleCreateCoupon = () => {
        setEditingCoupon(null);
        setIsModalOpen(true);
    };

    const handleEditCoupon = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setIsModalOpen(true);
    };

    const handleSubmitCoupon = async (formData: CouponFormData) => {
        try {
            setModalLoading(true);
            const token = getAuthToken();
            if (!token) {
                setError('No authorization token found');
                return;
            }
    
            // Convert date strings to proper datetime format
            const processedFormData = {
                ...formData,
                startDate: new Date(formData.startDate + 'T00:00:00Z').toISOString(),
                endDate: new Date(formData.endDate + 'T23:59:59Z').toISOString()
            };
    
            const url = editingCoupon 
                ? `${apiURL}/api/admin/coupons/${editingCoupon.id}`
                : `${apiURL}/api/admin/coupons/`;
            
            const method = editingCoupon ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(processedFormData) // Use processed data
            });
            
            if (!response.ok) {
                throw new Error(`Failed to ${editingCoupon ? 'update' : 'create'} coupon`);
            }
            
            fetchCoupons(currentPage, searchTerm);
            setIsModalOpen(false);
        } catch (err) {
            console.error('Error submitting coupon:', err);
            setError(err instanceof Error ? err.message : 'Failed to submit coupon');
        } finally {
            setModalLoading(false);
        }
    };

    const convertCouponToFormData = (coupon: Coupon): CouponFormData => {
        return {
            id: coupon.id,
            code: coupon.code,
            name: coupon.name,
            description: coupon.description,
            type: coupon.type,
            value: coupon.value,
            minOrderAmount: coupon.minOrderAmount,
            maxDiscount: coupon.maxDiscount,
            usageLimit: coupon.usageLimit,
            userUsageLimit: coupon.userUsageLimit,
            startDate: coupon.startDate.split('T')[0], 
            endDate: coupon.endDate.split('T')[0], 
            isActive: coupon.isActive
        };
    };

    const couponFields = [
        {
            name: 'code',
            label: 'Coupon Code',
            type: 'text' as const,
            required: true,
            placeholder: 'Enter coupon code (e.g., SAVE20)'
        },
        {
            name: 'name',
            label: 'Coupon Name',
            type: 'text' as const,
            required: true,
            placeholder: 'Enter coupon name'
        },
        {
            name: 'description',
            label: 'Description',
            type: 'textarea' as const,
            required: true,
            placeholder: 'Enter coupon description'
        },
        {
            name: 'type',
            label: 'Discount Type',
            type: 'select' as const,
            required: true,
            options: [
                { value: 'percentage', label: 'Percentage' },
                { value: 'fixed', label: 'Fixed Amount' },
                { value: 'free_shipping', label: 'Free Shipping' }
            ]
        },
        {
            name: 'value',
            label: 'Discount Value',
            type: 'number' as const,
            required: true,
            placeholder: 'Enter discount value'
        },
        {
            name: 'minOrderAmount',
            label: 'Minimum Order Amount',
            type: 'number' as const,
            required: true,
            placeholder: '0.00'
        },
        {
            name: 'maxDiscount',
            label: 'Maximum Discount (Optional)',
            type: 'number' as const,
            required: false,
            placeholder: 'Enter maximum discount amount'
        },
        {
            name: 'usageLimit',
            label: 'Usage Limit (Optional)',
            type: 'number' as const,
            required: false,
            placeholder: 'Enter usage limit'
        },
        {
            name: 'userUsageLimit',
            label: 'Per User Usage Limit (Optional)',
            type: 'number' as const,
            required: false,
            placeholder: 'Enter per user usage limit'
        },
        {
            name: 'startDate',
            label: 'Start Date',
            type: 'date' as const,
            required: true
        },
        {
            name: 'endDate',
            label: 'End Date',
            type: 'date' as const,
            required: true
        },
        {
            name: 'isActive',
            label: 'Active',
            type: 'checkbox' as const,
            required: false
        }
    ];

    const toggleCouponStatus = async (couponId: string) => {
        try {
            const token = getAuthToken();
            if (!token) {
                setError('No authorization token found');
                return;
            }

            const response = await fetch(`${apiURL}/api/admin/coupons/${couponId}/status`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to update coupon status');
            }
            
            fetchCoupons(currentPage, searchTerm);
        } catch (err) {
            console.error('Error updating coupon status:', err);
            setError(err instanceof Error ? err.message : 'Failed to update coupon status');
        }
    };

    const deleteCoupon = async (couponId: string) => {
        if (!confirm('Are you sure you want to delete this coupon?')) {
            return;
        }

        try {
            const token = getAuthToken();
            if (!token) {
                setError('No authorization token found');
                return;
            }

            const response = await fetch(`${apiURL}/api/admin/coupons/${couponId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete coupon');
            }
            
            fetchCoupons(currentPage, searchTerm);
        } catch (err) {
            console.error('Error deleting coupon:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete coupon');
        }
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return isNaN(date.getTime()) 
                ? 'Invalid Date' 
                : date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid Date';
        }
    };

    const formatDiscount = (coupon: Coupon) => {
        switch (coupon.type) {
            case 'percentage':
                return `${coupon.value}%`;
            case 'fixed':
                return `$${coupon.value.toFixed(2)}`;
            case 'free_shipping':
                return 'Free Shipping';
            default:
                return `$${coupon.value.toFixed(2)}`;
        }
    };

    const isCouponActive = (coupon: Coupon) => {
        const now = new Date();
        const startDate = new Date(coupon.startDate);
        const endDate = new Date(coupon.endDate);
        return coupon.isActive && now >= startDate && now <= endDate;
    };

    const totalPages = Math.ceil(totalCoupons / itemsPerPage);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Coupons Management</h1>
                <button 
                    onClick={handleCreateCoupon}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    Add New Coupon
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
                                placeholder="Search coupons by code, name or description..."
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid Until</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12">
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            <span className="ml-3 text-gray-500">Loading coupons...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : coupons.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        No coupons found
                                    </td>
                                </tr>
                            ) : (
                                coupons.map((coupon) => (
                                    <tr key={coupon.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {coupon.code}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {formatDiscount(coupon)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {coupon.usageCount}/{coupon.usageLimit || '∞'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                isCouponActive(coupon)
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {isCouponActive(coupon) ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(coupon.endDate)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(coupon.startDate)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(coupon.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button 
                                                    onClick={() => handleEditCoupon(coupon)}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                                >
                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => toggleCouponStatus(coupon.id)}
                                                    className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                                        coupon.isActive 
                                                            ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500' 
                                                            : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                                                    }`}
                                                >
                                                    {coupon.isActive ? (
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
                                                    onClick={() => deleteCoupon(coupon.id)}
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
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCoupons)} of {totalCoupons} coupons
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

            <FormModal<CouponFormData>
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmitCoupon}
                title={editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                fields={couponFields}
                initialData={editingCoupon ? convertCouponToFormData(editingCoupon) : undefined}
                isLoading={modalLoading}
            />
        </div>
    );
};

export default AdminCoupons;