import React, { useState, useEffect } from 'react';
import FormModal from '../../Components/Admin/FormModal';
import ViewModal from '../../Components/Admin/ViewModal';

interface TeamMember {
	id: string;
	firstName: string;
	lastName: string;
	role: {
		id: string;
		name: string;
	};
}

interface Track {
	id: string;
	name: string;
	dateTime: string;
	status: 'past' | 'next' | 'future';
	personnel: string[];
	personnelData?: TeamMember[];
	results: {
		driver: string;
		quali_position: number;
		race_position: number;
	}[];
}

interface Competition {
	id: string;
	name: string;
	desc: string;
	schedule: Track[];
	position: number;
	points: number;
	dateTime: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	[key: string]: unknown;
}

interface CompetitionsResponse {
	data: Competition[];
	total: number;
	page: number;
	limit: number;
}

interface CompetitionFormData extends Record<string, unknown> {
	id: string;
	name: string;
	desc: string;
	position: number;
	points: number;
	dateTime: string;
	isActive: boolean;
}

interface TrackFormData extends Record<string, unknown> {
	id: string;
	name: string;
	dateTime: string;
	status: string;
	personnel: string[];
}

interface ResultFormData extends Record<string, unknown> {
	driver: string;
	quali_position: number;
	race_position: number;
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
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null);
	const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
	const [isViewModalOpen, setIsViewModalOpen] = useState(false);
	
	// Track management states
	const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
	const [editingTrack, setEditingTrack] = useState<Track | null>(null);
	const [selectedCompetitionForTrack, setSelectedCompetitionForTrack] = useState<Competition | null>(null);
	
	// Results management states
	const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
	const [selectedTrackForResults, setSelectedTrackForResults] = useState<Track | null>(null);
	const [trackResults, setTrackResults] = useState<ResultFormData[]>([]);
	
	const itemsPerPage = 10;
	const apiURL = import.meta.env.VITE_BACKEND_URL || '';

	const competitionFields = [
		{
			name: 'name' as keyof CompetitionFormData,
			label: 'Competition Name',
			type: 'text' as const,
			required: true,
			placeholder: 'Enter competition name',
		},
		{
			name: 'desc' as keyof CompetitionFormData,
			label: 'Description',
			type: 'textarea' as const,
			required: true,
			placeholder: 'Enter competition description',
		},
		{
			name: 'position' as keyof CompetitionFormData,
			label: 'Championship Position',
			type: 'number' as const,
			required: true,
			placeholder: 'Enter championship position',
		},
		{
			name: 'points' as keyof CompetitionFormData,
			label: 'Points',
			type: 'number' as const,
			required: true,
			placeholder: 'Enter points',
		},
		{
			name: 'dateTime' as keyof CompetitionFormData,
			label: 'Date & Time',
			type: 'date' as const,
			required: true,
		},
		{
			name: 'isActive' as keyof CompetitionFormData,
			label: 'Active',
			type: 'checkbox' as const,
			required: false,
		},
	];

	const trackFields = [
		{
			name: 'name' as keyof TrackFormData,
			label: 'Track Name',
			type: 'text' as const,
			required: true,
			placeholder: 'Enter track name',
		},
		{
			name: 'dateTime' as keyof TrackFormData,
			label: 'Date & Time',
			type: 'date' as const,
			required: true,
		},
		{
			name: 'status' as keyof TrackFormData,
			label: 'Status',
			type: 'select' as const,
			required: true,
			options: [
				{ value: 'future', label: 'Future' },
				{ value: 'next', label: 'Next' },
				{ value: 'past', label: 'Past' },
			],
		},
		{
			name: 'personnel' as keyof TrackFormData,
			label: 'Personnel',
			type: 'array' as const,
			required: false,
			arrayType: 'text' as const,
		},
	];

	const viewFields = [
		{ name: 'name', label: 'Name' },
		{ name: 'desc', label: 'Description' },
		{ name: 'position', label: 'Championship Position' },
		{ name: 'points', label: 'Points' },
		{ name: 'dateTime', label: 'Date & Time' },
		{ name: 'isActive', label: 'Active' },
		{ name: 'createdAt', label: 'Created At' },
		{ name: 'updatedAt', label: 'Updated At' },
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
		// eslint-disable-next-line
	}, [currentPage, searchTerm, statusFilter, sortBy]);

	const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value);
		setCurrentPage(1);
	};

	const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setStatusFilter(e.target.value);
		setCurrentPage(1);
	};

	const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setSortBy(e.target.value);
		setCurrentPage(1);
	};

	const handleCreateCompetition = () => {
		setEditingCompetition(null);
		setIsModalOpen(true);
	};

	const handleEditCompetition = (competition: Competition) => {
		setEditingCompetition(competition);
		setIsModalOpen(true);
	};

	const handleViewCompetition = (competition: Competition) => {
		setSelectedCompetition(competition);
		setIsViewModalOpen(true);
	};

	const handleDeleteCompetition = async (id: string) => {
		if (!confirm('Are you sure you want to delete this competition?')) return;

		try {
			const response = await fetch(`${apiURL}/api/admin/competitions/${id}`, {
				method: 'DELETE',
				credentials: 'include',
			});

			if (response.ok) {
				fetchCompetitions(currentPage, searchTerm, statusFilter, sortBy);
			} else {
				throw new Error('Failed to delete competition');
			}
		} catch (err) {
			console.error('Error deleting competition:', err);
			setError('Failed to delete competition');
		}
	};

	const handleToggleStatus = async (id: string) => {
		try {
			const response = await fetch(`${apiURL}/api/admin/competitions/${id}/status`, {
				method: 'PUT',
				credentials: 'include',
			});

			if (response.ok) {
				fetchCompetitions(currentPage, searchTerm, statusFilter, sortBy);
			} else {
				throw new Error('Failed to toggle competition status');
			}
		} catch (err) {
			console.error('Error toggling competition status:', err);
			setError('Failed to toggle competition status');
		}
	};

	const handleSubmitCompetition = async (formData: CompetitionFormData) => {
		try {
			const url = editingCompetition
				? `${apiURL}/api/admin/competitions/${editingCompetition.id}`
				: `${apiURL}/api/admin/competitions/`;
			const method = editingCompetition ? 'PUT' : 'POST';

			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify(formData),
			});

			if (response.ok) {
				setIsModalOpen(false);
				fetchCompetitions(currentPage, searchTerm, statusFilter, sortBy);
			} else {
				throw new Error('Failed to save competition');
			}
		} catch (err) {
			console.error('Error saving competition:', err);
			throw err;
		}
	};

	// Track management functions
	const handleCreateTrack = (competition: Competition) => {
		setSelectedCompetitionForTrack(competition);
		setEditingTrack(null);
		setIsTrackModalOpen(true);
	};

	const handleEditTrack = (competition: Competition, track: Track) => {
		setSelectedCompetitionForTrack(competition);
		setEditingTrack(track);
		setIsTrackModalOpen(true);
	};

	const handleDeleteTrack = async (competitionId: string, trackId: string) => {
		if (!confirm('Are you sure you want to delete this track?')) return;

		try {
			const response = await fetch(`${apiURL}/api/admin/competitions/tracks/${trackId}?competition_id=${competitionId}`, {
				method: 'DELETE',
				credentials: 'include',
			});

			if (response.ok) {
				fetchCompetitions(currentPage, searchTerm, statusFilter, sortBy);
			} else {
				throw new Error('Failed to delete track');
			}
		} catch (err) {
			console.error('Error deleting track:', err);
			setError('Failed to delete track');
		}
	};

	const handleToggleTrackStatus = async (competitionId: string, trackId: string) => {
		try {
			const response = await fetch(`${apiURL}/api/admin/competitions/tracks/${trackId}/status?competition_id=${competitionId}`, {
				method: 'PUT',
				credentials: 'include',
			});

			if (response.ok) {
				fetchCompetitions(currentPage, searchTerm, statusFilter, sortBy);
			} else {
				throw new Error('Failed to toggle track status');
			}
		} catch (err) {
			console.error('Error toggling track status:', err);
			setError('Failed to toggle track status');
		}
	};

	const handleSubmitTrack = async (formData: TrackFormData) => {
		if (!selectedCompetitionForTrack) return;

		try {
			const url = editingTrack
				? `${apiURL}/api/admin/competitions/tracks/${editingTrack.id}?competition_id=${selectedCompetitionForTrack.id}`
				: `${apiURL}/api/admin/competitions/tracks?competition_id=${selectedCompetitionForTrack.id}`;
			const method = editingTrack ? 'PUT' : 'POST';

			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify(formData),
			});

			if (response.ok) {
				setIsTrackModalOpen(false);
				fetchCompetitions(currentPage, searchTerm, statusFilter, sortBy);
			} else {
				throw new Error('Failed to save track');
			}
		} catch (err) {
			console.error('Error saving track:', err);
			throw err;
		}
	};

	// Results management functions
	const handleManageResults = (competition: Competition, track: Track) => {
		setSelectedCompetitionForTrack(competition);
		setSelectedTrackForResults(track);
		setTrackResults(track.results || []);
		setIsResultsModalOpen(true);
	};

	const handleAddResult = () => {
		setTrackResults([...trackResults, { driver: '', quali_position: 0, race_position: 0 }]);
	};

	const handleRemoveResult = (index: number) => {
		setTrackResults(trackResults.filter((_, i) => i !== index));
	};

	const handleResultChange = (index: number, field: keyof ResultFormData, value: string | number) => {
		const updatedResults = [...trackResults];
		updatedResults[index] = { ...updatedResults[index], [field]: value };
		setTrackResults(updatedResults);
	};

	const handleSubmitResults = async () => {
		if (!selectedCompetitionForTrack || !selectedTrackForResults) return;

		try {
			// Update the track with new results by updating the entire competition
			const updatedCompetition = {
				...selectedCompetitionForTrack,
				schedule: selectedCompetitionForTrack.schedule.map(track => 
					track.id === selectedTrackForResults.id 
						? { ...track, results: trackResults }
						: track
				)
			};

			const response = await fetch(`${apiURL}/api/admin/competitions/${selectedCompetitionForTrack.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify(updatedCompetition),
			});

			if (response.ok) {
				setIsResultsModalOpen(false);
				fetchCompetitions(currentPage, searchTerm, statusFilter, sortBy);
			} else {
				throw new Error('Failed to save results');
			}
		} catch (err) {
			console.error('Error saving results:', err);
			setError('Failed to save results');
		}
	};

	const totalPages = Math.ceil(totalCompetitions / itemsPerPage);

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold text-gray-900">Competitions Management</h1>
				<button
					onClick={handleCreateCompetition}
					className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
				>
					Add Competition
				</button>
			</div>

			{error && (
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
					{error}
				</div>
			)}

			{/* Filters */}
			<div className="bg-white p-4 rounded-lg shadow space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<input
						type="text"
						placeholder="Search competitions..."
						value={searchTerm}
						onChange={handleSearch}
						className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<select
						value={statusFilter}
						onChange={handleStatusFilter}
						className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">All Status</option>
						<option value="active">Active</option>
						<option value="inactive">Inactive</option>
					</select>
					<select
						value={sortBy}
						onChange={handleSortChange}
						className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

			{/* Competitions List */}
			{loading ? (
				<div className="flex justify-center items-center py-8">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
				</div>
			) : (
				<div className="bg-white rounded-lg shadow overflow-hidden">
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Competition
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Position
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Points
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Tracks
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Status
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{competitions.map((competition) => (
									<React.Fragment key={competition.id}>
										<tr className="hover:bg-gray-50">
											<td className="px-6 py-4 whitespace-nowrap">
												<div>
													<div className="text-sm font-medium text-gray-900">
														{competition.name}
													</div>
													<div className="text-sm text-gray-500">
														{competition.desc}
													</div>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												{competition.position}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												{competition.points}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												{competition.schedule?.length || 0} tracks
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<span
													className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
														competition.isActive
															? 'bg-green-100 text-green-800'
															: 'bg-red-100 text-red-800'
													}`}
												>
													{competition.isActive ? 'Active' : 'Inactive'}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
												<button
													onClick={() => handleViewCompetition(competition)}
													className="text-blue-600 hover:text-blue-900"
												>
													View
												</button>
												<button
													onClick={() => handleEditCompetition(competition)}
													className="text-indigo-600 hover:text-indigo-900"
												>
													Edit
												</button>
												<button
													onClick={() => handleToggleStatus(competition.id)}
													className={`${
														competition.isActive
															? 'text-red-600 hover:text-red-900'
															: 'text-green-600 hover:text-green-900'
													}`}
												>
													{competition.isActive ? 'Deactivate' : 'Activate'}
												</button>
												<button
													onClick={() => handleDeleteCompetition(competition.id)}
													className="text-red-600 hover:text-red-900"
												>
													Delete
												</button>
											</td>
										</tr>
										{/* Tracks sub-table */}
										{competition.schedule && competition.schedule.length > 0 && (
											<tr>
												<td colSpan={6} className="px-6 py-2 bg-gray-50">
													<div className="space-y-2">
														<div className="flex justify-between items-center">
															<h4 className="text-sm font-medium text-gray-700">Tracks:</h4>
															<button
																onClick={() => handleCreateTrack(competition)}
																className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
															>
																Add Track
															</button>
														</div>
														<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
															{competition.schedule.map((track) => (
																<div key={track.id} className="bg-white p-3 rounded border">
																	<div className="flex justify-between items-start mb-2">
																		<div>
																			<div className="text-sm font-medium">{track.name}</div>
																			<div className="text-xs text-gray-500">
																				{new Date(track.dateTime).toLocaleDateString()}
																			</div>
																		</div>
																		<span
																			className={`text-xs px-2 py-1 rounded ${
																				track.status === 'past'
																					? 'bg-gray-100 text-gray-800'
																					: track.status === 'next'
																					? 'bg-yellow-100 text-yellow-800'
																					: 'bg-blue-100 text-blue-800'
																			}`}
																		>
																			{track.status}
																		</span>
																	</div>
																	<div className="text-xs text-gray-600 mb-2">
																		Results: {track.results?.length || 0}
																	</div>
																	<div className="flex flex-wrap gap-1">
																		<button
																			onClick={() => handleEditTrack(competition, track)}
																			className="text-xs text-blue-600 hover:text-blue-800"
																		>
																			Edit
																		</button>
																		<button
																			onClick={() => handleToggleTrackStatus(competition.id, track.id)}
																			className="text-xs text-yellow-600 hover:text-yellow-800"
																		>
																			Toggle Status
																		</button>
																		<button
																			onClick={() => handleManageResults(competition, track)}
																			className="text-xs text-green-600 hover:text-green-800"
																		>
																			Results
																		</button>
																		<button
																			onClick={() => handleDeleteTrack(competition.id, track.id)}
																			className="text-xs text-red-600 hover:text-red-800"
																		>
																			Delete
																		</button>
																	</div>
																</div>
															))}
														</div>
													</div>
												</td>
											</tr>
										)}
									</React.Fragment>
								))}
							</tbody>
						</table>
					</div>

					{/* Pagination */}
					{totalPages > 1 && (
						<div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
							<div className="flex items-center justify-between">
								<div className="flex-1 flex justify-between sm:hidden">
									<button
										onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
										disabled={currentPage === 1}
										className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
									>
										Previous
									</button>
									<button
										onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
										disabled={currentPage === totalPages}
										className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
									>
										Next
									</button>
								</div>
								<div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
									<div>
										<p className="text-sm text-gray-700">
											Showing{' '}
											<span className="font-medium">
												{(currentPage - 1) * itemsPerPage + 1}
											</span>{' '}
											to{' '}
											<span className="font-medium">
												{Math.min(currentPage * itemsPerPage, totalCompetitions)}
											</span>{' '}
											of{' '}
											<span className="font-medium">{totalCompetitions}</span> results
										</p>
									</div>
									<div>
										<nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
											{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
												<button
													key={page}
													onClick={() => setCurrentPage(page)}
													className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
														currentPage === page
															? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
															: 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
													}`}
												>
													{page}
												</button>
											))}
										</nav>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Competition Form Modal */}
			<FormModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onSubmit={handleSubmitCompetition}
				fields={competitionFields}
				initialData={editingCompetition || {}}
				title={editingCompetition ? 'Edit Competition' : 'Create Competition'}
			/>

			{/* Competition View Modal */}
			<ViewModal
				isOpen={isViewModalOpen}
				onClose={() => setIsViewModalOpen(false)}
				fields={viewFields}
				data={selectedCompetition || {}}
				linkedSubjects={[]}
			/>

			{/* Track Form Modal */}
			<FormModal
				isOpen={isTrackModalOpen}
				onClose={() => setIsTrackModalOpen(false)}
				onSubmit={handleSubmitTrack}
				fields={trackFields}
				initialData={editingTrack ? {
					id: editingTrack.id,
					name: editingTrack.name,
					dateTime: editingTrack.dateTime,
					status: editingTrack.status,
					personnel: editingTrack.personnel
				} : {}}
				title={editingTrack ? 'Edit Track' : 'Add Track'}
			/>

			{/* Results Management Modal */}
			{isResultsModalOpen && selectedTrackForResults && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
						<div className="px-6 py-4 border-b border-gray-200">
							<div className="flex items-center justify-between">
								<h3 className="text-lg font-medium text-gray-900">
									Manage Results - {selectedTrackForResults.name}
								</h3>
								<button
									onClick={() => setIsResultsModalOpen(false)}
									className="text-gray-400 hover:text-gray-600"
								>
									<span className="sr-only">Close</span>
									<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
						</div>

						<div className="px-6 py-4">
							<div className="mb-4">
								<button
									onClick={handleAddResult}
									className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
								>
									Add Result
								</button>
							</div>

							<div className="space-y-4">
								{trackResults.map((result, index) => (
									<div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Driver
											</label>
											<input
												type="text"
												value={result.driver}
												onChange={(e) => handleResultChange(index, 'driver', e.target.value)}
												placeholder="Driver name"
												className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Quali Position
											</label>
											<input
												type="number"
												value={result.quali_position}
												onChange={(e) => handleResultChange(index, 'quali_position', parseInt(e.target.value) || 0)}
												min="1"
												className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Race Position
											</label>
											<input
												type="number"
												value={result.race_position}
												onChange={(e) => handleResultChange(index, 'race_position', parseInt(e.target.value) || 0)}
												min="1"
												className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>
										<div className="flex items-end">
											<button
												onClick={() => handleRemoveResult(index)}
												className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium transition-colors"
											>
												Remove
											</button>
										</div>
									</div>
								))}
							</div>

							{trackResults.length === 0 && (
								<div className="text-center py-8 text-gray-500">
									No results added yet. Click "Add Result" to start.
								</div>
							)}
						</div>

						<div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
							<button
								onClick={() => setIsResultsModalOpen(false)}
								className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleSubmitResults}
								className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
							>
								Save Results
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default AdminCompetitions;