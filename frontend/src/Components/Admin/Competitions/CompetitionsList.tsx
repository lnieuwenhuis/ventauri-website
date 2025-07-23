import React from 'react';
import CompetitionCard from './CompetitionCard';
import { type Competition, type Track } from '../../../types/competition';

interface CompetitionsListProps {
	competitions: Competition[];
	loading: boolean;
	onEdit: (competition: Competition) => void;
	onView: (competition: Competition) => void;
	onDelete: (id: string) => void;
	onToggleStatus: (id: string) => void;
	onCreateTrack: (competition: Competition) => void;
	onEditTrack: (competition: Competition, track: Track) => void;
	onDeleteTrack: (competitionId: string, trackId: string) => void;
	onManageResults: (competition: Competition, track: Track) => void;
}

const CompetitionsList: React.FC<CompetitionsListProps> = ({
	competitions,
	loading,
	onEdit,
	onView,
	onDelete,
	onToggleStatus,
	onCreateTrack,
	onEditTrack,
	onDeleteTrack,
	onManageResults,
}) => {
	if (loading) {
		return (
			<div className="flex justify-center items-center py-12">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
				<span className="ml-3 text-gray-600">Loading competitions...</span>
			</div>
		);
	}

	if (competitions.length === 0) {
		return (
			<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
				<svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
				</svg>
				<h3 className="text-lg font-medium text-gray-900 mb-2">No competitions found</h3>
				<p className="text-gray-600">Get started by creating your first competition.</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{competitions.map((competition) => (
				<CompetitionCard
					key={competition.id}
					competition={competition}
					onEdit={onEdit}
					onView={onView}
					onDelete={onDelete}
					onToggleStatus={onToggleStatus}
					onCreateTrack={onCreateTrack}
					onEditTrack={onEditTrack}
					onDeleteTrack={onDeleteTrack}
					onManageResults={onManageResults}
				/>
			))}
		</div>
	);
};

export default CompetitionsList;