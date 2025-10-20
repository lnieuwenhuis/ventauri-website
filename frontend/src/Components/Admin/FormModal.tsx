import React, { useState, useEffect } from 'react';
import PersonnelSearch from './PersonnelSearch';

interface FormField<T = Record<string, unknown>> {
    name: keyof T;
    label: string;
    type:
        | 'text'
        | 'textarea'
        | 'number'
        | 'select'
        | 'checkbox'
        | 'url'
        | 'array'
        | 'checkbox-group'
        | 'array-popup'
        | 'key-value-array'
        | 'date'
        | 'datetime-local'
        | 'personnel-search';
    required?: boolean;
    options?: { value: string; label: string }[];
    placeholder?: string;
    arrayType?: 'url' | 'text';
    // For key-value-array type
    keyPlaceholder?: string;
    valuePlaceholder?: string;
    valueInputType?: 'text' | 'number';
    // New: fixed key/value controls for key-value-array
    fixedKeys?: string[];
    lockKeys?: boolean;
    hideAddRemove?: boolean;
    // New: layout column placement for two-column mode
    column?: 'left' | 'right';
}

interface FormModalProps<
	T extends Record<string, unknown> = Record<string, unknown>,
> {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: T) => Promise<void>;
	title: string;
	fields: FormField<T>[];
	initialData?: Partial<T>;
	isLoading?: boolean;
	// New: layout controls
	layout?: 'one-column' | 'two-column';
	size?: 'md' | 'lg' | 'xl';
	showDivider?: boolean;
}

const FormModal = <
	T extends Record<string, unknown> = Record<string, unknown>,
>({
	isOpen,
	onClose,
	onSubmit,
	title,
	fields,
	initialData = {} as Partial<T>,
	isLoading = false,
	layout = 'one-column',
	size = 'md',
	showDivider = true,
}: FormModalProps<T>) => {
    const [formData, setFormData] = useState<Partial<T>>({});
    const [errors, setErrors] = useState<Record<string, string | null>>({});
    const [popupState, setPopupState] = useState<Record<string, { open: boolean; value: string }>>({});

	useEffect(() => {
		if (isOpen) {
			// Check if this is a new item (no ID in initialData)
			const isNewItem = !initialData || !(initialData as Record<string, unknown>)?.id;
			
			if (isNewItem) {
				// For new items, initialize personnel-search fields as empty arrays
				const clearedData = { ...initialData };
				fields.forEach(field => {
					if (field.type === 'personnel-search') {
						clearedData[field.name] = [] as unknown as Partial<T>[keyof T];
					}
				});
				setFormData(clearedData);
			} else {
				setFormData(initialData);
			}
			
			setErrors({});
		}
	}, [isOpen, initialData]);

	const handleInputChange = (name: keyof T, value: unknown) => {
		setFormData((prev: Partial<T>) => ({ ...prev, [name]: value }));
		const fieldName = String(name);
		if (errors[fieldName]) {
			setErrors((prev: Record<string, string | null>) => ({
				...prev,
				[fieldName]: null,
			}));
		}
	};

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};
		fields.forEach((field) => {
			const fieldName = String(field.name);
			if (
				field.required &&
				(!formData[field.name] || formData[field.name] === '')
			) {
				newErrors[fieldName] = `${field.label} is required`;
			}
		});
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validateForm()) return;

		try {
			await onSubmit(formData as T);
			onClose();
		} catch (error) {
			console.error('Form submission error:', error);
		}
	};

    const renderField = (field: FormField<T>) => {
        const value = formData[field.name];
        const fieldName = String(field.name);
        const error = errors[fieldName];

        switch (field.type) {
			case 'textarea':
				return (
					<textarea
						value={value ? String(value) : ''}
						onChange={(e) => handleInputChange(field.name as keyof T, e.target.value)}
						placeholder={field.placeholder}
						rows={3}
						className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
							error ? 'border-red-300' : 'border-gray-300'
						}`}
					/>
				);
			case 'number':
				return (
					<input
						type="number"
						value={Number(value) || ''}
						onChange={(e) =>
							handleInputChange(field.name as keyof T, parseFloat(e.target.value) || 0)
						}
						placeholder={field.placeholder}
						step="0.01"
						min="0"
						className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
							error ? 'border-red-300' : 'border-gray-300'
						}`}
					/>
				);
			case 'select':
				return (
					<select
						value={value ? String(value) : ''}
						onChange={(e) => handleInputChange(field.name as keyof T, e.target.value)}
						className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
							error ? 'border-red-300' : 'border-gray-300'
						}`}
					>
						<option value="">Select {field.label}</option>
						{field.options?.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				);
			case 'checkbox':
				return (
					<label className="flex items-center">
						<input
							type="checkbox"
							checked={Boolean(value)}
							onChange={(e) =>
								handleInputChange(field.name as keyof T, e.target.checked)
							}
							className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
						/>
						<span className="text-sm text-gray-700">{field.label}</span>
					</label>
				);
            case 'personnel-search':
                return (
                    <PersonnelSearch
                        selectedPersonnel={Array.isArray(value) ? value as string[] : []}
                        onChange={(personnel) => handleInputChange(field.name as keyof T, personnel)}
                        error={error}
                    />
                );
            case 'array': {
                const arrayValue: string[] = Array.isArray(value)
                    ? (value as string[])
                    : [];
                return (
                    <div className="space-y-2">
                        {arrayValue.map((item: string, index: number) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    type={field.arrayType || 'text'}
                                    value={item}
                                    onChange={(e) => {
                                        const newArray: string[] = [...arrayValue];
                                        newArray[index] = e.target.value;
                                        handleInputChange(field.name as keyof T, newArray);
                                    }}
                                    placeholder={field.placeholder}
                                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        error ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newArray: string[] = arrayValue.filter(
                                            (_: string, i: number) => i !== index
                                        );
                                        handleInputChange(field.name as keyof T, newArray);
                                    }}
                                    className="px-3 py-2 text-red-600 hover:text-red-800 border border-red-300 rounded-lg hover:bg-red-50"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => {
                                const newArray: string[] = [...arrayValue, ''];
                                handleInputChange(field.name as keyof T, newArray);
                            }}
                            className="w-full px-3 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 text-sm"
                        >
                            + Add {field.label}
                        </button>
                    </div>
                );
            }
            case 'checkbox-group': {
                const selected: string[] = Array.isArray(value) ? (value as string[]) : [];
                return (
                    <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                            {field.options?.map((opt) => {
                                const isChecked = selected.includes(opt.value);
                                return (
                                    <label key={opt.value} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                                let next = selected;
                                                if (e.target.checked) {
                                                    next = [...selected, opt.value];
                                                } else {
                                                    next = selected.filter((v) => v !== opt.value);
                                                }
                                                handleInputChange(field.name as keyof T, next);
                                            }}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="text-sm text-gray-700">{opt.label}</span>
                                    </label>
                                );
                            })}
                        </div>
                        {error && (
                            <div className="text-xs text-red-600">{error}</div>
                        )}
                    </div>
                );
            }
            case 'array-popup': {
                const arrayValue: string[] = Array.isArray(value) ? (value as string[]) : [];
                const state = popupState[fieldName] || { open: false, value: '' };
                return (
                    <div className="space-y-2">
                        {arrayValue.length > 0 && (
                            <div className="space-y-2">
                                {arrayValue.map((item: string, index: number) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={item}
                                            onChange={(e) => {
                                                const next = [...arrayValue];
                                                next[index] = e.target.value;
                                                handleInputChange(field.name as keyof T, next);
                                            }}
                                            className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                error ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleInputChange(
                                                    field.name as keyof T,
                                                    arrayValue.filter((_, i) => i !== index)
                                                );
                                            }}
                                            className="px-3 py-2 text-red-600 hover:text-red-800 border border-red-300 rounded-lg hover:bg-red-50"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => setPopupState((prev) => ({ ...prev, [fieldName]: { open: true, value: '' } }))}
                            className="w-full px-3 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 text-sm"
                        >
                            + Add {field.label}
                        </button>
                        {state.open && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                <div className="bg-white rounded-lg shadow-xl p-4 w-full max-w-sm">
                                    <div className="mb-2 text-sm font-medium text-gray-900">Add {field.label}</div>
                                    <input
                                        type="text"
                                        value={state.value}
                                        onChange={(e) => setPopupState((prev) => ({ ...prev, [fieldName]: { open: true, value: e.target.value } }))}
                                        placeholder={field.placeholder}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            error ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    />
                                    <div className="mt-3 flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setPopupState((prev) => ({ ...prev, [fieldName]: { open: false, value: '' } }))}
                                            className="px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const v = state.value.trim();
                                                if (v) {
                                                    const next = [...arrayValue, v];
                                                    handleInputChange(field.name as keyof T, next);
                                                }
                                                setPopupState((prev) => ({ ...prev, [fieldName]: { open: false, value: '' } }));
                                            }}
                                            className="px-3 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            }
            case 'key-value-array': {
                const arrayValue: { key: string; value: string }[] = Array.isArray(value)
                    ? (value as unknown as { key: string; value: string }[])
                    : [];
                const displayArray: { key: string; value: string }[] = Array.isArray(field.fixedKeys)
                    ? field.fixedKeys.map((k) => {
                          const found = arrayValue.find((i) => i.key === k);
                          return found ? found : { key: k, value: '' };
                      })
                    : arrayValue;
                return (
                    <div className="space-y-2">
                        {displayArray.map((item, index) => (
                            <div key={index} className="grid grid-cols-5 gap-2">
                                <input
                                    type="text"
                                    value={item.key}
                                    onChange={(e) => {
                                        if (field.lockKeys) return; // Prevent editing fixed keys
                                        const next = [...displayArray];
                                        next[index] = { ...item, key: e.target.value };
                                        // Merge back into original array
                                        const merged = Array.isArray(field.fixedKeys)
                                            ? field.fixedKeys.map((k, i) => (i === index ? next[index] : next[i]))
                                            : next;
                                        handleInputChange(field.name as keyof T, merged as unknown as Partial<T>[keyof T]);
                                    }}
                                    placeholder={field.keyPlaceholder || 'Label (e.g., UK)'}
                                    readOnly={Boolean(field.lockKeys)}
                                    disabled={Boolean(field.lockKeys)}
                                    className={`col-span-2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        error ? 'border-red-300' : 'border-gray-300'
                                    } ${field.lockKeys ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                                />
                                <input
                                    type={field.valueInputType === 'number' ? 'number' : 'text'}
                                    value={item.value}
                                    onChange={(e) => {
                                        const next = [...displayArray];
                                        next[index] = { ...item, value: e.target.value };
                                        const merged = Array.isArray(field.fixedKeys)
                                            ? field.fixedKeys.map((k, i) => (i === index ? next[index] : next[i]))
                                            : next;
                                        handleInputChange(field.name as keyof T, merged as unknown as Partial<T>[keyof T]);
                                    }}
                                    placeholder={field.valuePlaceholder || 'Price (e.g., 4.99)'}
                                    className={`col-span-2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        error ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                />
                                {!field.hideAddRemove && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const next = displayArray.filter((_, i) => i !== index);
                                            handleInputChange(field.name as keyof T, next as unknown as Partial<T>[keyof T]);
                                        }}
                                        className="px-3 py-2 text-red-600 hover:text-red-800 border border-red-300 rounded-lg hover:bg-red-50"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                        {!field.hideAddRemove && (
                            <button
                                type="button"
                                onClick={() => {
                                    const next = [...displayArray, { key: '', value: '' }];
                                    handleInputChange(field.name as keyof T, next as unknown as Partial<T>[keyof T]);
                                }}
                                className="w-full px-3 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 text-sm"
                            >
                                + Add {field.label}
                            </button>
                        )}
                    </div>
                );
            }
            default:
                return (
                    <input
                        type={field.type}
                        value={value ? String(value) : ''}
						onChange={(e) => handleInputChange(field.name as keyof T, e.target.value)}
						placeholder={field.placeholder}
						className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
							error ? 'border-red-300' : 'border-gray-300'
						}`}
					/>
				);
		}
	};

	if (!isOpen) return null;

	// Width class based on size prop
	const sizeClass = size === 'xl' ? 'max-w-3xl' : size === 'lg' ? 'max-w-2xl' : 'max-w-md';

	const renderWrappedField = (field: FormField<T>) => {
		const fieldName = String(field.name);
		return (
			<div key={fieldName}>
				{field.type !== 'checkbox' && (
					<label className="block text-sm font-medium text-gray-700 mb-1">
						{field.label}
						{field.required && <span className="text-red-500 ml-1">*</span>}
					</label>
				)}
				{renderField(field)}
				{errors[fieldName] && (
					<p className="text-red-500 text-xs mt-1">{errors[fieldName]}</p>
				)}
			</div>
		);
	};

	const leftFields = layout === 'two-column' ? fields.filter((f) => f.column !== 'right') : fields;
	const rightFields = layout === 'two-column' ? fields.filter((f) => f.column === 'right') : [];

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div className={`bg-white rounded-lg shadow-xl ${sizeClass} w-full mx-4 max-h-[90vh] overflow-y-auto`}>
				<div className="flex items-center justify-between p-6 border-b border-gray-200">
					<h2 className="text-xl font-semibold text-gray-900">{title}</h2>
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

				<form onSubmit={handleSubmit} className="p-6">
					{layout === 'two-column' ? (
						<div className={`md:flex md:space-x-6 ${showDivider ? 'md:divide-x md:divide-gray-200' : ''}`}>
							<div className="md:w-1/2 md:pr-6 space-y-4">
								{leftFields.map(renderWrappedField)}
							</div>
							<div className="md:w-1/2 md:pl-6 space-y-4">
								{rightFields.map(renderWrappedField)}
							</div>
						</div>
					) : (
						<div className="space-y-4">
							{fields.map(renderWrappedField)}
						</div>
					)}

					<div className="flex justify-end space-x-3 mt-6">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text_sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isLoading}
							className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center"
						>
							{isLoading && (
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
							)}
							{(initialData as Record<string, unknown>)?.id ? 'Update' : 'Create'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default FormModal;
