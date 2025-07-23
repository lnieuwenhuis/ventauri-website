import React, { useState, useEffect } from 'react';
import CompetitionsHeader from '../../Components/Admin/Competitions/CompetitionsHeader';
import CompetitionsFilters from '../../Components/Admin/Competitions/CompetitionsFilters';
import CompetitionsList from '../../Components/Admin/Competitions/CompetitionsList';
import Pagination from '../../Components/Admin/Competitions/Pagination';
import FormModal from '../../Components/Admin/FormModal';
import ViewModal from '../../Components/Admin/ViewModal';
import { type Competition, type CompetitionsResponse, type Track, type CompetitionFormData, type TrackFormData, type ResultFormData } from '../../types/competition';

// Add TeamMember interface
interface TeamMember {
	id: string;
	firstName: string;
	lastName: string;
	role: {
		id: string;
		name: string;
	};
}

interface TeamMembersResponse {
	data: TeamMember[];
	total: number;
	page: number;
	limit: number;
}

const AdminCompetitions: React.FC = () => {
	const [competitions, setCompetitions] = useState<Competition[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState('');
	const [sortBy, setSortBy] = useState('latest_updated');
	const [currentPage, setCurrentPage] = useState(1);
	const [totalCompetitions, setTotalCompetitions] = useState(0);
	const [error, setError] = useState<string | null>(null);
	
	// Modal states
	const [isCompetitionModalOpen, setIsCompetitionModalOpen] = useState(false);
	const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
	const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
	const [modalLoading, setModalLoading] = useState(false);
	
	// Current data for modals
	const [currentCompetition, setCurrentCompetition] = useState<Competition | null>(null);
	const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
	const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null);
	const [editingTrack, setEditingTrack] = useState<Track | null>(null);
	const [results, setResults] = useState<ResultFormData[]>([]);
	
	// Team members state
	const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
	const [teamMembersLoading, setTeamMembersLoading] = useState(false);

	// Viewing competition state
	const [isCompetitionViewOpen, setIsCompetitionViewOpen] = useState(false);
	const [viewingCompetition, setViewingCompetition] = useState<Competition | null>(null);
	
	const itemsPerPage = 10;
	const apiURL = import.meta.env.VITE_BACKEND_URL || '';

	// Helper function to get team member display name
	const getTeamMemberDisplayName = (teamMember: TeamMember) => {
		return `${teamMember.firstName} ${teamMember.lastName} (${teamMember.role.name})`;
	};

	// Add view competition function
	const handleViewCompetition = (competition: Competition) => {
		setViewingCompetition(competition);
		setIsCompetitionViewOpen(true);
	};

	// Updated form field definitions
	const competitionFields = [
		{ name: 'name' as keyof CompetitionFormData, label: 'Competition Name', type: 'text' as const, required: true },
		{ name: 'desc' as keyof CompetitionFormData, label: 'Description', type: 'textarea' as const, required: true },
		{ name: 'position' as keyof CompetitionFormData, label: 'Position', type: 'number' as const, required: true },
		{ name: 'points' as keyof CompetitionFormData, label: 'Points', type: 'number' as const, required: true },
		{ name: 'dateTime' as keyof CompetitionFormData, label: 'Date & Time', type: 'datetime-local' as const, required: true },
		{ name: 'isActive' as keyof CompetitionFormData, label: 'Active', type: 'checkbox' as const }
	];

	const trackFields = [
		{ name: 'name' as keyof TrackFormData, label: 'Track Name', type: 'text' as const, required: true },
		{ name: 'dateTime' as keyof TrackFormData, label: 'Date & Time', type: 'datetime-local' as const, required: true },
		{ name: 'status' as keyof TrackFormData, label: 'Status', type: 'select' as const, required: true, options: [
			{ value: 'future', label: 'Future' },
			{ value: 'next', label: 'Next' },
			{ value: 'past', label: 'Past' }
		] },
		{ name: 'personnel' as keyof TrackFormData, label: 'Personnel', type: 'array' as const }
	];

	// Define fields for viewing competitions
	const competitionViewFields = [
		{ name: 'name', label: 'Competition Name' },
		{ name: 'desc', label: 'Description' },
		{ name: 'position', label: 'Position' },
		{ name: 'points', label: 'Points' },
		{ name: 'dateTime', label: 'Date & Time' },
		{ name: 'isActive', label: 'Status' },
		{ name: 'createdAt', label: 'Created At' },
		{ name: 'updatedAt', label: 'Updated At' }
	];

	const fetchCompetitions = async (
		page: number = 1,
		search: string = '',
		status: string = '',
		sort: string = 'latest_updated'
	) => {
		try {
			setLoading(true);
			setError(null);

			const params = new URLSearchParams({
				page: page.toString(),
				limit: itemsPerPage.toString(),
				sort: sort,
				...(search && { search }),
				...(status && { status }),
			});

			const response = await fetch(`${apiURL}/api/admin/competitions/?${params}`, {
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch competitions: ${response.status}`);
			}

			const result: CompetitionsResponse = await response.json();
			setCompetitions(result.data);
			setTotalCompetitions(result.total);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
			console.error('Error fetching competitions:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCompetitions(currentPage, searchTerm, statusFilter, sortBy);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPage, searchTerm, statusFilter, sortBy]);

	const totalPages = Math.ceil(totalCompetitions / itemsPerPage);

	// Competition CRUD operations
	const handleCreateCompetition = () => {
		setEditingCompetition(null);
		setIsCompetitionModalOpen(true);
	};

	const handleEditCompetition = (competition: Competition) => {
		setEditingCompetition(competition);
		setIsCompetitionModalOpen(true);
	};

	const handleDeleteCompetition = async (id: string) => {
		if (!confirm('Are you sure you want to delete this competition?')) return;
		
		try {
			const response = await fetch(`${apiURL}/api/admin/competitions/${id}`, {
				method: 'DELETE',
				credentials: 'include',
			});

			if (!response.ok) {
				throw new Error('Failed to delete competition');
			}

			fetchCompetitions(currentPage, searchTerm, statusFilter, sortBy);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to delete competition');
		}
	};

	// Fixed toggle status function
	const handleToggleStatus = async (id: string) => {
		try {
			const response = await fetch(`${apiURL}/api/admin/competitions/${id}/status`, {
				method: 'PUT',
				credentials: 'include',
			});

			if (!response.ok) {
				throw new Error('Failed to toggle competition status');
			}

			fetchCompetitions(currentPage, searchTerm, statusFilter, sortBy);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to toggle competition status');
		}
	};

	const handleSubmitCompetition = async (data: CompetitionFormData) => {
		setModalLoading(true);
		try {
			// Format the datetime to ISO string if it's not already
			const formattedData = {
				...data,
				dateTime: data.dateTime ? new Date(data.dateTime).toISOString() : data.dateTime
			};

			const url = editingCompetition 
				? `${apiURL}/api/admin/competitions/${editingCompetition.id}`
				: `${apiURL}/api/admin/competitions/`;
			
			const method = editingCompetition ? 'PUT' : 'POST';

			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(formattedData),
			});

			if (!response.ok) {
				throw new Error(`Failed to ${editingCompetition ? 'update' : 'create'} competition`);
			}

			fetchCompetitions(currentPage, searchTerm, statusFilter, sortBy);
			setIsCompetitionModalOpen(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to save competition');
		} finally {
			setModalLoading(false);
		}
	};

	// Track CRUD operations
	const handleCreateTrack = (competition: Competition) => {
		setCurrentCompetition(competition);
		setEditingTrack(null);
		setIsTrackModalOpen(true);
	};

	const handleEditTrack = (competition: Competition, track: Track) => {
		setCurrentCompetition(competition);
		setEditingTrack(track);
		setIsTrackModalOpen(true);
	};

	// Fixed track CRUD operations
	const handleDeleteTrack = async (competitionId: string, trackId: string) => {
		if (!confirm('Are you sure you want to delete this track?')) return;
		
		try {
			const response = await fetch(`${apiURL}/api/admin/competitions/tracks/${trackId}?competition_id=${competitionId}`, {
				method: 'DELETE',
				credentials: 'include',
			});

			if (!response.ok) {
				throw new Error('Failed to delete track');
			}

			fetchCompetitions(currentPage, searchTerm, statusFilter, sortBy);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to delete track');
		}
	};

	const handleSubmitTrack = async (data: TrackFormData) => {
		if (!currentCompetition) return;
		
		setModalLoading(true);
		try {
			// Format the datetime to ISO string if it's not already
			const formattedData = {
				...data,
				dateTime: data.dateTime ? new Date(data.dateTime).toISOString() : data.dateTime
			};

			const url = editingTrack 
				? `${apiURL}/api/admin/competitions/tracks/${editingTrack.id}?competition_id=${currentCompetition.id}`
				: `${apiURL}/api/admin/competitions/tracks?competition_id=${currentCompetition.id}`;
			
			const method = editingTrack ? 'PUT' : 'POST';

			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(formattedData),
			});

			if (!response.ok) {
				throw new Error(`Failed to ${editingTrack ? 'update' : 'create'} track`);
			}

			fetchCompetitions(currentPage, searchTerm, statusFilter, sortBy);
			setIsTrackModalOpen(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to save track');
		} finally {
			setModalLoading(false);
		}
	};

	// Add team members fetch function
	const fetchTeamMembers = async () => {
		try {
			setTeamMembersLoading(true);
			const response = await fetch(`${apiURL}/api/admin/team-members/?limit=100&sort=name&role=Driver`, {
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error('Failed to fetch team members');
			}

			const result: TeamMembersResponse = await response.json();
			setTeamMembers(result.data);
		} catch (err) {
			console.error('Error fetching team members:', err);
		} finally {
			setTeamMembersLoading(false);
		}
	};

	const handleManageResults = (competition: Competition, track: Track) => {
		setCurrentCompetition(competition);
		setCurrentTrack(track);
		setResults(track.results || []);
		// Fetch team members when opening results modal
		fetchTeamMembers();
		setIsResultsModalOpen(true);
	};

	const handleAddResult = () => {
		setResults([...results, { driver: '', quali_position: 0, race_position: 0 }]);
	};

	const handleRemoveResult = (index: number) => {
		setResults(results.filter((_, i) => i !== index));
	};

	const handleResultChange = (index: number, field: keyof ResultFormData, value: string | number) => {
		const newResults = [...results];
		newResults[index] = { ...newResults[index], [field]: value };
		setResults(newResults);
	};

	// Updated results management (since backend stores results in track.Results)
	const handleSubmitResults = async () => {
		if (!currentCompetition || !currentTrack) return;
		
		setModalLoading(true);
		try {
			// Update the track with new results
			const updatedTrack = {
				...currentTrack,
				results: results
			};

			const response = await fetch(
				`${apiURL}/api/admin/competitions/tracks/${currentTrack.id}?competition_id=${currentCompetition.id}`,
				{
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify(updatedTrack),
				}
			);

			if (!response.ok) {
				throw new Error('Failed to update results');
			}

			fetchCompetitions(currentPage, searchTerm, statusFilter, sortBy);
			setIsResultsModalOpen(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to save results');
		} finally {
			setModalLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-100">
			<div className="max-w-7xl mx-auto space-y-6">
				<CompetitionsHeader
					onCreateCompetition={handleCreateCompetition}
					totalCompetitions={totalCompetitions}
				/>

				{error && (
					<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
						<div className="flex items-center">
							<svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
							</svg>
							{error}
						</div>
					</div>
				)}

				<CompetitionsFilters
					searchTerm={searchTerm}
					statusFilter={statusFilter}
					sortBy={sortBy}
					onSearchChange={(e) => {
						setSearchTerm(e.target.value);
						setCurrentPage(1);
					}}
					onStatusFilterChange={(e) => {
						setStatusFilter(e.target.value);
						setCurrentPage(1);
					}}
					onSortChange={(e) => {
						setSortBy(e.target.value);
						setCurrentPage(1);
					}}
				/>

				<CompetitionsList
					competitions={competitions}
					loading={loading}
					onEdit={handleEditCompetition}
					onView={handleViewCompetition}
					onDelete={handleDeleteCompetition}
					onToggleStatus={handleToggleStatus}
					onCreateTrack={handleCreateTrack}
					onEditTrack={handleEditTrack}
					onDeleteTrack={handleDeleteTrack}
					onManageResults={handleManageResults}
				/>

				<Pagination
					currentPage={currentPage}
					totalPages={totalPages}
					totalItems={totalCompetitions}
					itemsPerPage={itemsPerPage}
					onPageChange={setCurrentPage}
				/>

				{/* Competition Form Modal */}
				<FormModal<CompetitionFormData>
					isOpen={isCompetitionModalOpen}
					onClose={() => setIsCompetitionModalOpen(false)}
					onSubmit={handleSubmitCompetition}
					title={editingCompetition ? 'Edit Competition' : 'Create Competition'}
					fields={competitionFields}
					initialData={editingCompetition ? {
						id: editingCompetition.id,
						name: editingCompetition.name,
						desc: editingCompetition.desc,
						position: editingCompetition.position,
						points: editingCompetition.points,
						dateTime: editingCompetition.dateTime,
						isActive: editingCompetition.isActive
					} as CompetitionFormData : {}}
					isLoading={modalLoading}
				/>

				{/* Track Form Modal */}
				<FormModal<TrackFormData>
					isOpen={isTrackModalOpen}
					onClose={() => setIsTrackModalOpen(false)}
					onSubmit={handleSubmitTrack}
					title={editingTrack ? 'Edit Track' : 'Create Track'}
					fields={trackFields}
					initialData={editingTrack ? {
						id: editingTrack.id,
						name: editingTrack.name,
						dateTime: editingTrack.dateTime,
						status: editingTrack.status,
						personnel: editingTrack.personnel
					} as TrackFormData : {}}
					isLoading={modalLoading}
				/>

				{/* Competition View Modal */}
				<ViewModal<Competition>
					isOpen={isCompetitionViewOpen}
					onClose={() => setIsCompetitionViewOpen(false)}
					fields={competitionViewFields}
					data={viewingCompetition || {}}
					linkedSubjects={[
						{
							name: 'Edit Competition',
							link: '#'
						}
					]}
				/>

				{/* Results Management Modal */}
				{isResultsModalOpen && (
					<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
						<div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
							<div className="p-6">
								<div className="flex justify-between items-center mb-6">
									<h2 className="text-xl font-semibold text-gray-900">
										Manage Results - {currentTrack?.name}
									</h2>
									<button 
										onClick={() => setIsResultsModalOpen(false)} 
										className="text-gray-400 hover:text-gray-600"
									>
										<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</div>

								<div className="space-y-4">
									{results.map((result, index) => (
										<div key={index} className="flex gap-4 items-center p-4 border rounded-lg">
											<select
												value={result.driver}
												onChange={(e) => handleResultChange(index, 'driver', e.target.value)}
												className="flex-1 px-3 py-2 border rounded-lg bg-white"
												disabled={teamMembersLoading}
											>
												<option value="">Select Driver...</option>
												{teamMembers.map((member) => (
													<option key={member.id} value={member.id}>
														{getTeamMemberDisplayName(member)}
													</option>
												))}
											</select>
											{teamMembersLoading && (
												<div className="text-sm text-gray-500">Loading drivers...</div>
											)}
											<input
												type="number"
												placeholder="Quali Position"
												value={result.quali_position}
												onChange={(e) => handleResultChange(index, 'quali_position', parseInt(e.target.value) || 0)}
												className="w-32 px-3 py-2 border rounded-lg"
											/>
											<input
												type="number"
												placeholder="Race Position"
												value={result.race_position}
												onChange={(e) => handleResultChange(index, 'race_position', parseInt(e.target.value) || 0)}
												className="w-32 px-3 py-2 border rounded-lg"
											/>
											<button
												onClick={() => handleRemoveResult(index)}
												className="px-3 py-2 text-red-600 hover:text-red-800 border border-red-300 rounded-lg hover:bg-red-50"
											>
												×
											</button>
										</div>
									))}
									
									<button
										onClick={handleAddResult}
										className="w-full px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
									>
										+ Add Result
									</button>
								</div>

								<div className="mt-6 flex justify-end gap-3">
									<button
										onClick={() => setIsResultsModalOpen(false)}
										className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
									>
										Cancel
									</button>
									<button
										onClick={handleSubmitResults}
										disabled={modalLoading}
										className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
									>
										{modalLoading ? 'Saving...' : 'Save Results'}
									</button>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default AdminCompetitions;