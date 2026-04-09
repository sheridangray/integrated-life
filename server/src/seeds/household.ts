import { MaintenanceTemplate } from '../models/MaintenanceTemplate'
import { logger } from '../lib/logger'

type TemplateSeed = {
	title: string
	description: string
	frequency: 'monthly' | 'quarterly' | 'biannual' | 'annual'
	category: 'hvac' | 'appliances' | 'plumbing' | 'surfaces' | 'safety' | 'cleaning'
	estimatedMinutes: number
	diyVsHire: 'diy' | 'hire' | 'optional'
	cost?: number
	notes?: string
}

export const maintenanceTemplateSeeds: TemplateSeed[] = [
	// --- Monthly ---
	{
		title: 'HVAC Filter Check/Replace',
		description: 'Check HVAC filter and replace if dirty (every 1-3 months depending on use)',
		frequency: 'monthly',
		category: 'hvac',
		estimatedMinutes: 15,
		diyVsHire: 'diy'
	},
	{
		title: 'Garbage Disposal Cleaning',
		description: 'Run garbage disposal with ice + salt to clean blades',
		frequency: 'monthly',
		category: 'appliances',
		estimatedMinutes: 10,
		diyVsHire: 'diy'
	},
	{
		title: 'Under-Sink Leak Check',
		description: 'Check under all sinks for leaks or moisture',
		frequency: 'monthly',
		category: 'plumbing',
		estimatedMinutes: 10,
		diyVsHire: 'diy'
	},

	// --- Quarterly ---
	{
		title: 'Dishwasher Deep Clean',
		description: 'Deep clean dishwasher with vinegar cycle and filter clean',
		frequency: 'quarterly',
		category: 'appliances',
		estimatedMinutes: 30,
		diyVsHire: 'diy'
	},
	{
		title: 'Dryer Vent/Lint Trap Housing',
		description: 'Clean dryer vent and lint trap housing thoroughly',
		frequency: 'quarterly',
		category: 'appliances',
		estimatedMinutes: 20,
		diyVsHire: 'diy'
	},
	{
		title: 'Smoke/CO Detector Test',
		description: 'Test all smoke and CO detectors to ensure they are functioning',
		frequency: 'quarterly',
		category: 'safety',
		estimatedMinutes: 10,
		diyVsHire: 'diy'
	},
	{
		title: 'Range Hood Filter Clean',
		description: 'Clean range hood filter (Best by Broan P195ES70SB)',
		frequency: 'quarterly',
		category: 'appliances',
		estimatedMinutes: 20,
		diyVsHire: 'diy'
	},
	{
		title: 'Tub/Shower Caulking Inspection',
		description: 'Inspect caulking around tubs and showers, touch up if needed',
		frequency: 'quarterly',
		category: 'surfaces',
		estimatedMinutes: 30,
		diyVsHire: 'diy',
		notes: 'Check both master bath (Kohler K-1121) and bath 2 (Kohler K-1821-0)'
	},

	// --- Biannual ---
	{
		title: 'Tankless Water Heater Flush',
		description: 'Flush tankless water heater with vinegar (or hire out)',
		frequency: 'biannual',
		category: 'plumbing',
		estimatedMinutes: 60,
		diyVsHire: 'optional',
		cost: 175,
		notes: 'DIY with vinegar or hire out ~$150-200'
	},
	{
		title: 'HVAC Vent/Return Deep Clean',
		description: 'Deep clean all HVAC vents and returns throughout the condo',
		frequency: 'biannual',
		category: 'hvac',
		estimatedMinutes: 45,
		diyVsHire: 'diy'
	},
	{
		title: 'Carpet Cleaning',
		description: 'Professional carpet cleaning for bedrooms',
		frequency: 'biannual',
		category: 'surfaces',
		estimatedMinutes: 120,
		diyVsHire: 'hire',
		cost: 200,
		notes: '~$150-250 for 2 bedrooms'
	},
	{
		title: 'Granite Resealing',
		description: 'Reseal granite countertops and bathroom surfaces (wipe-on product)',
		frequency: 'biannual',
		category: 'surfaces',
		estimatedMinutes: 15,
		diyVsHire: 'diy'
	},
	{
		title: 'Washing Machine Clean',
		description: 'Run tub clean cycle and wipe gaskets on Whirlpool WFW9250WW',
		frequency: 'biannual',
		category: 'appliances',
		estimatedMinutes: 15,
		diyVsHire: 'diy'
	},
	{
		title: 'Weather Stripping Check',
		description: 'Check and replace weather stripping on doors and windows',
		frequency: 'biannual',
		category: 'surfaces',
		estimatedMinutes: 30,
		diyVsHire: 'diy'
	},
	{
		title: 'Grout Inspection',
		description: 'Inspect grout in both bathrooms, re-grout if needed',
		frequency: 'biannual',
		category: 'surfaces',
		estimatedMinutes: 30,
		diyVsHire: 'optional',
		notes: 'DIY for touch-ups, hire out if extensive re-grouting needed'
	},

	// --- Annual ---
	{
		title: 'HVAC Professional Tune-Up',
		description: 'Annual HVAC professional tune-up and inspection',
		frequency: 'annual',
		category: 'hvac',
		estimatedMinutes: 120,
		diyVsHire: 'hire',
		cost: 200,
		notes: '~$150-250'
	},
	{
		title: 'Professional Dryer Vent Cleaning',
		description: 'Professional dryer vent cleaning (full duct, not just lint trap)',
		frequency: 'annual',
		category: 'appliances',
		estimatedMinutes: 60,
		diyVsHire: 'hire',
		cost: 125,
		notes: '~$100-150 for Whirlpool WED9270XW'
	},
	{
		title: 'Water Heater Pressure Valve Test',
		description: 'Test water heater pressure relief valve',
		frequency: 'annual',
		category: 'plumbing',
		estimatedMinutes: 15,
		diyVsHire: 'diy'
	},
	{
		title: 'Hardwood Floor Deep Clean',
		description: 'Deep clean hardwood floors and refresh finish if needed (kitchen, dining, living)',
		frequency: 'annual',
		category: 'surfaces',
		estimatedMinutes: 180,
		diyVsHire: 'optional',
		notes: 'DIY deep clean, hire for refinishing if needed ($$$$)'
	},
	{
		title: 'Smoke/CO Battery Replace',
		description: 'Replace smoke/CO detector batteries (or replace whole unit if 10yr+)',
		frequency: 'annual',
		category: 'safety',
		estimatedMinutes: 15,
		diyVsHire: 'diy'
	},
	{
		title: 'Toilet Flapper/Supply Line Check',
		description: 'Check/replace toilet flappers and supply lines (Kohler K-3723 Persuade Curve)',
		frequency: 'annual',
		category: 'plumbing',
		estimatedMinutes: 30,
		diyVsHire: 'diy'
	},
	{
		title: 'Bathroom Exhaust Fan Clean',
		description: 'Inspect and clean bathroom exhaust fans in both bathrooms',
		frequency: 'annual',
		category: 'cleaning',
		estimatedMinutes: 30,
		diyVsHire: 'diy'
	}
]

export async function seedHouseholdData() {
	logger.info('Syncing household maintenance templates...')

	const results = await Promise.all(
		maintenanceTemplateSeeds.map(async (seed) => {
			return MaintenanceTemplate.findOneAndUpdate(
				{ title: seed.title },
				{ $set: seed },
				{ upsert: true, new: true }
			)
		})
	)

	logger.info(`Synced ${results.length} maintenance templates`)
}
