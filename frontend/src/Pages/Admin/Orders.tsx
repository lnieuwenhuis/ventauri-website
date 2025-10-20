import React, { useState, useEffect } from 'react';
import ViewModal from '../../Components/Admin/ViewModal';
import FormModal from '../../Components/Admin/FormModal';

interface OrderItem {
	id: string;
	order_id: string;
	product_id: string;
	product_variant_id?: string | null;
	quantity: number;
	unit_price: number;
	subtotal: number;
	product?: {
		id: string;
		name: string;
		price: number;
		images: string;
	};
	product_variant?: {
		id: string;
		title: string;
		description: string;
		size: string;
		price_adjust: number;
	};
	options?: string; // JSON string of customization options
}

interface Order {
	id: string;
	user_id: string;
	total: number;
	status: string;
	shipping_address_id: string;
	billing_address_id: string;
	payment_method_id?: string;
	subtotal: number;
	tax: number;
	shipping: number;
	order_number: string;
	created_at: string;
	updated_at: string;
	// New optional field from backend
	shipping_estimate?: string;
	items: OrderItem[];
	user?: {
		id: string;
		firstName: string;
		lastName: string;
		displayName?: string;
		email: string;
	};
}

interface OrdersResponse {
	data: Order[];
	total: number;
	page: number;
	limit: number;
}

interface OrderFormData extends Record<string, unknown> {
	id: string;
	status: string;
	subtotal?: number;
	tax?: number;
	shipping?: number;
	total?: number;
	shippingEstimate?: string;
}

export default function AdminOrders() {
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');
	const [currentPage, setCurrentPage] = useState(1);
	const [totalOrders, setTotalOrders] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingOrder, setEditingOrder] = useState<Order | null>(null);
	const [modalLoading, setModalLoading] = useState(false);
	const [isViewOpen, setIsViewOpen] = useState(false);
	const [viewOrder, setViewOrder] = useState<Order | null>(null);
	const [viewData, setViewData] = useState<Partial<Record<string, unknown>> | null>(null);
	const itemsPerPage = 10;
	const apiURL = import.meta.env.VITE_BACKEND_URL || '';

	const fetchOrders = async (
		page: number = 1,
		search: string = '',
		status: string = 'all'
	) => {
		try {
			setLoading(true);
			setError(null);

			const params = new URLSearchParams({
				page: page.toString(),
				limit: itemsPerPage.toString(),
				...(search && { search }),
				...(status !== 'all' && { status }),
			});

			const response = await fetch(`${apiURL}/api/admin/orders/?${params}`, {
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch orders: ${response.status}`);
			}

			const result: OrdersResponse = await response.json();
			setOrders(result.data);
			setTotalOrders(result.total);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
			console.error('Error fetching orders:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchOrders(currentPage, searchTerm, statusFilter);
		// eslint-disable-next-line
	}, [currentPage, searchTerm, statusFilter]);

	const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value);
		setCurrentPage(1);
	};

	const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setStatusFilter(e.target.value);
		setCurrentPage(1);
	};

	const handleEditOrder = (order: Order) => {
		setEditingOrder(order);
		setIsModalOpen(true);
	};

	const handleViewOrder = async (order: Order) => {
		// fetch full order with relationships for view
		try {
		const res = await fetch(`${apiURL}/api/admin/orders/${order.id}`, { credentials: 'include' });
		if (res.ok) {
			const data = await res.json();
			const o = data.data || order;
			setViewOrder(o);
			const fmtMoney = (n: number | undefined) => (typeof n === 'number' ? `$${n.toFixed(2)}` : '—');
			const fmtAddr = (a: { street?: string; city?: string; state?: string; zipCode?: string; country?: string } | null | undefined) =>
			a ? `${a.street || ''}, ${a.city || ''}, ${a.state || ''} ${a.zipCode || ''}, ${a.country || ''}`.replace(/(^[ ,]+|[ ,]+$)/g, '') : 'Not provided';
			const userStr = o.user
			? `${o.user.firstName || ''} ${o.user.lastName || ''} (${o.user.email || ''})`.trim()
			: o.user_id;
			
			// Clean, structured formatting for items
			const itemsData = o.items && o.items.length > 0
				? o.items.map((item: OrderItem) => ({
					productName: item.product?.name || 'Unknown Product',
					variantInfo: item.product_variant 
						? `${item.product_variant.title} (${item.product_variant.size})` 
						: 'Standard',
					quantity: item.quantity,
					unitPrice: fmtMoney(item.unit_price),
					subtotal: fmtMoney(item.subtotal),
					customizations: (() => {
						const isPlainObject = (v: unknown): v is Record<string, unknown> => {
							return !!v && typeof v === 'object' && !Array.isArray(v);
						};
						const filterObjectArray = (arr: unknown[]): Array<Record<string, unknown>> => {
							return arr.filter(isPlainObject) as Array<Record<string, unknown>>;
						};
						const raw = item.options || '';
						if (!raw.trim()) return [];
						try {
							const first = JSON.parse(raw);
							if (Array.isArray(first)) {
								return filterObjectArray(first);
							}
							if (typeof first === 'string') {
								try {
									const second = JSON.parse(first);
									if (Array.isArray(second)) {
										return filterObjectArray(second);
									}
								} catch {
									return [];
								}
							}
							if (isPlainObject(first)) {
								return [first];
							}
						} catch {
							// ignore
						}
						return [];
					})()
				}))
				: [];
			
			setViewData({
			order_number: o.order_number,
			status: o.status,
			total: fmtMoney(o.total),
			subtotal: fmtMoney(o.subtotal),
			tax: fmtMoney(o.tax),
			shipping: fmtMoney(o.shipping),
			created_at: new Date(o.created_at).toLocaleString(),
			updated_at: new Date(o.updated_at).toLocaleString(),
			user: userStr,
			items: itemsData,
			shipping_address: fmtAddr(o.shipping_address || o.ShippingAddress),
			billing_address: fmtAddr(o.billing_address || o.BillingAddress),
			shipping_estimate: o.shipping_estimate || '',
			});
		} else {
			setViewOrder(order);
			setViewData(null);
		}
		} catch {
		setViewOrder(order);
		setViewData(null);
		}
		setIsViewOpen(true);
	};

	const handleSubmitOrder = async (formData: OrderFormData) => {
		if (!editingOrder) return;

		try {
			setModalLoading(true);

			// For orders, we typically only allow status and totals updates
			const response = await fetch(
				`${apiURL}/api/admin/orders/${editingOrder.id}`,
				{
					method: 'PUT',
					credentials: 'include',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						status: formData.status,
						subtotal: formData.subtotal,
						tax: formData.tax,
						shipping: formData.shipping,
						total: formData.total,
						shippingEstimate: formData.shippingEstimate,
					}),
				}
			);

			if (!response.ok) {
				throw new Error('Failed to update order');
			}

			fetchOrders(currentPage, searchTerm, statusFilter);
			setIsModalOpen(false);
		} catch (err) {
			console.error('Error updating order:', err);
			setError(err instanceof Error ? err.message : 'Failed to update order');
		} finally {
			setModalLoading(false);
		}
	};

	const convertOrderToFormData = (order: Order): OrderFormData => {
		return {
			id: order.id,
			status: order.status,
			subtotal: order.subtotal,
			tax: order.tax,
			shipping: order.shipping,
			total: order.total,
			shippingEstimate: order.shipping_estimate || '',
		};
	};

	const orderFormFields = [
		{
			name: 'status',
			label: 'Order Status',
			type: 'select' as const,
			required: true,
			options: [
				{ value: 'pending', label: 'Pending' },
				{ value: 'processing', label: 'Processing' },
				{ value: 'shipped', label: 'Shipped' },
				{ value: 'delivered', label: 'Delivered' },
				{ value: 'cancelled', label: 'Cancelled' },
			],
		},
		{
			name: 'shippingEstimate',
			label: 'Shipping Estimate',
			type: 'text' as const,
			required: false,
			placeholder: 'e.g., 2–4 business days',
		},
		{
			name: 'subtotal',
			label: 'Subtotal',
			type: 'number' as const,
			required: false,
			placeholder: '0.00',
		},
		{
			name: 'tax',
			label: 'Tax',
			type: 'number' as const,
			required: false,
			placeholder: '0.00',
		},
		{
			name: 'shipping',
			label: 'Shipping',
			type: 'number' as const,
			required: false,
			placeholder: '0.00',
		},
		{
			name: 'total',
			label: 'Total',
			type: 'number' as const,
			required: false,
			placeholder: '0.00',
		},
	];

	const updateOrderStatus = async (orderId: string, newStatus: string, estimate?: string) => {
		try {
			const response = await fetch(
				`${apiURL}/api/admin/orders/${orderId}/status`,
				{
					method: 'PUT',
					credentials: 'include',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ status: newStatus, shippingEstimate: estimate }),
				}
			);

			if (!response.ok) {
				throw new Error('Failed to update order status');
			}

			fetchOrders(currentPage, searchTerm, statusFilter);
		} catch (err) {
			console.error('Error updating order status:', err);
			setError(
				err instanceof Error ? err.message : 'Failed to update order status'
			);
		}
	};

	const deleteOrder = async (orderId: string) => {
		if (!confirm('Are you sure you want to delete this order?')) {
			return;
		}

		try {
			const response = await fetch(`${apiURL}/api/admin/orders/${orderId}`, {
				method: 'DELETE',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error('Failed to delete order');
			}

			fetchOrders(currentPage, searchTerm, statusFilter);
		} catch (err) {
			console.error('Error deleting order:', err);
			setError(err instanceof Error ? err.message : 'Failed to delete order');
		}
	};

	const totalPages = Math.ceil(totalOrders / itemsPerPage);

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
			<h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
			<div className="flex space-x-2"></div>
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
								placeholder="Search orders by order number, customer name or email..."
								value={searchTerm}
								onChange={handleSearch}
								className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>
						<div>
							<select
								value={statusFilter}
								onChange={handleStatusFilter}
								className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							>
								<option value="all">All Status</option>
								<option value="pending">Pending</option>
								<option value="processing">Processing</option>
								<option value="shipped">Shipped</option>
								<option value="delivered">Delivered</option>
								<option value="cancelled">Cancelled</option>
							</select>
						</div>
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Order
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Customer
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Total
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Status
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Date
								</th>
								<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{loading ? (
								<tr>
									<td colSpan={6} className="px-6 py-12">
										<div className="flex items-center justify-center">
											<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
											<span className="ml-3 text-gray-500">Loading orders...</span>
										</div>
									</td>
								</tr>
							) : orders.length === 0 ? (
								<tr>
									<td colSpan={6} className="px-6 py-12 text-center text-gray-500">
										No orders found
									</td>
								</tr>
							) : (
								orders.map((order) => (
									<tr key={order.id} className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm font-medium text-gray-900">
												#{order.order_number || order.id.substring(0, 8)}
											</div>
											<div className="text-sm text-gray-500">
												ID: {order.id.substring(0, 8)}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm font-medium text-gray-900">
												{order.user?.displayName ||
													order.user?.firstName + ' ' + order.user?.lastName ||
													'N/A'}
											</div>
											<div className="text-sm text-gray-500">
												{order.user?.email || order.user_id}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm font-medium text-gray-900">
												${order.total.toFixed(2)}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span
												className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
													order.status === 'delivered'
														? 'bg-green-100 text-green-800'
														: order.status === 'shipped'
															? 'bg-blue-100 text-blue-800'
															: order.status === 'processing'
																? 'bg-yellow-100 text-yellow-800'
																: order.status === 'cancelled'
																	? 'bg-red-100 text-red-800'
																	: 'bg-gray-100 text-gray-800'
												}`}
											>
												{order.status.charAt(0).toUpperCase() + order.status.slice(1)}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{new Date(order.created_at).toLocaleDateString()}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
											<div className="flex items-center justify-end space-x-2">
                                                <button
													onClick={() => handleEditOrder(order)}
													className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
												>
													<svg
														className="w-3 h-3 mr-1"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
														/>
													</svg>
													Edit
												</button>
                                                <button
                                                    onClick={() => handleViewOrder(order)}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-600 transition-colors duration-200"
                                                >
                                                    View
                                                </button>
                                                <select
													value={order.status}
													onChange={(e) => {
														const next = e.target.value;
														let estimate: string | undefined;
														if (next === 'shipped') {
															estimate = window.prompt(
																'Add shipping estimate (optional)',
																order.shipping_estimate || ''
															) || undefined;
														}
														updateOrderStatus(order.id, next, estimate);
													}}
													className="inline-flex items-center px-2 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
												>
													<option value="pending">Pending</option>
													<option value="processing">Processing</option>
													<option value="shipped">Shipped</option>
													<option value="delivered">Delivered</option>
													<option value="cancelled">Cancelled</option>
												</select>
												<button
													onClick={() => deleteOrder(order.id)}
													className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
												>
													<svg
														className="w-3 h-3 mr-1"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
														/>
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
							Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
							{Math.min(currentPage * itemsPerPage, totalOrders)} of {totalOrders}{' '}
							orders
						</div>
						<div className="flex space-x-2">
							<button
								onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
								disabled={currentPage === 1}
								className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
							>
								Previous
							</button>
							<span className="px-3 py-1 text-sm">
								Page {currentPage} of {totalPages}
							</span>
							<button
								onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
								disabled={currentPage === totalPages}
								className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
							>
								Next
							</button>
						</div>
					</div>
				)}
			</div>

            <FormModal<OrderFormData>
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onSubmit={handleSubmitOrder}
				initialData={
					editingOrder ? convertOrderToFormData(editingOrder) : { status: 'pending' }
				}
				fields={orderFormFields}
				title="Edit Order"
				isLoading={modalLoading}
			/>

            <ViewModal
                isOpen={isViewOpen}
                onClose={() => setIsViewOpen(false)}
                data={(viewData ?? (viewOrder as unknown as Partial<Record<string, unknown>>) ?? {})}
                fields={[
                    { name: 'order_number', label: 'Order Number' },
                    { name: 'status', label: 'Status' },
                    { name: 'total', label: 'Total' },
                    { name: 'subtotal', label: 'Subtotal' },
                    { name: 'tax', label: 'Tax' },
                    { name: 'shipping', label: 'Shipping' },
                    { name: 'shipping_estimate', label: 'Shipping Estimate' },
                    { name: 'created_at', label: 'Created At' },
                    { name: 'updated_at', label: 'Updated At' },
                    { name: 'user', label: 'User' },
                    { name: 'items', label: 'Order Items' },
                    { name: 'shipping_address', label: 'Shipping Address' },
                    { name: 'billing_address', label: 'Billing Address' },
                ]}
                linkedSubjects={[]}
            />
		</div>
	);
}
