import React, { useState, useEffect } from 'react';
import FormModal from '../../Components/Admin/FormModal';
import ViewModal from '../../Components/Admin/ViewModal';

interface TeamMember {
	id: string;
	firstName: string;
	lastName: string;
	bio: string;
	role: TeamRole;
	nationality: string;
	picture: string;
	createdAt: string;
	updatedAt: string;
	deletedAt?: string | null;
	[key: string]: unknown;
}

interface TeamRole {
	id: string;
	name: string;
	description: string;
	createdAt: string;
	updatedAt: string;
}

interface TeamMembersResponse {
	data: TeamMember[];
	total: number;
	page: number;
	limit: number;
}

interface TeamRolesResponse {
	data: TeamRole[];
	total: number;
	page: number;
	limit: number;
}

interface TeamMemberFormData extends Record<string, unknown> {
	id: string;
	firstName: string;
	lastName: string;
	bio: string;
	role?: string;
    roleId?: string;
	nationality: string;
	picture: string;
}

const AdminTeamMembers: React.FC = () => {
	const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [roleFilter, setRoleFilter] = useState('');
	const [nationalityFilter, setNationalityFilter] = useState('');
	const [sortBy, setSortBy] = useState('latest_updated');
	const [currentPage, setCurrentPage] = useState(1);
	const [totalTeamMembers, setTotalTeamMembers] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
	const [selectedTeamMember, setSelectedTeamMember] = useState<TeamMember | null>(null);
	const [isViewModalOpen, setIsViewModalOpen] = useState(false);
	
	// Role management state
	const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
	const [roles, setRoles] = useState<TeamRole[]>([]);
	const [editingRole, setEditingRole] = useState<TeamRole | null>(null);
	const [newRole, setNewRole] = useState({ name: '', description: '' });
	const [roleLoading, setRoleLoading] = useState(false);
	
	const itemsPerPage = 10;
	const apiURL = import.meta.env.VITE_BACKEND_URL || '';

	const teamMemberFields = [
		{
			name: 'firstName' as keyof TeamMemberFormData,
			label: 'First Name',
			type: 'text' as const,
			required: true,
			placeholder: 'Enter first name',
		},
		{
			name: 'lastName' as keyof TeamMemberFormData,
			label: 'Last Name',
			type: 'text' as const,
			required: true,
			placeholder: 'Enter last name',
		},
		{
			name: 'bio' as keyof TeamMemberFormData,
			label: 'Bio',
			type: 'textarea' as const,
			required: true,
			placeholder: 'Enter team member bio',
		},
		{
			name: 'role' as keyof TeamMemberFormData,
			label: 'Role',
			type: 'select' as const,
			required: true,
			options: roles.map(role => ({
				value: role.id,
				label: role.name
			})),
		},
		{
			name: 'nationality' as keyof TeamMemberFormData,
			label: 'Nationality',
			type: 'text' as const,
			required: true,
			placeholder: 'Enter nationality',
		},
		{
			name: 'picture' as keyof TeamMemberFormData,
			label: 'Picture URL',
			type: 'url' as const,
			required: false,
			placeholder: 'Enter picture URL',
		},
	];

	const viewFields = [
		{ name: 'firstName', label: 'First Name' },
		{ name: 'lastName', label: 'Last Name' },
		{ name: 'bio', label: 'Bio' },
		{ name: 'role', label: 'Role' },
		{ name: 'nationality', label: 'Nationality' },
		{ name: 'picture', label: 'Picture URL' },
		{ name: 'createdAt', label: 'Created At' },
		{ name: 'updatedAt', label: 'Updated At' },
	];

	const fetchTeamMembers = async (
		page: number = 1,
		search: string = '',
		role: string = '',
		nationality: string = '',
		sort: string = 'latest_updated'
	) => {
		try {
			setLoading(true);
			setError(null);

			const params = new URLSearchParams({
				page: page.toString(),
				limit: itemsPerPage.toString(),
				sort: sort,
				...(search && { search }),
				...(role && { role }),
				...(nationality && { nationality }),
			});

			const response = await fetch(`${apiURL}/api/admin/team-members/?${params}`, {
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch team members: ${response.status}`);
			}

			const result: TeamMembersResponse = await response.json();
			setTeamMembers(result.data);
			setTotalTeamMembers(result.total);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
			console.error('Error fetching team members:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchTeamMembers(currentPage, searchTerm, roleFilter, nationalityFilter, sortBy);
		// eslint-disable-next-line
	}, [currentPage, searchTerm, roleFilter, nationalityFilter, sortBy]);

	const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value);
		setCurrentPage(1);
	};

	const handleRoleFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setRoleFilter(e.target.value);
		setCurrentPage(1);
	};

	const handleNationalityFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
		setNationalityFilter(e.target.value);
		setCurrentPage(1);
	};

	const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setSortBy(e.target.value);
		setCurrentPage(1);
	};

	const handleCreateTeamMember = () => {
		setEditingTeamMember(null);
		setIsModalOpen(true);
	};

	const handleEditTeamMember = (teamMember: TeamMember) => {
		setEditingTeamMember(teamMember);
		setIsModalOpen(true);
	};

	const handleViewTeamMember = (teamMember: TeamMember) => {
		setSelectedTeamMember(teamMember);
		setIsViewModalOpen(true);
	};

	const handleSubmitTeamMember = async (formData: TeamMemberFormData) => {
		try {
			const url = editingTeamMember
				? `${apiURL}/api/admin/team-members/${editingTeamMember.id}`
				: `${apiURL}/api/admin/team-members`;

			const method = editingTeamMember ? 'PUT' : 'POST';

			const submitData = {
				...formData,
				roleId: formData.role, 
			};
			delete submitData.role;

			const response = await fetch(url, {
				method,
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(submitData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.error || `Failed to ${editingTeamMember ? 'update' : 'create'} team member`
				);
			}

			setIsModalOpen(false);
			setEditingTeamMember(null);
			fetchTeamMembers(currentPage, searchTerm, roleFilter, nationalityFilter, sortBy);
		} catch (err) {
			console.error('Error submitting team member:', err);
			setError(
				err instanceof Error
					? err.message
					: `Failed to ${editingTeamMember ? 'update' : 'create'} team member`
			);
		}
	};

	const convertTeamMemberToFormData = (teamMember: TeamMember): TeamMemberFormData => {
		return {
			id: teamMember.id,
			firstName: teamMember.firstName,
			lastName: teamMember.lastName,
			bio: teamMember.bio,
			role: teamMember.role.id, // Use role ID instead of role name
			nationality: teamMember.nationality,
			picture: teamMember.picture || '',
		};
	};

	const deleteTeamMember = async (teamMemberId: string) => {
		if (!confirm('Are you sure you want to delete this team member?')) {
			return;
		}

		try {
			const response = await fetch(`${apiURL}/api/admin/team-members/${teamMemberId}`, {
				method: 'DELETE',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error('Failed to delete team member');
			}

			fetchTeamMembers(currentPage, searchTerm, roleFilter, nationalityFilter, sortBy);
		} catch (err) {
			console.error('Error deleting team member:', err);
			setError(err instanceof Error ? err.message : 'Failed to delete team member');
		}
	};

	const totalPages = Math.ceil(totalTeamMembers / itemsPerPage);

    useEffect(() => {
		fetchRoles();
    // eslint-disable-next-line
	}, []);

    const fetchRoles = async () => {
        try {
            setRoleLoading(true);
            const response = await fetch(`${apiURL}/api/admin/team-roles/?limit=100`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch roles');
            }

            const result: TeamRolesResponse = await response.json();
            setRoles(result.data);
        } catch (err) {
            console.error('Error fetching roles:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch roles');
        } finally {
            setRoleLoading(false);
        }
    };

    const handleCreateRole = async () => {
        if (!newRole.name.trim()) {
            setError('Role name is required');
            return;
        }

        try {
            const response = await fetch(`${apiURL}/api/admin/team-roles/`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newRole),
            });

            if (!response.ok) {
                throw new Error('Failed to create role');
            }

            setNewRole({ name: '', description: '' });
            fetchRoles();
        } catch (err) {
            console.error('Error creating role:', err);
            setError(err instanceof Error ? err.message : 'Failed to create role');
        }
    };

    const handleUpdateRole = async (role: TeamRole) => {
        try {
            const response = await fetch(`${apiURL}/api/admin/team-roles/${role.id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: role.name, description: role.description }),
            });

            if (!response.ok) {
                throw new Error('Failed to update role');
            }

            setEditingRole(null);
            fetchRoles();
        } catch (err) {
            console.error('Error updating role:', err);
            setError(err instanceof Error ? err.message : 'Failed to update role');
        }
    };

    const handleDeleteRole = async (roleId: string) => {
        if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`${apiURL}/api/admin/team-roles/${roleId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete role');
            }

            fetchRoles();
        } catch (err) {
            console.error('Error deleting role:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete role');
        }
    };

    const openRoleModal = () => {
        setIsRoleModalOpen(true);
        fetchRoles();
    };

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold text-gray-900">Team Members Management</h1>
				<div className="flex space-x-3">
					<button
						onClick={openRoleModal}
						className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
					>
						Change Roles
					</button>
					<button
						onClick={handleCreateTeamMember}
						className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
					>
						Add New Team Member
					</button>
				</div>
			</div>

			{error && (
				<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
					{error}
				</div>
			)}

			<div className="bg-white rounded-lg shadow-sm border border-gray-200">
				<div className="p-6 border-b border-gray-200">
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="flex-1">
							<input
								type="text"
								placeholder="Search team members by name or bio..."
								value={searchTerm}
								onChange={handleSearch}
								className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>
						<div className="flex gap-2">
							<select
								value={roleFilter}
								onChange={handleRoleFilter}
								className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							>
								<option value="">All Roles</option>
								{roles.map(role => (
									<option key={role.id} value={role.name.toLowerCase()}>{role.name}</option>
								))}
							</select>
							<input
								type="text"
								placeholder="Filter by nationality"
								value={nationalityFilter}
								onChange={handleNationalityFilter}
								className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
							<select
								value={sortBy}
								onChange={handleSortChange}
								className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							>
								<option value="name">Sort by Name</option>
								<option value="role">Sort by Role</option>
								<option value="nationality">Sort by Nationality</option>
								<option value="newest">Newest First</option>
								<option value="oldest">Oldest First</option>
    							<option value="latest_updated">Latest Updated</option>
							</select>
						</div>
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Team Member
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Role
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Nationality
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Bio
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Created
								</th>
								<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{loading ? (
								<tr>
									<td colSpan={6} className="px-6 py-12">
										<div className="flex items-center justify-center">
											<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
											<span className="ml-3 text-gray-500">Loading team members...</span>
										</div>
									</td>
								</tr>
							) : teamMembers.length === 0 ? (
								<tr>
									<td colSpan={6} className="px-6 py-12 text-center text-gray-500">
										No team members found
									</td>
								</tr>
							) : (
								teamMembers.map((teamMember) => (
									<tr key={teamMember.id} className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="flex items-center">
												<div className="flex-shrink-0 h-10 w-10">
													{teamMember.picture ? (
														<img
															className="h-10 w-10 rounded-full object-cover"
															src={teamMember.picture}
															alt={'NP'}
														/>
													) : (
														<div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
															<span className="text-sm font-medium text-gray-700">
																{teamMember.firstName.charAt(0)}
																{teamMember.lastName.charAt(0)}
															</span>
														</div>
													)}
												</div>
												<div className="ml-4">
													<div className="text-sm font-medium text-gray-900">
														{teamMember.firstName} {teamMember.lastName}
													</div>
													<div className="text-sm text-gray-500">
														ID: {teamMember.id.substring(0, 8)}
													</div>
												</div>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
												{teamMember.role.name.charAt(0).toUpperCase() + teamMember.role.name.slice(1)}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{teamMember.nationality}
										</td>
										<td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
											{teamMember.bio}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{new Date(teamMember.createdAt).toLocaleDateString()}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
											<div className="flex items-center justify-end space-x-2">
												<button
													onClick={() => handleViewTeamMember(teamMember)}
													className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
												>
													<svg
														className="w-3 h-3 mr-1"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
														/>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
														/>
													</svg>
													View
												</button>
												<button
													onClick={() => handleEditTeamMember(teamMember)}
													className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
												>
													<svg
														className="w-3 h-3 mr-1"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
														/>
													</svg>
													Edit
												</button>
												<button
													onClick={() => deleteTeamMember(teamMember.id)}
													className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
												>
													<svg
														className="w-3 h-3 mr-1"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
														/>
													</svg>
													Delete
												</button>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{totalPages > 1 && (
					<div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
						<div className="text-sm text-gray-500">
							Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
							{Math.min(currentPage * itemsPerPage, totalTeamMembers)} of {totalTeamMembers} team members
						</div>
						<div className="flex space-x-2">
							<button
								onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
								disabled={currentPage === 1}
								className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
							>
								Previous
							</button>
							<span className="px-3 py-1 text-sm">
								Page {currentPage} of {totalPages}
							</span>
							<button
								onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
								disabled={currentPage === totalPages}
								className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
							>
								Next
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Role Management Modal */}
			{isRoleModalOpen && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
						<div className="flex justify-between items-center mb-6">
							<h2 className="text-2xl font-bold text-gray-900">Manage Team Roles</h2>
							<button
								onClick={() => {
									setIsRoleModalOpen(false);
									setEditingRole(null);
									setNewRole({ name: '', description: '' });
									setError(null);
								}}
								className="text-gray-400 hover:text-gray-600"
							>
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>

						{error && (
							<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
								{error}
							</div>
						)}

						{/* Add New Role Form */}
						<div className="bg-gray-50 p-4 rounded-lg mb-6">
							<h3 className="text-lg font-semibold mb-4">Add New Role</h3>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<input
									type="text"
									placeholder="Role name"
									value={newRole.name}
									onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
									className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
								<input
									type="text"
									placeholder="Role description"
									value={newRole.description}
									onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
									className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
								<button
									onClick={handleCreateRole}
									className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
								>
									Add Role
								</button>
							</div>
						</div>

						{/* Roles List */}
						<div className="space-y-4">
							<h3 className="text-lg font-semibold">Existing Roles</h3>
							{roleLoading ? (
								<div className="flex items-center justify-center py-8">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
									<span className="ml-3 text-gray-500">Loading roles...</span>
								</div>
							) : roles.length === 0 ? (
								<p className="text-gray-500 text-center py-8">No roles found</p>
							) : (
								<div className="grid gap-4">
									{roles.map((role) => (
										<div key={role.id} className="border border-gray-200 rounded-lg p-4">
											{editingRole?.id === role.id ? (
												<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
													<input
														type="text"
														value={editingRole.name}
														onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
														className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
													/>
													<input
														type="text"
														value={editingRole.description}
														onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
														className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
													/>
													<div className="flex space-x-2">
														<button
															onClick={() => handleUpdateRole(editingRole)}
															className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
														>
															Save
														</button>
														<button
															onClick={() => setEditingRole(null)}
															className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors"
														>
															Cancel
														</button>
													</div>
												</div>
											) : (
												<div className="flex justify-between items-center">
													<div>
														<h4 className="font-semibold text-gray-900">{role.name}</h4>
														<p className="text-gray-600 text-sm">{role.description}</p>
														<p className="text-gray-400 text-xs mt-1">
															Created: {new Date(role.createdAt).toLocaleDateString()}
														</p>
													</div>
													<div className="flex space-x-2">
														<button
															onClick={() => setEditingRole(role)}
															className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
														>
															Edit
														</button>
														<button
															onClick={() => handleDeleteRole(role.id)}
															className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
														>
															Delete
														</button>
													</div>
												</div>
											)}
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Create/Edit Modal */}
			<FormModal<TeamMemberFormData>
				isOpen={isModalOpen}
				onClose={() => {
					setIsModalOpen(false);
					setEditingTeamMember(null);
				}}
				onSubmit={handleSubmitTeamMember}
				title={editingTeamMember ? 'Edit Team Member' : 'Create New Team Member'}
				fields={teamMemberFields}
				initialData={
					editingTeamMember
						? convertTeamMemberToFormData(editingTeamMember)
						: {
								firstName: '',
								lastName: '',
								bio: '',
								role: roles.length > 0 ? roles[0].id : '', // Default to first role ID
								nationality: '',
								picture: '',
							}
				}
			/>

			{/* View Modal */}
			<ViewModal<TeamMember>
				fields={viewFields}
				data={selectedTeamMember || {}}
				isOpen={isViewModalOpen}
				onClose={() => setIsViewModalOpen(false)}
				linkedSubjects={[]}
			/>
		</div>
	);
};

export default AdminTeamMembers;