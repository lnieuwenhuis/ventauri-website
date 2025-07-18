import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../Components/Navbar';

interface Track {
	id: string;
	name: string;
	datetime: string;
	isActive: boolean;
	personnel: string[];
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

const Competitions: React.FC = () => {
	const [competitions, setCompetitions] = useState<Competition[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const apiURL = import.meta.env.VITE_BACKEND_URL || '';

	useEffect(() => {
		fetchCompetitions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const fetchCompetitions = async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await fetch(`${apiURL}/api/competitions/`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error('Failed to fetch competitions');
			}

			const data = await response.json();
			setCompetitions(data || []);
		} catch (err) {
			console.error('Error fetching competitions:', err);
			setError('Failed to load competitions. Please try again later.');
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
							<span className="py-4 px-1 border-b-2 border-yellow-400 text-yellow-400 font-medium text-sm">
								Competitions
							</span>
							<Link
								to="/about"
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
							<span className="py-4 px-1 border-b-2 border-yellow-400 text-yellow-400 font-medium text-sm">
								Competitions
							</span>
							<Link
								to="/about"
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
						<button
							onClick={fetchCompetitions}
							className="bg-yellow-400 text-black px-6 py-2 rounded-lg hover:bg-yellow-500 transition-colors"
						>
							Try Again
						</button>
					</div>
				</div>
			</div>
		);
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
						<span className="py-4 px-1 border-b-2 border-yellow-400 text-yellow-400 font-medium text-sm">
							Competitions
						</span>
						<Link
							to="/about"
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
					<h1 className="text-3xl font-bold text-white mb-2">Competitions</h1>
					<p className="text-gray-300">Follow our racing schedule and results</p>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				{competitions.length === 0 ? (
					<div className="text-center py-12">
						<div className="text-gray-400 text-lg mb-4">No active competitions found</div>
						<p className="text-gray-500">Check back later for upcoming races and events.</p>
					</div>
				) : (
					<div className="space-y-8">
						{competitions.map((competition) => (
							<div key={competition.id} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
								{/* Competition Header */}
								<div className="p-6 border-b border-gray-700">
									<h2 className="text-2xl font-bold text-white mb-2">{competition.name}</h2>
									{competition.desc && (
										<p className="text-gray-300">{competition.desc}</p>
									)}
								</div>

								{/* Schedule/Tracks */}
								{competition.schedule && competition.schedule.length > 0 && (
									<div className="p-6">
										<h3 className="text-xl font-semibold text-white mb-4">Race Schedule</h3>
										<div className="space-y-4">
											{competition.schedule.map((track, index) => (
												<div key={track.id || index} className="bg-gray-700 rounded-lg p-4">
													<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
														<h4 className="text-lg font-medium text-white">{track.name}</h4>
														<div className="text-sm text-gray-300">
															{formatDate(track.datetime)}
														</div>
													</div>

													{/* Results */}
													{track.results && track.results.length > 0 && (
														<div className="mt-4">
															<h5 className="text-sm font-medium text-gray-300 mb-2">Results</h5>
															<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
																<div>
																	<h6 className="text-xs font-medium text-gray-400 mb-1">Qualifying</h6>
																	<div className="space-y-1">
																		{track.results
																			.sort((a, b) => a.quali_position - b.quali_position)
																			.slice(0, 3)
																			.map((result, idx) => (
																				<div key={idx} className="flex items-center space-x-2 text-sm">
																					<span className={`font-medium ${getPositionColor(result.quali_position)}`}>
																						P{result.quali_position}
																					</span>
																					<span className="text-gray-300">Driver {result.driver.slice(0, 8)}</span>
																				</div>
																			))}
																	</div>
																</div>
																<div>
																	<h6 className="text-xs font-medium text-gray-400 mb-1">Race</h6>
																	<div className="space-y-1">
																		{track.results
																			.sort((a, b) => a.race_position - b.race_position)
																			.slice(0, 3)
																			.map((result, idx) => (
																				<div key={idx} className="flex items-center space-x-2 text-sm">
																					<span className={`font-medium ${getPositionColor(result.race_position)}`}>
																						P{result.race_position}
																					</span>
																					<span className="text-gray-300">Driver {result.driver.slice(0, 8)}</span>
																				</div>
																			))}
																	</div>
																</div>
															</div>
														</div>
													)}

													{/* Status indicator */}
													<div className="mt-3">
														<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
															track.isActive 
																? 'bg-green-100 text-green-800' 
																: 'bg-gray-100 text-gray-800'
														}`}>
															{track.isActive ? 'Active' : 'Completed'}
														</span>
													</div>
												</div>
											))}
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

export default Competitions;