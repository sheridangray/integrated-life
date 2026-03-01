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
	}
]
