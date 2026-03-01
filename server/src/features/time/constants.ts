export type MetaBucket = 'Vitality' | 'Productivity' | 'Obligations' | 'Connection' | 'Enrichment' | 'Logistics'

export type TimeCategory = {
	id: number
	name: string
	metaBucket: MetaBucket
	description: string
}

export const META_BUCKETS: MetaBucket[] = [
	'Vitality',
	'Productivity',
	'Obligations',
	'Connection',
	'Enrichment',
	'Logistics'
]

export const TIME_CATEGORIES: TimeCategory[] = [
	{ id: 1, name: 'Sleep & Self-Care', metaBucket: 'Vitality', description: 'Sleeping, grooming, showering, hygiene, and medical self-care.' },
	{ id: 2, name: 'Eating & Drinking', metaBucket: 'Vitality', description: 'Meals, snacks, coffee breaks, and functional dining.' },
	{ id: 3, name: 'Paid Work', metaBucket: 'Productivity', description: 'Main job, side hustles, work meetings, and work-related travel.' },
	{ id: 4, name: 'Education', metaBucket: 'Productivity', description: 'Attending classes, homework, research, and self-taught skill building.' },
	{ id: 5, name: 'Home Maintenance', metaBucket: 'Obligations', description: 'Cleaning, laundry, home repairs, gardening, and pet care.' },
	{ id: 6, name: 'Family Care', metaBucket: 'Obligations', description: 'Physical care for children, helping with homework, and elder care in-home.' },
	{ id: 7, name: 'Community Care', metaBucket: 'Obligations', description: 'Helping neighbors, friends, or relatives living in other households.' },
	{ id: 8, name: 'Errands & Shopping', metaBucket: 'Obligations', description: 'Grocery shopping, errands, banking, and professional appointments.' },
	{ id: 9, name: 'Socializing', metaBucket: 'Connection', description: 'Face-to-face time with friends, phone calls, and attending social events.' },
	{ id: 10, name: 'Fitness & Hobbies', metaBucket: 'Enrichment', description: 'Gym, sports, reading for pleasure, gaming, and active hobbies.' },
	{ id: 11, name: 'Spirit & Civic', metaBucket: 'Enrichment', description: 'Meditation, religious services, prayer, and voting/civic engagement.' },
	{ id: 12, name: 'Volunteering', metaBucket: 'Connection', description: 'Unpaid work for organizations, food banks, or community service.' },
	{ id: 13, name: 'Commuting', metaBucket: 'Logistics', description: 'Driving, public transit time, and travel for errands/work.' },
	{ id: 14, name: 'Digital Leisure', metaBucket: 'Enrichment', description: 'Browsing the web, non-social app usage, and entertainment screen time.' },
	{ id: 15, name: 'Buffer / Misc', metaBucket: 'Logistics', description: 'Uncategorized gaps, transition time, and miscellaneous tasks.' }
]

export const VALID_CATEGORY_IDS = TIME_CATEGORIES.map((c) => c.id)
