import React, { useState, useEffect } from 'react';

interface TeamMember {
	id: string;
	firstName: string;
	lastName: string;
	bio: string;
	role: {
		id: string;
		name: string;
		description: string;
	};
	nationality: string;
	picture: string;
	createdAt: string;
	updatedAt: string;
}

interface TeamMembersResponse {
	data: TeamMember[];
	total: number;
	page: number;
	limit: number;
}

const TeamMembers: React.FC = () => {
	const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
	const [loading, setLoading] = useState(true);
	const apiURL = import.meta.env.VITE_BACKEND_URL || '';

	useEffect(() => {
		fetchTeamMembers();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const fetchTeamMembers = async () => {
		try {
			setLoading(true);
			const response = await fetch(`${apiURL}/api/team-members/?limit=50&sort=latest_updated`);
			if (response.ok) {
				const result: TeamMembersResponse = await response.json();
				setTeamMembers(result.data);
			}
		} catch (error) {
			console.error('Error fetching team members:', error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-8">
			<div className="text-center">
				<h2 className="text-3xl font-bold text-white mb-4">Meet Our Team</h2>
				<p className="text-gray-300 max-w-2xl mx-auto">
					Our dedicated team of professionals working together to achieve excellence in Formula 1 Esports.
				</p>
			</div>

			{loading ? (
				<div className="flex justify-center py-12">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{teamMembers.map((member) => (
						<div key={member.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
							{member.picture && (
								<img
									src={member.picture}
									alt={`${member.firstName} ${member.lastName}`}
									className="w-full h-64 object-cover"
								/>
							)}
							<div className="p-6">
								<h3 className="text-xl font-semibold text-white mb-2">
									{member.firstName} {member.lastName}
								</h3>
								<p className="text-yellow-400 font-medium mb-2 capitalize">{member.role.name}</p>
								<p className="text-gray-400 text-sm mb-3">{member.nationality}</p>
								<p className="text-gray-300 text-sm leading-relaxed">{member.bio}</p>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default TeamMembers;