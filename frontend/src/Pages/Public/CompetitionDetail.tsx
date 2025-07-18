import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../Components/Navbar';

interface Track {
	id: string;
	name: string;
	dateTime: string;
	status: string;
	personnel: string[];
	personnelData?: {
		id: string;
		firstName: string;
		lastName: string;
		role: {
			id: string;
			name: string;
			description: string;
		};
		createdAt: string;
		updatedAt: string;
	}[];
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
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

const CompetitionDetail: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [competition, setCompetition] = useState<Competition | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const apiURL = import.meta.env.VITE_BACKEND_URL || '';

	useEffect(() => {
		if (id) {
			fetchCompetition();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	const fetchCompetition = async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await fetch(`${apiURL}/api/competitions/${id}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				if (response.status === 404) {
					throw new Error('Competition not found');
				}
				throw new Error('Failed to fetch competition');
			}

			const data = await response.json();
			setCompetition(data);
		} catch (err) {
			console.error('Error fetching competition:', err);
			setError(err instanceof Error ? err.message : 'Failed to load competition. Please try again later.');
		} finally {
			setLoading(false);
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const getPositionColor = (position: number) => {
		if (position === 1) return 'text-yellow-400';
		if (position === 2) return 'text-gray-300';
		if (position === 3) return 'text-orange-400';
		return 'text-gray-400';
	};

	// Add this helper function after the getPositionColor function
	const getDriverName = (driverId: string, personnelData?: Track['personnelData']) => {
		if (!personnelData) return `Driver ${driverId.slice(0, 8)}`;
		
		const driver = personnelData.find(person => 
			person.id === driverId && person.role.name.toLowerCase().includes('driver')
		);
		
		return driver ? `${driver.firstName} ${driver.lastName}` : `Driver ${driverId.slice(0, 8)}`;
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-900">
				<Navbar />
				{/* Sub Navigation */}
				<div className="bg-gray-800 border-b border-gray-700">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="flex space-x-8">
							<Link
								to="/about"
								className="py-4 px-1 border-b-2 border-transparent text-gray-300 hover:text-yellow-400 hover:border-gray-600 font-medium text-sm transition-colors"
							>
								Team Members
							</Link>
							<Link
								to="/competitions"
								className="py-4 px-1 border-b-2 border-yellow-400 text-yellow-400 font-medium text-sm transition-colors"
							>
								Competitions
							</Link>
							<Link
								to="/contact"
								className="py-4 px-1 border-b-2 border-transparent text-gray-300 hover:text-yellow-400 hover:border-gray-600 font-medium text-sm transition-colors"
							>
								Contact
							</Link>
						</div>
					</div>
				</div>
				<div className="flex items-center justify-center min-h-[60vh]">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-gray-900">
				<Navbar />
				{/* Sub Navigation */}
				<div className="bg-gray-800 border-b border-gray-700">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="flex space-x-8">
							<Link
								to="/about"
								className="py-4 px-1 border-b-2 border-transparent text-gray-300 hover:text-yellow-400 hover:border-gray-600 font-medium text-sm transition-colors"
							>
								Team Members
							</Link>
							<Link
								to="/competitions"
								className="py-4 px-1 border-b-2 border-yellow-400 text-yellow-400 font-medium text-sm transition-colors"
							>
								Competitions
							</Link>
							<Link
								to="/contact"
								className="py-4 px-1 border-b-2 border-transparent text-gray-300 hover:text-yellow-400 hover:border-gray-600 font-medium text-sm transition-colors"
							>
								Contact
							</Link>
						</div>
					</div>
				</div>
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
					<div className="text-center">
						<div className="text-red-400 text-lg mb-4">{error}</div>
						<div className="space-x-4">
							<button
								onClick={fetchCompetition}
								className="bg-yellow-400 text-black px-6 py-2 rounded-lg hover:bg-yellow-500 transition-colors"
							>
								Try Again
							</button>
							<button
								onClick={() => navigate('/competitions')}
								className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
							>
								Back to Competitions
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (!competition) {
		return null;
	}

	return (
		<div className="min-h-screen bg-gray-900">
			<Navbar />
			
			{/* Sub Navigation */}
			<div className="bg-gray-800 border-b border-gray-700">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex space-x-8">
						<Link
							to="/about"
							className="py-4 px-1 border-b-2 border-transparent text-gray-300 hover:text-yellow-400 hover:border-gray-600 font-medium text-sm transition-colors"
						>
							Team Members
						</Link>
						<Link
							to="/competitions"
							className="py-4 px-1 border-b-2 border-yellow-400 text-yellow-400 font-medium text-sm transition-colors"
						>
							Competitions
						</Link>
						<Link
							to="/contact"
							className="py-4 px-1 border-b-2 border-transparent text-gray-300 hover:text-yellow-400 hover:border-gray-600 font-medium text-sm transition-colors"
						>
							Contact
						</Link>
					</div>
				</div>
			</div>

			{/* Header */}
			<div className="bg-gray-800 border-b border-gray-700">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div className="flex items-center space-x-4 mb-4">
						<button
							onClick={() => navigate('/competitions')}
							className="text-gray-400 hover:text-yellow-400 transition-colors"
						>
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
							</svg>
						</button>
						<div>
							<h1 className="text-3xl font-bold text-white mb-2">{competition.name}</h1>
							<div className="flex items-center space-x-4">
								<span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
									competition.isActive 
										? 'bg-green-100 text-green-800' 
										: 'bg-gray-100 text-gray-800'
								}`}>
									{competition.isActive ? 'Active' : 'Completed'}
								</span>
								<span className="text-gray-400 text-sm">
									Created: {formatDate(competition.createdAt)}
								</span>
							</div>
						</div>
					</div>
					{competition.desc && (
						<p className="text-gray-300 text-lg">{competition.desc}</p>
					)}
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				{!competition.schedule || competition.schedule.length === 0 ? (
					<div className="text-center py-12">
						<div className="text-gray-400 text-lg mb-4">No race schedule available</div>
						<p className="text-gray-500">The schedule for this competition has not been published yet.</p>
					</div>
				) : (
					<div className="space-y-8">
						<h2 className="text-2xl font-bold text-white mb-6">Race Schedule & Results</h2>
						
						{competition.schedule.map((track, index) => (
							<div key={track.id || index} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
								{/* Track Header */}
								<div className="p-6 border-b border-gray-700">
									<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
										<h3 className="text-xl font-bold text-white">{track.name}</h3>
										<div className="flex items-center space-x-3">
											<span className="text-gray-300">
												{formatDate(track.dateTime)}
											</span>
											<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
												track.status === 'past' 
													? 'bg-gray-100 text-gray-800'
													: track.status === 'next'
													? 'bg-green-100 text-green-800' 
													: 'bg-blue-100 text-blue-800'
											}`}>
												{track.status === 'past' ? 'Completed' : track.status === 'next' ? 'Next' : 'Future'}
											</span>
										</div>
									</div>

									{/* Personnel */}
									{track.personnelData && track.personnelData.length > 0 && (
										<div className="mb-4">
											<h4 className="text-sm font-medium text-gray-400 mb-2">Personnel</h4>
											<div className="flex flex-wrap gap-2">
												{track.personnelData.map((person, idx) => (
													<span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gray-700 text-gray-300">
														{person.firstName} {person.lastName} - {person.role.name}
													</span>
												))}
											</div>
										</div>
									)}
								</div>

								{/* Results */}
								{track.results && track.results.length > 0 && (
									<div className="p-6">
										<h4 className="text-lg font-semibold text-white mb-4">Results</h4>
										<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
											{/* Qualifying Results */}
											<div>
												<h5 className="text-md font-medium text-gray-300 mb-3">Qualifying</h5>
												<div className="space-y-2">
													{track.results
														.sort((a, b) => a.quali_position - b.quali_position)
														.map((result, idx) => (
															<div key={idx} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
																<div className="flex items-center space-x-3">
																	<span className={`font-bold text-lg ${getPositionColor(result.quali_position)}`}>
																		P{result.quali_position}
																	</span>
																	<span className="text-gray-300">
																		{getDriverName(result.driver, track.personnelData)}
																	</span>
																</div>
															</div>
														))}
												</div>
											</div>

											{/* Race Results */}
											<div>
												<h5 className="text-md font-medium text-gray-300 mb-3">Race</h5>
												<div className="space-y-2">
													{track.results
														.sort((a, b) => a.race_position - b.race_position)
														.map((result, idx) => (
															<div key={idx} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
																<div className="flex items-center space-x-3">
																	<span className={`font-bold text-lg ${getPositionColor(result.race_position)}`}>
																		P{result.race_position}
																	</span>
																	<span className="text-gray-300">
																		{getDriverName(result.driver, track.personnelData)}
																	</span>
																</div>
																{result.race_position <= 3 && (
																	<div className="text-right">
																		{result.race_position === 1 && (
																			<span className="text-yellow-400">🏆</span>
																		)}
																		{result.race_position === 2 && (
																			<span className="text-gray-300">🥈</span>
																		)}
																		{result.race_position === 3 && (
																			<span className="text-orange-400">🥉</span>
																		)}
																	</div>
																)}
															</div>
														))}
												</div>
											</div>
										</div>
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default CompetitionDetail;