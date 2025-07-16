import React from 'react';

const Schedule: React.FC = () => {
	return (
		<div className="space-y-8">
			<div className="text-center">
				<h2 className="text-3xl font-bold text-white mb-4">Race Schedule</h2>
				<p className="text-gray-300 max-w-2xl mx-auto">
					Stay updated with our upcoming races and events in the Formula 1 Esports calendar.
				</p>
			</div>

			<div className="bg-gray-800 rounded-lg p-8">
				<div className="space-y-6">
					{[
						{ date: '2024-02-15', race: 'Australian Grand Prix', time: '19:00 UTC', status: 'upcoming' },
						{ date: '2024-02-22', race: 'Bahrain Grand Prix', time: '18:30 UTC', status: 'upcoming' },
						{ date: '2024-03-01', race: 'Saudi Arabian Grand Prix', time: '17:00 UTC', status: 'upcoming' },
						{ date: '2024-03-08', race: 'Japanese Grand Prix', time: '06:00 UTC', status: 'upcoming' },
						{ date: '2024-03-15', race: 'Chinese Grand Prix', time: '08:00 UTC', status: 'upcoming' },
					].map((event, index) => (
						<div key={index} className="flex flex-col md:flex-row md:justify-between md:items-center bg-gray-700 rounded-lg p-6">
							<div className="flex-1">
								<h3 className="text-lg font-semibold text-white mb-1">{event.race}</h3>
								<p className="text-gray-400">{new Date(event.date).toLocaleDateString('en-US', { 
									weekday: 'long', 
									year: 'numeric', 
									month: 'long', 
									day: 'numeric' 
								})}</p>
							</div>
							<div className="mt-4 md:mt-0 flex items-center space-x-4">
								<span className="text-yellow-400 font-medium">{event.time}</span>
								<span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-semibold capitalize">
									{event.status}
								</span>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default Schedule;