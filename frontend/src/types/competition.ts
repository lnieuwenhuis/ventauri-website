export interface TeamMember {
	id: string;
	firstName: string;
	lastName: string;
	role: {
		id: string;
		name: string;
	};
}

export interface Track {
	id: string;
	name: string;
	dateTime: string;
	status: 'past' | 'next' | 'future';
	personnel: string[];
	personnelData?: TeamMember[];
	results: {
		driver: string;
		quali_position: number;
		race_position: number;
	}[];
}

export interface Competition {
	id: string;
	name: string;
	desc: string;
	schedule: Track[];
	position: number;
	points: number;
	dateTime: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	[key: string]: unknown;
}

export interface CompetitionsResponse {
	data: Competition[];
	total: number;
	page: number;
	limit: number;
}

export interface CompetitionFormData extends Record<string, unknown> {
	id: string;
	name: string;
	desc: string;
	position: number;
	points: number;
	dateTime: string;
	isActive: boolean;
}

export interface TrackFormData extends Record<string, unknown> {
	id: string;
	name: string;
	dateTime: string;
	status: string;
	personnel: string[];
}

export interface ResultFormData extends Record<string, unknown> {
	driver: string;
	quali_position: number;
	race_position: number;
}