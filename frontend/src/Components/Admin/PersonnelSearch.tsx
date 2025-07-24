import React, { useState, useEffect, useRef } from 'react';

interface TeamMember {
	id: string;
	firstName: string;
	lastName: string;
	role: {
		id: string;
		name: string;
	};
}

interface PersonnelSearchProps {
	selectedPersonnel: string[];
	onChange: (personnel: string[]) => void;
	error?: string | null; 
}

const PersonnelSearch: React.FC<PersonnelSearchProps> = ({
	selectedPersonnel,
	onChange,
	error
}) => {
	const [searchTerm, setSearchTerm] = useState('');
	const [searchResults, setSearchResults] = useState<TeamMember[]>([]);
	const [selectedMembers, setSelectedMembers] = useState<TeamMember[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [showDropdown, setShowDropdown] = useState(false);
	const debounceRef = useRef<number | null>(null);
	const apiURL = import.meta.env.VITE_BACKEND_URL || '';

	// Fetch team member details for selected personnel
	useEffect(() => {
		const fetchSelectedMembers = async () => {
			if (selectedPersonnel.length === 0) {
				setSelectedMembers([]);
				return;
			}

			try {
				const response = await fetch(
					`${apiURL}/api/team-members/?limit=100&sort=name`,
					{
						credentials: 'include',
						headers: {
							'Content-Type': 'application/json',
						},
					}
				);

				if (response.ok) {
					const result = await response.json();
					const members = result.data.filter((member: TeamMember) =>
						selectedPersonnel.includes(member.id)
					);
					setSelectedMembers(members);
				}
			} catch (error) {
				console.error('Error fetching selected members:', error);
			}
		};

		fetchSelectedMembers();
	}, [selectedPersonnel, apiURL]);

	// Debounced search function
	useEffect(() => {
		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
		}

		if (searchTerm.trim() === '') {
			setSearchResults([]);
			setShowDropdown(false);
			return;
		}

		debounceRef.current = setTimeout(async () => {
			try {
				setIsLoading(true);
				const response = await fetch(
					`${apiURL}/api/team-members/?search=${encodeURIComponent(searchTerm)}&limit=20&sort=name`,
					{
						credentials: 'include',
						headers: {
							'Content-Type': 'application/json',
						},
					}
				);

				if (response.ok) {
					const result = await response.json();
					// Filter out already selected members
					const filteredResults = result.data.filter(
						(member: TeamMember) => !selectedPersonnel.includes(member.id)
					);
					setSearchResults(filteredResults);
					setShowDropdown(true);
				}
			} catch (error) {
				console.error('Error searching team members:', error);
			} finally {
				setIsLoading(false);
			}
		}, 300) as number; // Fixed: Cast setTimeout return value to number

		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, [searchTerm, selectedPersonnel, apiURL]);

	const handleAddMember = (member: TeamMember) => {
		const newPersonnel = [...selectedPersonnel, member.id];
		onChange(newPersonnel);
		setSearchTerm('');
		setShowDropdown(false);
	};

	const handleRemoveMember = (memberId: string) => {
		const newPersonnel = selectedPersonnel.filter(id => id !== memberId);
		onChange(newPersonnel);
	};

	const getDisplayName = (member: TeamMember) => {
		return `${member.firstName} ${member.lastName} (${member.role.name})`;
	};

	return (
		<div className="space-y-3">
			{/* Selected Personnel */}
			{selectedMembers.length > 0 && (
				<div className="space-y-2">
					<label className="block text-sm font-medium text-gray-700">
						Selected Personnel
					</label>
					{selectedMembers.map((member) => (
						<div key={member.id} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
							<span className="text-sm text-blue-800">
								{getDisplayName(member)}
							</span>
							<button
								type="button"
								onClick={() => handleRemoveMember(member.id)}
								className="text-blue-600 hover:text-blue-800 font-medium"
							>
								×
							</button>
						</div>
					))}
				</div>
			)}

			{/* Search Input */}
			<div className="relative">
				<input
					type="text"
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					placeholder="Search team members by name..."
					className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
						error ? 'border-red-300' : 'border-gray-300'
					}`}
				/>
				{isLoading && (
					<div className="absolute right-3 top-9 transform -translate-y-1/2">
						<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
					</div>
				)}

				{/* Search Results Dropdown */}
				{showDropdown && searchResults.length > 0 && (
					<div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
						{searchResults.map((member) => (
							<button
								key={member.id}
								type="button"
								onClick={() => handleAddMember(member)}
								className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-100 last:border-b-0"
							>
								<div className="text-sm font-medium text-gray-900">
									{member.firstName} {member.lastName}
								</div>
								<div className="text-xs text-gray-500">
									{member.role.name}
								</div>
							</button>
						))}
					</div>
				)}

				{/* No Results Message */}
				{showDropdown && searchResults.length === 0 && searchTerm.trim() !== '' && !isLoading && (
					<div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
						<div className="text-sm text-gray-500 text-center">
							No team members found matching "{searchTerm}"
						</div>
					</div>
				)}
			</div>

			{error && (
				<p className="text-red-500 text-xs mt-1">{error}</p>
			)}
		</div>
	);
};

export default PersonnelSearch;