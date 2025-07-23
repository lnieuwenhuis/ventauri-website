import React from 'react';

interface CompetitionsFiltersProps {
	searchTerm: string;
	statusFilter: string;
	sortBy: string;
	onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onStatusFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
	onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const CompetitionsFilters: React.FC<CompetitionsFiltersProps> = ({
	searchTerm,
	statusFilter,
	sortBy,
	onSearchChange,
	onStatusFilterChange,
	onSortChange,
}) => {
	return (
		<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
			<h3 className="text-lg font-medium text-gray-900 mb-4">Filters & Search</h3>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">Search Competitions</label>
					<div className="relative">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
						</div>
						<input
							type="text"
							placeholder="Search by name or description..."
							value={searchTerm}
							onChange={onSearchChange}
							className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
					<select
						value={statusFilter}
						onChange={onStatusFilterChange}
						className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					>
						<option value="">All Status</option>
						<option value="active">Active</option>
						<option value="inactive">Inactive</option>
					</select>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
					<select
						value={sortBy}
						onChange={onSortChange}
						className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					>
						<option value="latest_updated">Latest Updated</option>
						<option value="oldest_updated">Oldest Updated</option>
						<option value="latest_created">Latest Created</option>
						<option value="oldest_created">Oldest Created</option>
						<option value="name_asc">Name A-Z</option>
						<option value="name_desc">Name Z-A</option>
					</select>
				</div>
			</div>
		</div>
	);
};

export default CompetitionsFilters;