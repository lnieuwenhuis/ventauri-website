import React from 'react';
import { type Competition, type Track } from '../../../types/competition';


interface TrackCardProps {
	competition: Competition;
	track: Track;
	onEdit: (competition: Competition, track: Track) => void;
	onDelete: (competitionId: string, trackId: string) => void;
	onManageResults: (competition: Competition, track: Track) => void;
}

const TrackCard: React.FC<TrackCardProps> = ({
	competition,
	track,
	onEdit,
	onDelete,
	onManageResults,
}) => {
	const getStatusColor = (status: string) => {
		switch (status) {
			case 'past':
				return 'bg-gray-100 text-gray-800';
			case 'next':
				return 'bg-yellow-100 text-yellow-800';
			case 'future':
				return 'bg-blue-100 text-blue-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	return (
		<div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
			<div className="flex items-start justify-between mb-3">
				<div>
					<h5 className="font-medium text-gray-900">{track.name}</h5>
					<p className="text-sm text-gray-500">
						{new Date(track.dateTime).toLocaleDateString('en-US', {
							weekday: 'short',
							year: 'numeric',
							month: 'short',
							day: 'numeric',
						})}
					</p>
				</div>
				<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(track.status)}`}>
					{track.status.charAt(0).toUpperCase() + track.status.slice(1)}
				</span>
			</div>

			<div className="mb-4">
				<div className="flex items-center text-sm text-gray-600">
					<svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
					</svg>
					{track.results?.length || 0} Results
				</div>
			</div>

			<div className="flex flex-wrap gap-2">
				<button
					onClick={() => onEdit(competition, track)}
					className="flex-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
				>
					Edit
				</button>
				<button
					onClick={() => onManageResults(competition, track)}
					disabled={!track.personnel || track.personnel.length === 0}
					className={`flex-1 text-xs font-medium px-2 py-1 rounded transition-colors ${
						!track.personnel || track.personnel.length === 0
							? 'text-gray-400 bg-gray-100 cursor-not-allowed'
							: 'text-green-700 bg-green-50 hover:bg-green-100'
					}`}
					title={!track.personnel || track.personnel.length === 0 ? 'Please add personnel to this track first' : ''}
				>
					Results
				</button>
				<button
					onClick={() => onDelete(competition.id, track.id)}
					className="flex-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-1 rounded hover:bg-red-100 transition-colors"
				>
					Delete
				</button>
			</div>
		</div>
	);
};

export default TrackCard;