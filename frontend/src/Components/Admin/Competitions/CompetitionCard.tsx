import React, { useState } from 'react';
import CompetitionActions from './CompetitionActions';
import { type Competition, type Track } from '../../../types/competition';

interface CompetitionCardProps {
	competition: Competition;
	onEdit: (competition: Competition) => void;
	onView: (competition: Competition) => void;
	onDelete: (id: string) => void;
	onToggleStatus: (id: string) => void;
	onCreateTrack: (competition: Competition) => void;
	onEditTrack: (competition: Competition, track: Track) => void;
	onDeleteTrack: (competitionId: string, trackId: string) => void;
	onManageResults: (competition: Competition, track: Track) => void;
}

const CompetitionCard: React.FC<CompetitionCardProps> = ({
	competition,
	onEdit,
	onView,
	onDelete,
	onToggleStatus,
	onCreateTrack,
	onEditTrack,
	onDeleteTrack,
	onManageResults,
}) => {
	const [isTracksExpanded, setIsTracksExpanded] = useState(false);
	const trackCount = competition.schedule?.length || 0;

	return (
		<div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
			{/* Competition Header */}
			<div className="p-6 border-b border-gray-100">
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<div className="flex items-center gap-3 mb-2">
							<h3 className="text-xl font-semibold text-gray-900">{competition.name}</h3>
							<span
								className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
									competition.isActive
										? 'bg-green-100 text-green-800'
										: 'bg-gray-100 text-gray-800'
								}`}
							>
								{competition.isActive ? 'Active' : 'Inactive'}
							</span>
						</div>
						<p className="text-gray-600 mb-4">{competition.desc}</p>
						<div className="grid grid-cols-3 gap-4">
							<div className="text-center p-3 bg-blue-50 rounded-lg">
								<div className="text-2xl font-bold text-blue-600">{competition.position}</div>
								<div className="text-sm text-blue-600">Position</div>
							</div>
							<div className="text-center p-3 bg-green-50 rounded-lg">
								<div className="text-2xl font-bold text-green-600">{competition.points}</div>
								<div className="text-sm text-green-600">Points</div>
							</div>
							<div className="text-center p-3 bg-purple-50 rounded-lg">
								<div className="text-2xl font-bold text-purple-600">{trackCount}</div>
								<div className="text-sm text-purple-600">Tracks</div>
							</div>
						</div>
					</div>
					<CompetitionActions
						competition={competition}
						onEdit={onEdit}
						onView={onView}
						onDelete={onDelete}
						onToggleStatus={onToggleStatus}
					/>
				</div>
			</div>

			{/* Tracks Section - Always show with collapsible dropdown */}
			<div className="border-b border-gray-100">
				<button
					onClick={() => setIsTracksExpanded(!isTracksExpanded)}
					className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
				>
					<div className="flex items-center gap-3">
						<h4 className="text-lg font-medium text-gray-900">Race Tracks</h4>
						<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
							{trackCount} {trackCount === 1 ? 'Track' : 'Tracks'}
						</span>
					</div>
					<div className="flex items-center gap-2">
						<button
							onClick={(e) => {
								e.stopPropagation();
								onCreateTrack(competition);
							}}
							className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
						>
							<svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
							</svg>
							Add Track
						</button>
						<svg
							className={`w-5 h-5 text-gray-400 transition-transform ${
								isTracksExpanded ? 'rotate-180' : ''
							}`}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
						</svg>
					</div>
				</button>

				{/* Collapsible Tracks List */}
				{isTracksExpanded && (
					<div className="px-6 pb-6">
						{trackCount > 0 ? (
							<div className="space-y-3">
								{competition.schedule?.map((track) => (
									<div key={track.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
										<div className="flex items-center justify-between">
											<div className="flex-1">
												<h5 className="font-medium text-gray-900">{track.name}</h5>
												<p className="text-sm text-gray-600 mt-1">
													{new Date(track.dateTime).toLocaleDateString()} at{' '}
													{new Date(track.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
												</p>
											</div>
											<div className="flex items-center gap-2">
												<button
													onClick={() => onEditTrack(competition, track)}
													className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
												>
													Edit
												</button>
												<button
													onClick={() => onManageResults(competition, track)}
													className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded hover:bg-green-100 transition-colors"
												>
													Results
												</button>
												<button
													onClick={() => onDeleteTrack(competition.id, track.id)}
													className="text-xs font-medium text-red-700 bg-red-50 px-2 py-1 rounded hover:bg-red-100 transition-colors"
												>
													Delete
												</button>
											</div>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-8 text-gray-500">
								<svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
								</svg>
								<p className="text-sm">No tracks added yet</p>
								<p className="text-xs mt-1">Click "Add Track" to create the first track for this competition</p>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default CompetitionCard;