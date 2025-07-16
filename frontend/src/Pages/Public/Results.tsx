import React from 'react';

const Results: React.FC = () => {
	return (
		<div className="space-y-8">
			<div className="text-center">
				<h2 className="text-3xl font-bold text-white mb-4">Our Results</h2>
				<p className="text-gray-300 max-w-2xl mx-auto">
					Track our performance and achievements in Formula 1 Esports competitions.
				</p>
			</div>

			<div className="bg-gray-800 rounded-lg p-8">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
					<div>
						<h3 className="text-4xl font-bold text-yellow-400 mb-2">15</h3>
						<p className="text-gray-300">Races Completed</p>
					</div>
					<div>
						<h3 className="text-4xl font-bold text-yellow-400 mb-2">3</h3>
						<p className="text-gray-300">Podium Finishes</p>
					</div>
					<div>
						<h3 className="text-4xl font-bold text-yellow-400 mb-2">1</h3>
						<p className="text-gray-300">Championship Win</p>
					</div>
				</div>

				<div className="mt-12">
					<h3 className="text-xl font-semibold text-white mb-6">Recent Results</h3>
					<div className="space-y-4">
						{[
							{ race: 'Monaco Grand Prix', position: '2nd', points: '18' },
							{ race: 'Spanish Grand Prix', position: '5th', points: '10' },
							{ race: 'Miami Grand Prix', position: '1st', points: '25' },
							{ race: 'Emilia Romagna GP', position: '3rd', points: '15' },
						].map((result, index) => (
							<div key={index} className="flex justify-between items-center bg-gray-700 rounded-lg p-4">
								<span className="text-white font-medium">{result.race}</span>
								<div className="flex space-x-4">
									<span className="text-yellow-400 font-semibold">{result.position}</span>
									<span className="text-gray-300">{result.points} pts</span>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Results;