import React, { useState, useEffect } from 'react';
import FormModal from '../../Components/Admin/FormModal';

interface PaymentMethod {
    id: string;
    userId: string;
    type: string;
    provider: string;
    last4: string;
    expiryMonth?: number;
    expiryYear?: number;
    holderName: string;
    isDefault: boolean;
    isActive: boolean;
    createdAt: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
}

interface PaymentMethodsResponse {
    data: PaymentMethod[];
    total: number;
    page: number;
    limit: number;
}

interface PaymentMethodFormData extends Record<string, unknown> {
    id: string;
    userId: string;
    type: string;
    provider: string;
    last4: string;
    expiryMonth?: number;
    expiryYear?: number;
    holderName: string;
    isDefault: boolean;
    isActive: boolean;
}

export default function Payments() {
    const [payments, setPayments] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPayments, setTotalPayments] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState<PaymentMethod | null>(null);
    const [users, setUsers] = useState<{id: string, firstName: string, lastName: string, email: string}[]>([]);
    const itemsPerPage = 10;

    const apiURL = import.meta.env.VITE_BACKEND_URL || "";

    const getAuthToken = () => {
        return localStorage.getItem('authToken') || localStorage.getItem('token');
    };

    // Payment method form fields
    const paymentFields = [
        {
            name: 'userId' as keyof PaymentMethodFormData,
            label: 'User',
            type: 'select' as const,
            required: true,
            options: users.map(user => ({
                value: user.id,
                label: `${user.firstName} ${user.lastName} (${user.email})`
            }))
        },
        {
            name: 'type' as keyof PaymentMethodFormData,
            label: 'Payment Type',
            type: 'select' as const,
            required: true,
            options: [
                { value: 'credit_card', label: 'Credit Card' },
                { value: 'debit_card', label: 'Debit Card' },
                { value: 'paypal', label: 'PayPal' },
                { value: 'apple_pay', label: 'Apple Pay' },
                { value: 'google_pay', label: 'Google Pay' },
                { value: 'bank_transfer', label: 'Bank Transfer' }
            ]
        },
        {
            name: 'provider' as keyof PaymentMethodFormData,
            label: 'Provider',
            type: 'text' as const,
            required: true,
            placeholder: 'e.g., Visa, Mastercard, PayPal'
        },
        {
            name: 'last4' as keyof PaymentMethodFormData,
            label: 'Last 4 Digits',
            type: 'text' as const,
            required: true,
            placeholder: 'Last 4 digits of card/account'
        },
        {
            name: 'expiryMonth' as keyof PaymentMethodFormData,
            label: 'Expiry Month',
            type: 'number' as const,
            required: false,
            placeholder: 'MM (1-12)'
        },
        {
            name: 'expiryYear' as keyof PaymentMethodFormData,
            label: 'Expiry Year',
            type: 'number' as const,
            required: false,
            placeholder: 'YYYY'
        },
        {
            name: 'holderName' as keyof PaymentMethodFormData,
            label: 'Holder Name',
            type: 'text' as const,
            required: true,
            placeholder: 'Name on card/account'
        },
        {
            name: 'isDefault' as keyof PaymentMethodFormData,
            label: 'Set as Default',
            type: 'checkbox' as const,
            required: false
        },
        {
            name: 'isActive' as keyof PaymentMethodFormData,
            label: 'Active',
            type: 'checkbox' as const,
            required: false
        }
    ];

    const fetchUsers = async () => {
        try {
            const token = getAuthToken();
            if (!token) return;
            
            const response = await fetch(`${apiURL}/api/admin/users?limit=1000`, {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                setUsers(result.data || []);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const fetchPayments = async (page: number = 1, search: string = '') => {
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
            
            const response = await fetch(`${apiURL}/api/admin/payment-methods/?${params}`, {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch payment methods: ${response.status}`);
            }
            
            const result: PaymentMethodsResponse = await response.json();
            setPayments(result.data);
            setTotalPayments(result.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error fetching payment methods:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchPayments(currentPage, searchTerm);
    //eslint-disable-next-line
    }, [currentPage, searchTerm]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleCreatePayment = () => {
        setEditingPayment(null);
        setIsModalOpen(true);
    };

    const handleEditPayment = (payment: PaymentMethod) => {
        setEditingPayment(payment);
        setIsModalOpen(true);
    };

    const convertPaymentToFormData = (payment: PaymentMethod): PaymentMethodFormData => {
        return {
            id: payment.id,
            userId: payment.userId,
            type: payment.type,
            provider: payment.provider,
            last4: payment.last4,
            expiryMonth: payment.expiryMonth,
            expiryYear: payment.expiryYear,
            holderName: payment.holderName,
            isDefault: payment.isDefault,
            isActive: payment.isActive
        };
    };

    const handleSubmit = async (formData: PaymentMethodFormData) => {
        try {
            const token = getAuthToken();
            if (!token) {
                setError('No authorization token found');
                return;
            }

            const url = editingPayment 
                ? `${apiURL}/api/admin/payment-methods/${editingPayment.id}`
                : `${apiURL}/api/payment-methods`;
            
            const method = editingPayment ? 'PUT' : 'POST';
            
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
                throw new Error(`Failed to ${editingPayment ? 'update' : 'create'} payment method`);
            }
            
            fetchPayments(currentPage, searchTerm);
            setIsModalOpen(false);
        } catch (err) {
            console.error(`Error ${editingPayment ? 'updating' : 'creating'} payment method:`, err);
            setError(err instanceof Error ? err.message : `Failed to ${editingPayment ? 'update' : 'create'} payment method`);
        }
    };

    const togglePaymentStatus = async (paymentId: string) => {
        try {
            const token = getAuthToken();
            if (!token) {
                setError('No authorization token found');
                return;
            }

            const response = await fetch(`${apiURL}/api/admin/payment-methods/${paymentId}/status`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to update payment method status');
            }
            
            fetchPayments(currentPage, searchTerm);
        } catch (err) {
            console.error('Error updating payment method status:', err);
            setError(err instanceof Error ? err.message : 'Failed to update payment method status');
        }
    };

    const deletePayment = async (paymentId: string) => {
        if (!confirm('Are you sure you want to delete this payment method?')) {
            return;
        }

        try {
            const token = getAuthToken();
            if (!token) {
                setError('No authorization token found');
                return;
            }

            const response = await fetch(`${apiURL}/api/admin/payment-methods/${paymentId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete payment method');
            }
            
            fetchPayments(currentPage, searchTerm);
        } catch (err) {
            console.error('Error deleting payment method:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete payment method');
        }
    };

    const formatCardType = (type: string) => {
        return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const formatExpiryDate = (month?: number, year?: number) => {
        if (!month || !year) return 'N/A';
        return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
    };

    const totalPages = Math.ceil(totalPayments / itemsPerPage);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Payment Methods</h1>
                <button 
                    onClick={handleCreatePayment}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    Add Payment Method
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
                                placeholder="Search by user name, email, provider, card number, or holder name..."
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Card Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Holder Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
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
                                            <span className="ml-3 text-gray-500">Loading payment methods...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                                        No payment methods found
                                    </td>
                                </tr>
                            ) : (
                                payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {payment.user?.firstName} {payment.user?.lastName}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {payment.user?.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {formatCardType(payment.type)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {payment.provider}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                ****{payment.last4}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Exp: {formatExpiryDate(payment.expiryMonth, payment.expiryYear)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {payment.holderName}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col space-y-1">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    payment.isActive 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {payment.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                                {payment.isDefault && (
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(payment.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button 
                                                    onClick={() => handleEditPayment(payment)}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                                >
                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => togglePaymentStatus(payment.id)}
                                                    className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                                        payment.isActive
                                                            ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500' 
                                                            : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                                                    }`}
                                                >
                                                    {payment.isActive ? (
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
                                                    onClick={() => deletePayment(payment.id)}
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
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalPayments)} of {totalPayments} payment methods
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

            <FormModal<PaymentMethodFormData>
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                title={editingPayment ? 'Edit Payment Method' : 'Add New Payment Method'}
                fields={paymentFields}
                initialData={editingPayment ? convertPaymentToFormData(editingPayment) : {
                    userId: '',
                    type: 'credit_card',
                    provider: '',
                    last4: '',
                    expiryMonth: undefined,
                    expiryYear: undefined,
                    holderName: '',
                    isDefault: false,
                    isActive: true
                }}
            />
        </div>
    );
}