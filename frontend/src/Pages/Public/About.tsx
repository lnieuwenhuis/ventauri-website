import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../Components/Navbar';
import TeamMembers from './TeamMembers';
import usePageTitle from '../../hooks/usePageTitle';

const About: React.FC = () => {
	usePageTitle('About');
	const [activeTab] = useState('team-members');

	const renderContent = () => {
		switch (activeTab) {
			case 'team-members':
				return <TeamMembers />;
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
						<span className="py-4 px-1 border-b-2 border-ventauri text-ventauri font-medium text-sm">
							Team Members
						</span>
						<Link
							to="/competitions"
							className="py-4 px-1 border-b-2 border-transparent text-gray-300 hover:text-ventauri hover:border-gray-600 font-medium text-sm transition-colors"
						>
							Competitions
						</Link>
						<Link
							to="/contact"
							className="py-4 px-1 border-b-2 border-transparent text-gray-300 hover:text-ventauri hover:border-gray-600 font-medium text-sm transition-colors"
						>
							Contact
						</Link>
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
