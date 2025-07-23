import React from 'react';

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	totalItems: number;
	itemsPerPage: number;
	onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
	currentPage,
	totalPages,
	totalItems,
	itemsPerPage,
	onPageChange,
}) => {
	if (totalPages <= 1) return null;

	const startItem = (currentPage - 1) * itemsPerPage + 1;
	const endItem = Math.min(currentPage * itemsPerPage, totalItems);

	return (
		<div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
			<div className="flex items-center justify-between">
				<div className="flex-1 flex justify-between sm:hidden">
					<button
						onClick={() => onPageChange(Math.max(1, currentPage - 1))}
						disabled={currentPage === 1}
						className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Previous
					</button>
					<button
						onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
						disabled={currentPage === totalPages}
						className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Next
					</button>
				</div>
				<div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
					<div>
						<p className="text-sm text-gray-700">
							Showing <span className="font-medium">{startItem}</span> to{' '}
							<span className="font-medium">{endItem}</span> of{' '}
							<span className="font-medium">{totalItems}</span> results
						</p>
					</div>
					<div>
						<nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
							<button
								onClick={() => onPageChange(Math.max(1, currentPage - 1))}
								disabled={currentPage === 1}
								className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<span className="sr-only">Previous</span>
								<svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
								</svg>
							</button>
							{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
								<button
									key={page}
									onClick={() => onPageChange(page)}
									className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
										currentPage === page
											? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
											: 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
									}`}
								>
									{page}
								</button>
							))}
							<button
								onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
								disabled={currentPage === totalPages}
								className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<span className="sr-only">Next</span>
								<svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
								</svg>
							</button>
						</nav>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Pagination;