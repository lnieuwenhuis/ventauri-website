import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../Components/Navbar';

interface Competition {
	id: string;
	name: string;
	desc: string;
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
		});
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
							<span className="py-4 px-1 border-b-2 border-yellow-400 text-yellow-400 font-medium text-sm">
								Competitions
							</span>
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
					<h1 className="text-3xl font-bold text-white mb-2">Competitions</h1>
					<p className="text-gray-300">Browse our racing competitions and events</p>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				{competitions.length === 0 ? (
					<div className="text-center py-12">
						<div className="text-gray-400 text-lg mb-4">No competitions found</div>
						<p className="text-gray-500">Check back later for upcoming competitions and events.</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{competitions.map((competition) => (
							<Link
								key={competition.id}
								to={`/competitions/${competition.id}`}
								className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-yellow-400 hover:bg-gray-750 transition-all duration-200 group"
							>
								<div className="flex items-start justify-between mb-4">
									<h2 className="text-xl font-bold text-white group-hover:text-yellow-400 transition-colors">
										{competition.name}
									</h2>
									<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
										competition.isActive 
											? 'bg-green-100 text-green-800' 
											: 'bg-gray-100 text-gray-800'
									}`}>
										{competition.isActive ? 'Active' : 'Completed'}
									</span>
								</div>
								
								{competition.desc && (
									<p className="text-gray-300 mb-4 line-clamp-3">
										{competition.desc}
									</p>
								)}
								
								<div className="flex items-center justify-between text-sm text-gray-400">
									<span>Created: {formatDate(competition.createdAt)}</span>
									<svg 
										className="w-5 h-5 text-gray-400 group-hover:text-yellow-400 transition-colors" 
										fill="none" 
										stroke="currentColor" 
										viewBox="0 0 24 24"
									>
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
									</svg>
								</div>
							</Link>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default Competitions;