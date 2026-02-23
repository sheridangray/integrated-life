type WorkoutSeed = {
	name: string
	difficulty: string
	exercises: string[]
}

export const workoutSeeds: WorkoutSeed[] = [
	{
		name: 'MI7Smith Push A',
		difficulty: 'Intermediate',
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
		difficulty: 'Intermediate',
		exercises: [
			'Pull-ups (assisted if needed)',
			'Cable Lat Pulldown',
			'Face Pull',
			'Single-Arm Cable Row',
			'Barbell Curl'
		]
	},
	{
		name: 'MI7Smith Legs A',
		difficulty: 'Intermediate',
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
		difficulty: 'Intermediate',
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
		difficulty: 'Intermediate',
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
		difficulty: 'Intermediate',
		exercises: [
			'Plate Goblet Squat',
			'Barbell Split Squat',
			'Cable Terminal Knee Extension',
			'Cable Hip Abduction',
			'Single-Leg Balance'
		]
	}
]
