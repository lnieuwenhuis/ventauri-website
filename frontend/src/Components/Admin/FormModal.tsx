import React, { useState, useEffect } from 'react';

interface FormField<T = Record<string, unknown>> {
    name: keyof T;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'url' | 'array';
    required?: boolean;
    options?: { value: string; label: string }[];
    placeholder?: string;
    arrayType?: 'url' | 'text';
}

interface FormModalProps<T extends Record<string, unknown> = Record<string, unknown>> {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: T) => Promise<void>;
    title: string;
    fields: FormField<T>[];
    initialData?: Partial<T>;
    isLoading?: boolean;
}

const FormModal = <T extends Record<string, unknown> = Record<string, unknown>>({
    isOpen,
    onClose,
    onSubmit,
    title,
    fields,
    initialData = {} as Partial<T>,
    isLoading = false
}: FormModalProps<T>) => {
    const [formData, setFormData] = useState<Partial<T>>({});
    const [errors, setErrors] = useState<Record<string, string | null>>({});

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData);
            setErrors({});
        }
    }, [isOpen, initialData]);

    const handleInputChange = (name: keyof T, value: unknown) => {
        setFormData((prev: Partial<T>) => ({ ...prev, [name]: value }));
        const fieldName = String(name);
        if (errors[fieldName]) {
            setErrors((prev: Record<string, string | null>) => ({ ...prev, [fieldName]: null }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        fields.forEach(field => {
            const fieldName = String(field.name);
            if (field.required && (!formData[field.name] || formData[field.name] === '')) {
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
        const value = formData[field.name as keyof T] || '';
        const fieldName = String(field.name);
        const error = errors[fieldName];
    
        switch (field.type) {
            case 'textarea':
                return (
                    <textarea
                        value={String(value)}
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
                        onChange={(e) => handleInputChange(field.name as keyof T, parseFloat(e.target.value) || 0)}
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
                        value={String(value)}
                        onChange={(e) => handleInputChange(field.name as keyof T, e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            error ? 'border-red-300' : 'border-gray-300'
                        }`}
                    >
                        <option value="">Select {field.label}</option>
                        {field.options?.map(option => (
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
                            onChange={(e) => handleInputChange(field.name as keyof T, e.target.checked)}
                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{field.label}</span>
                    </label>
                );
            case 'array': {
                const arrayValue: string[] = Array.isArray(value) ? (value as string[]) : [];
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
                                        const newArray: string[] = arrayValue.filter((_: string, i: number) => i !== index);
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
            default:
                return (
                    <input
                        type={field.type}
                        value={String(value)}
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

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                        {fields.map(field => {
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
                        })}
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
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