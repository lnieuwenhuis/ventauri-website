import React from 'react';
import { type Competition } from '../../../types/competition';

interface CompetitionActionsProps {
	competition: Competition;
	onEdit: (competition: Competition) => void;
	onView: (competition: Competition) => void;
	onDelete: (id: string) => void;
	onToggleStatus: (id: string) => void;
}

const CompetitionActions: React.FC<CompetitionActionsProps> = ({
	competition,
	onEdit,
	onView,
	onDelete,
	onToggleStatus,
}) => {
	return (
		<div className="flex flex-col gap-2">
			<button
				onClick={() => onView(competition)}
				className="flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
			>
				<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
				</svg>
				View
			</button>
			<button
				onClick={() => onEdit(competition)}
				className="flex items-center justify-center px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors"
			>
				<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
				</svg>
				Edit
			</button>
			<button
				onClick={() => onToggleStatus(competition.id)}
				className={`flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
					competition.isActive
						? 'text-red-700 bg-red-100 hover:bg-red-200'
						: 'text-green-700 bg-green-100 hover:bg-green-200'
				}`}
			>
				<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
				</svg>
				{competition.isActive ? 'Deactivate' : 'Activate'}
			</button>
			<button
				onClick={() => onDelete(competition.id)}
				className="flex items-center justify-center px-3 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
			>
				<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
				</svg>
				Delete
			</button>
		</div>
	);
};

export default CompetitionActions;