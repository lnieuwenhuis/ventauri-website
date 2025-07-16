interface ViewModalProps<
	T extends Record<string, unknown> = Record<string, unknown>,
> {
	fields: {
		name: string;
		label: string;
	}[];
	data: Partial<T>;
	isOpen: boolean;
	onClose: () => void;
	linkedSubjects: {
		name: string;
		link: string;
	}[];
}

const ViewModal = <
	T extends Record<string, unknown> = Record<string, unknown>,
>({
	fields,
	data,
	isOpen,
	onClose,
	linkedSubjects,
}: ViewModalProps<T>) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
			<div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
				<div className="p-6">
					<div className="flex justify-between items-center mb-6">
						<h2 className="text-xl font-semibold text-gray-900">
							Viewing {String(data.name || 'Item')}
						</h2>
						<button onClick={onClose} className="text-gray-400 hover:text-gray-600">
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

					<div className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{fields.map((field) => {
								const value = data[field.name];
								let displayValue: string;

								if (field.name === 'isActive') {
									displayValue = value ? 'Active' : 'Inactive';
								} else if (field.name === 'createdAt' || field.name === 'updatedAt') {
									displayValue = value
										? new Date(String(value)).toLocaleString()
										: 'N/A';
								} else if (field.name === 'parent_id') {
									displayValue = value ? String(value) : 'Root Category';
								} else {
									displayValue = value ? String(value) : 'Not provided';
								}

								return (
									<div key={field.name}>
										<label className="block text-sm font-bold text-gray-700">
											{field.label}
										</label>
										{field.name === 'isActive' ? (
											<span
												className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
													value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
												}`}
											>
												{displayValue}
											</span>
										) : (
											<p className="mt-1 text-sm text-gray-900">{displayValue}</p>
										)}
									</div>
								);
							})}
						</div>

						{linkedSubjects.length > 0 && (
							<div className="mt-6">
								<h3 className="text-lg font-medium text-gray-900 mb-3">
									Related Actions
								</h3>
								<div className="flex flex-wrap gap-2">
									{linkedSubjects.map((subject, index) => (
										<a
											key={index}
											href={subject.link}
											className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
										>
											{subject.name}
										</a>
									))}
								</div>
							</div>
						)}
					</div>

					<div className="mt-6 flex justify-end">
						<button
							onClick={onClose}
							className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
						>
							Close
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ViewModal;
