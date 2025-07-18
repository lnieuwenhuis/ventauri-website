import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '../../Components/Navbar';
import TeamMembers from './TeamMembers';
import Contact from './Contact';

const About: React.FC = () => {
	const [activeTab, setActiveTab] = useState('team-members');
	const location = useLocation();

	const renderContent = () => {
		switch (activeTab) {
			case 'team-members':
				return <TeamMembers />;
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
							{ id: 'team-members', label: 'Team Members', type: 'tab' },
							{ id: 'competitions', label: 'Competitions', type: 'link', path: '/competitions' },
							{ id: 'contact', label: 'Contact', type: 'tab' },
						].map((item) => (
							item.type === 'link' ? (
								<Link
									key={item.id}
									to={item.path!}
									className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
										location.pathname === item.path
											? 'border-yellow-400 text-yellow-400'
											: 'border-transparent text-gray-300 hover:text-yellow-400 hover:border-gray-600'
									}`}
								>
									{item.label}
								</Link>
							) : (
								<button
									key={item.id}
									onClick={() => setActiveTab(item.id)}
									className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
										activeTab === item.id
											? 'border-yellow-400 text-yellow-400'
											: 'border-transparent text-gray-300 hover:text-yellow-400 hover:border-gray-600'
									}`}
								>
									{item.label}
								</button>
							)
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