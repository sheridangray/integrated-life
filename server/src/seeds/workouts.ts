type WorkoutSeed = {
	name: string
	exercises: string[]
}

export const workoutSeeds: WorkoutSeed[] = [
	{
		name: 'MI7Smith Push A',
		exercises: [
			'Cable Chest Press',
			'Barbell Bench Press',
			'Cable Fly (mid)',
			'Cable Lateral Raise',
			'Cable Tricep Pushdown',
			'Dead Bug'
		]
	},
	{
		name: 'MI7Smith Pull A',
		exercises: [
			'Pull-ups',
			'Cable Lat Pulldown',
			'Face Pull',
			'Single-Arm Cable Row',
			'Barbell Curl'
		]
	},
	{
		name: 'MI7Smith Legs A',
		exercises: [
			'Barbell Hip Thrust',
			'Barbell Romanian Deadlift',
			'Cable Hamstring Curl',
			'TRX Assisted Reverse Lunge',
			'Barbell Calf Raise'
		]
	},
	{
		name: 'MI7Smith Push B',
		exercises: [
			'Standing Cable Overhead Press',
			'Barbell Incline Press',
			'Low-to-High Cable Raise',
			'Close-Grip Bench Press',
			'Overhead Cable Tricep Extension'
		]
	},
	{
		name: 'MI7Smith Pull B',
		exercises: [
			'Seated Cable Row',
			'Barbell Bent-Over Row',
			'Rear-Delt Cable Fly',
			'Cable Hammer Curl',
			'Barbell Farmer Carry'
		]
	},
	{
		name: 'MI7Smith Legs B',
		exercises: [
			'Plate Goblet Squat',
			'Barbell Split Squat',
			'Cable Terminal Knee Extension',
			'Cable Hip Abduction',
			'Single-Leg Balance'
		]
	},
	// Plan A — Bodyweight Only (Apartment)
	{
		name: 'Push A (Bodyweight)',
		exercises: ['Standard Push-Up', 'Decline Push-Up', 'Chair Dips']
	},
	{
		name: 'Pull A (Bodyweight)',
		exercises: ['Reverse Snow Angels', 'Superman Hold', 'Prone Back Extensions']
	},
	{
		name: 'Legs A (Bodyweight)',
		exercises: ['Bodyweight Squat', 'Reverse Lunge', 'Single-Leg Glute Bridge']
	},
	// Plan B — Resistance Bands (Apartment)
	{
		name: 'Push A (Bands)',
		exercises: [
			'Standing Resistance Band Chest Press',
			'Resistance Band Overhead Press',
			'Resistance Band Triceps Extension'
		]
	},
	{
		name: 'Pull A (Bands)',
		exercises: [
			'Resistance Band Seated Row',
			'Resistance Band Face Pull',
			'Resistance Band Biceps Curl'
		]
	},
	{
		name: 'Legs A (Bands)',
		exercises: [
			'Resistance Band Squat',
			'Resistance Band Romanian Deadlift',
			'Resistance Band Lateral Walk'
		]
	}
]
