import React from 'react';

interface CompetitionsHeaderProps {
	onCreateCompetition: () => void;
	totalCompetitions: number;
}

const CompetitionsHeader: React.FC<CompetitionsHeaderProps> = ({
	onCreateCompetition,
	totalCompetitions,
}) => {
	return (
		<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-900 mb-2">Competitions Management</h1>
					<p className="text-gray-600">Manage racing competitions, tracks, and results</p>
					<div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
						{totalCompetitions} Total Competitions
					</div>
				</div>
				<button
					onClick={onCreateCompetition}
					className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
				>
					<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
					</svg>
					Add Competition
				</button>
			</div>
		</div>
	);
};

export default CompetitionsHeader;