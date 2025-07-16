import React, { useState } from 'react';
import Navbar from '../../Components/Navbar';
import TeamMembers from './TeamMembers';
import Results from './Results';
import Schedule from './Schedule';
import Contact from './Contact';

const About: React.FC = () => {
	const [activeTab, setActiveTab] = useState('team-members');

	const renderContent = () => {
		switch (activeTab) {
			case 'team-members':
				return <TeamMembers />;
			case 'results':
				return <Results />;
			case 'schedule':
				return <Schedule />;
			case 'contact':
				return <Contact />;
			default:
				return <TeamMembers />;
		}
	};

	return (
		<div className="min-h-screen bg-gray-900">
			<Navbar />
			
			{/* Sub Navigation */}
			<div className="bg-gray-800 border-b border-gray-700">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex space-x-8">
						{[
							{ id: 'team-members', label: 'Team Members' },
							{ id: 'results', label: 'Results' },
							{ id: 'schedule', label: 'Schedule' },
							{ id: 'contact', label: 'Contact' },
						].map((tab) => (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
									activeTab === tab.id
										? 'border-yellow-400 text-yellow-400'
										: 'border-transparent text-gray-300 hover:text-yellow-400 hover:border-gray-600'
								}`}
							>
								{tab.label}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				{renderContent()}
			</div>
		</div>
	);
};

export default About;