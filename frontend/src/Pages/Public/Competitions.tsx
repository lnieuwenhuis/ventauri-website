import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../Components/Navbar';
import usePageTitle from '../../hooks/usePageTitle';

interface Competition {
	id: string;
	name: string;
	desc: string;
	isActive: boolean;
	position?: number;
	points?: number;
	createdAt: string;
	updatedAt: string;
}

const Competitions: React.FC = () => {
	const [competitions, setCompetitions] = useState<Competition[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const apiURL = import.meta.env.VITE_BACKEND_URL || '';
	usePageTitle('Competitions');

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

	const getPositionColor = (position: number) => {
		if (position === 1) return 'text-ventauri';
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
								className="py-4 px-1 border-b-2 border-transparent text-gray-300 hover:text-ventauri hover:border-gray-600 font-medium text-sm transition-colors"
							>
								Team Members
							</Link>
							<span className="py-4 px-1 border-b-2 border-ventauri text-ventauri font-medium text-sm">
								Competitions
							</span>
							<Link
								to="/contact"
								className="py-4 px-1 border-b-2 border-transparent text-gray-300 hover:text-ventauri hover:border-gray-600 font-medium text-sm transition-colors"
							>
								Contact
							</Link>
						</div>
					</div>
				</div>
				<div className="flex items-center justify-center min-h-[60vh]">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ventauri"></div>
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
								className="py-4 px-1 border-b-2 border-transparent text-gray-300 hover:text-ventauri hover:border-gray-600 font-medium text-sm transition-colors"
							>
								Team Members
							</Link>
							<span className="py-4 px-1 border-b-2 border-ventauri text-ventauri font-medium text-sm">
								Competitions
							</span>
							<Link
								to="/contact"
								className="py-4 px-1 border-b-2 border-transparent text-gray-300 hover:text-ventauri hover:border-gray-600 font-medium text-sm transition-colors"
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
							className="bg-ventauri text-black px-6 py-2 rounded-lg hover:bg-yellow-500 transition-colors"
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
							className="py-4 px-1 border-b-2 border-transparent text-gray-300 hover:text-ventauri hover:border-gray-600 font-medium text-sm transition-colors"
						>
							Team Members
						</Link>
						<span className="py-4 px-1 border-b-2 border-ventauri text-ventauri font-medium text-sm">
							Competitions
						</span>
						<Link
							to="/contact"
							className="py-4 px-1 border-b-2 border-transparent text-gray-300 hover:text-ventauri hover:border-gray-600 font-medium text-sm transition-colors"
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
					<p className="text-gray-300">Browse our racing competitions and events</p>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				{competitions.length === 0 ? (
					<div className="text-center py-12">
						<div className="text-gray-400 text-lg mb-4">No competitions found</div>
						<p className="text-gray-500">
							Check back later for upcoming competitions and events.
						</p>
					</div>
				) : (
					<div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
						{/* Table Header */}
						<div className="bg-gradient-to-r from-gray-700 to-gray-600 px-8 py-5 border-b border-gray-600">
							<div className="grid grid-cols-12 gap-6 text-sm font-semibold text-gray-200 uppercase tracking-wide">
								<div className="col-span-5">Competition</div>
								<div className="col-span-4">Description</div>
								<div className="col-span-1 text-center">Position</div>
								<div className="col-span-2 text-right">Points</div>
							</div>
						</div>

						{/* Competition List */}
						<div className="divide-y divide-gray-700">
							{competitions.map((competition, index) => (
								<Link
									key={competition.id}
									to={`/competitions/${competition.id}`}
									className={`block px-8 py-6 hover:bg-gray-750 transition-all duration-200 group ${
										index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-825'
									}`}
								>
									<div className="grid grid-cols-12 gap-6 items-center">
										{/* Competition Name */}
										<div className="col-span-5">
											<h3 className="text-lg font-semibold text-white group-hover:text-ventauri transition-colors mb-1">
												{competition.name}
											</h3>
											<div className="flex items-center space-x-2">
												<span
													className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
														competition.isActive
															? 'bg-green-900 text-green-300 border border-green-700'
															: 'bg-gray-700 text-gray-400 border border-gray-600'
													}`}
												>
													<div
														className={`w-2 h-2 rounded-full mr-1.5 ${
															competition.isActive ? 'bg-green-400' : 'bg-gray-500'
														}`}
													></div>
													{competition.isActive ? 'Running' : 'Finished'}
												</span>
											</div>
										</div>

										{/* Description */}
										<div className="col-span-4">
											{competition.desc ? (
												<p className="text-gray-300 text-sm leading-relaxed line-clamp-2">
													{competition.desc}
												</p>
											) : (
												<span className="text-gray-500 text-sm italic">
													No description available
												</span>
											)}
										</div>

										{/* Position */}
										<div className="col-span-1 text-center">
											{competition.position ? (
												<div className="inline-flex items-center justify-center">
													<span
														className={`font-bold text-xl ${getPositionColor(competition.position)} bg-gray-900 px-3 py-1.5 rounded-lg border-2 ${
															competition.position === 1
																? 'border-ventauri'
																: competition.position === 2
																	? 'border-gray-300'
																	: competition.position === 3
																		? 'border-orange-400'
																		: 'border-gray-600'
														}`}
													>
														P{competition.position}
													</span>
												</div>
											) : (
												<span className="text-gray-500 text-lg">-</span>
											)}
										</div>

										{/* Points */}
										<div className="col-span-2 text-right">
											{competition.points !== undefined ? (
												<div className="inline-flex flex-col items-end bg-gray-900 px-4 py-2 rounded-lg border border-gray-600">
													<span className="text-2xl font-bold text-ventauri">
														{competition.points}
													</span>
													<span className="text-xs text-gray-400 uppercase tracking-wide">
														points
													</span>
												</div>
											) : (
												<span className="text-gray-500 text-lg">-</span>
											)}
										</div>
									</div>
								</Link>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default Competitions;
