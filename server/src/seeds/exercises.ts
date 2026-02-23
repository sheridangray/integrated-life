type ExerciseSeed = {
	name: string
	muscles: string[]
	bodyParts: string[]
	resistanceType: string
	measurementType: string
	steps: string[]
	videoUrl: string
	category: string
}

export const exerciseSeeds: ExerciseSeed[] = [
	{
		name: 'Cable Chest Press',
		muscles: ['Pectoralis', 'Triceps', 'Deltoids'],
		bodyParts: ['Chest', 'Arms', 'Shoulders'],
		resistanceType: 'Cables',
		measurementType: 'Strength',
		steps: [
			'Set the pulleys to chest height.',
			'Grab a handle in each hand and step forward into a staggered stance.',
			'Press both handles forward until arms are fully extended.',
			'Slowly return to the starting position.'
		],
		videoUrl: 'https://www.youtube.com/watch?v=MFW-gJRvamw',
		category: 'Push'
	},
	{
		name: 'Barbell Bench Press',
		muscles: ['Pectoralis', 'Triceps', 'Deltoids'],
		bodyParts: ['Chest', 'Arms', 'Shoulders'],
		resistanceType: 'Weights (Free)',
		measurementType: 'Strength',
		steps: [
			'Lie flat on a bench with eyes under the bar.',
			'Grip the bar slightly wider than shoulder-width.',
			'Unrack and lower the bar to mid-chest.',
			'Press the bar up to full lockout.'
		],
		videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
		category: 'Push'
	},
	{
		name: 'Cable Fly (mid)',
		muscles: ['Pectoralis', 'Serratus'],
		bodyParts: ['Chest'],
		resistanceType: 'Cables',
		measurementType: 'Strength',
		steps: [
			'Set the pulleys to shoulder height.',
			'Stand centered, grab handles with arms out wide.',
			'Bring hands together in front of your chest in a hugging motion.',
			'Slowly return to the starting position.'
		],
		videoUrl: 'https://www.youtube.com/watch?v=Iwe6AmxVf7o',
		category: 'Push'
	},
	{
		name: 'Cable Lateral Raise',
		muscles: ['Deltoids'],
		bodyParts: ['Shoulders'],
		resistanceType: 'Cables',
		measurementType: 'Strength',
		steps: [
			'Stand sideways to a low cable pulley.',
			'Grab the handle with the far hand.',
			'Raise your arm out to the side until shoulder height.',
			'Slowly lower back down.'
		],
		videoUrl: 'https://www.youtube.com/watch?v=PyTbkMJDfBE',
		category: 'Push'
	},
	{
		name: 'Cable Tricep Pushdown',
		muscles: ['Triceps'],
		bodyParts: ['Arms'],
		resistanceType: 'Cables',
		measurementType: 'Strength',
		steps: [
			'Attach a straight or V-bar to a high cable pulley.',
			'Grip the attachment with palms facing down.',
			'Push down until arms are fully extended.',
			'Slowly return to the starting position.'
		],
		videoUrl: 'https://www.youtube.com/watch?v=2-LAMcpzODU',
		category: 'Push'
	},
	{
		name: 'Dead Bug',
		muscles: ['Abdominals', 'Hip Flexors', 'Obliques'],
		bodyParts: ['Core'],
		resistanceType: 'Bodyweight',
		measurementType: 'Rep-Only',
		steps: [
			'Lie on your back with arms extended toward the ceiling and knees at 90 degrees.',
			'Lower one arm and the opposite leg toward the floor simultaneously.',
			'Return to starting position and repeat on the other side.',
			'Keep your lower back pressed into the floor throughout.'
		],
		videoUrl: 'https://www.youtube.com/watch?v=I5xbsA71v1A',
		category: 'Core'
	},
	{
		name: 'Pull-ups',
		muscles: ['Latissimus Dorsi', 'Biceps', 'Trapezius'],
		bodyParts: ['Back', 'Arms'],
		resistanceType: 'Weighted Bodyweight',
		measurementType: 'Strength',
		steps: [
			'Grip the pull-up bar with palms facing away, slightly wider than shoulder-width.',
			'Hang with arms fully extended.',
			'Pull yourself up until your chin is above the bar.',
			'Lower yourself back down with control.'
		],
		videoUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g',
		category: 'Pull'
	},
	{
		name: 'Cable Lat Pulldown',
		muscles: ['Latissimus Dorsi', 'Biceps', 'Trapezius'],
		bodyParts: ['Back', 'Arms'],
		resistanceType: 'Cables',
		measurementType: 'Strength',
		steps: [
			'Sit at the lat pulldown machine and grip the bar slightly wider than shoulder-width.',
			'Pull the bar down to your upper chest.',
			'Squeeze your shoulder blades together at the bottom.',
			'Slowly return the bar to the starting position.'
		],
		videoUrl: 'https://www.youtube.com/watch?v=CAwf7n6Luuc',
		category: 'Pull'
	},
	{
		name: 'Face Pull',
		muscles: ['Deltoids', 'Rotator Cuff', 'Trapezius'],
		bodyParts: ['Shoulders', 'Back'],
		resistanceType: 'Cables',
		measurementType: 'Strength',
		steps: [
			'Set a cable pulley to upper chest height with a rope attachment.',
			'Grip the rope with palms facing inward.',
			'Pull the rope toward your face, separating the ends past your ears.',
			'Squeeze shoulder blades together and slowly return.'
		],
		videoUrl: 'https://www.youtube.com/watch?v=rep-qVOkqgk',
		category: 'Pull'
	},
	{
		name: 'Single-Arm Cable Row',
		muscles: ['Latissimus Dorsi', 'Trapezius', 'Biceps'],
		bodyParts: ['Back', 'Arms'],
		resistanceType: 'Cables',
		measurementType: 'Strength',
		steps: [
			'Set a cable pulley to mid-height with a single handle.',
			'Stand facing the machine with a staggered stance.',
			'Pull the handle toward your hip, squeezing your shoulder blade.',
			'Slowly return to the starting position and repeat.'
		],
		videoUrl: 'https://www.youtube.com/watch?v=xQNrFHEMhI4',
		category: 'Pull'
	},
	{
		name: 'Barbell Curl',
		muscles: ['Biceps', 'Brachioradialis'],
		bodyParts: ['Arms'],
		resistanceType: 'Weights (Free)',
		measurementType: 'Strength',
		steps: [
			'Stand with feet shoulder-width apart holding a barbell with palms facing up.',
			'Curl the bar up toward your shoulders, keeping elbows at your sides.',
			'Squeeze at the top.',
			'Slowly lower the bar back down.'
		],
		videoUrl: 'https://www.youtube.com/watch?v=kwG2ipFRgFo',
		category: 'Pull'
	},
	{
		name: 'Barbell Hip Thrust',
		muscles: ['Glutes', 'Hamstrings'],
		bodyParts: ['Lower Body'],
		resistanceType: 'Weights (Free)',
		measurementType: 'Strength',
		steps: [
			'Sit on the ground with your upper back against a bench and a barbell over your hips.',
			'Drive through your heels to lift your hips until your body forms a straight line.',
			'Squeeze your glutes at the top.',
			'Lower your hips back down with control.'
		],
		videoUrl: 'https://www.youtube.com/watch?v=SEdqd1n0cvg',
		category: 'Legs'
	},
	{
		name: 'Barbell Romanian Deadlift',
		muscles: ['Hamstrings', 'Glutes', 'Trapezius'],
		bodyParts: ['Lower Body', 'Back'],
		resistanceType: 'Weights (Free)',
		measurementType: 'Strength',
		steps: [
			'Stand with feet hip-width apart holding a barbell in front of your thighs.',
			'Hinge at the hips, pushing them back while lowering the bar along your legs.',
			'Lower until you feel a stretch in your hamstrings.',
			'Drive your hips forward to return to standing.'
		],
		videoUrl: 'https://www.youtube.com/watch?v=7AaaYhMqmjg',
		category: 'Legs'
	},
	{
		name: 'Cable Hamstring Curl',
		muscles: ['Hamstrings', 'Calves'],
		bodyParts: ['Lower Body'],
		resistanceType: 'Cables',
		measurementType: 'Strength',
		steps: [
			'Attach an ankle strap to a low cable pulley.',
			'Face the machine and secure the strap around one ankle.',
			'Curl your heel toward your glute.',
			'Slowly return to the starting position.'
		],
		videoUrl: 'https://www.youtube.com/watch?v=A3ZhFaV0tc0',
		category: 'Legs'
	},
	{
		name: 'TRX Assisted Reverse Lunge',
		muscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
		bodyParts: ['Lower Body'],
		resistanceType: 'Bodyweight',
		measurementType: 'Rep-Only',
		steps: [
			'Hold TRX handles at chest height for balance.',
			'Step one foot back into a lunge position.',
			'Lower your back knee toward the floor.',
			'Push through your front heel to return to standing.'
		],
		videoUrl: 'https://www.youtube.com/watch?v=Ry5E5P8b6os',
		category: 'Legs'
	},
	{
		name: 'Barbell Calf Raise',
		muscles: ['Calves'],
		bodyParts: ['Lower Body'],
		resistanceType: 'Weights (Free)',
		measurementType: 'Strength',
		steps: [
			'Stand with a barbell on your upper back, balls of your feet on an elevated surface.',
			'Rise up onto your toes as high as possible.',
			'Squeeze your calves at the top.',
			'Slowly lower your heels below the platform.'
		],
		videoUrl: 'https://www.youtube.com/watch?v=RBZ_0ymaJbA',
		category: 'Legs'
	},
	{
		name: 'Standing Cable Overhead Press',
		muscles: ['Deltoids', 'Triceps'],
		bodyParts: ['Shoulders', 'Arms'],
		resistanceType: 'Cables',
		measurementType: 'Strength',
		steps: [
			'Set the pulleys to the lowest position with handles.',
			'Grip the handles at shoulder height with palms facing forward.',
			'Press both handles overhead until arms are fully extended.',
			'Slowly return to shoulder height.'
		],
		videoUrl: 'https://www.youtube.com/watch?v=qEwKCR5JCog',
		category: 'Push'
	},
	{
		name: 'Barbell Incline Press',
		muscles: ['Pectoralis', 'Deltoids', 'Triceps'],
		bodyParts: ['Chest', 'Shoulders', 'Arms'],
		resistanceType: 'Weights (Free)',
		measurementType: 'Strength',
		steps: [
			'Set a bench to a 30–45 degree incline.',
			'Lie back and grip the barbell slightly wider than shoulder-width.',
			'Unrack and lower the bar to your upper chest.',
			'Press the bar up to full lockout.'
		],
		videoUrl: 'https://www.youtube.com/watch?v=SrqOu55lrYU',
		category: 'Push'
	},
	{
		name: 'Low-to-High Cable Raise',
		muscles: ['Deltoids', 'Serratus'],
		bodyParts: ['Shoulders', 'Chest'],
		resistanceType: 'Cables',
		measurementType: 'Strength',
		steps: [
			'Set the cable pulley to the lowest position.',
			'Stand sideways to the machine, grab the handle with the far hand.',
			'Raise your arm diagonally across your body from low to high.',
			'Slowly return to the starting position.'
		],
		videoUrl: 'https://www.youtube.com/watch?v=K_A-jiyNUQA',
		category: 'Push'
	},
	{
		name: 'Close-Grip Bench Press',
		muscles: ['Triceps', 'Pectoralis'],
		bodyParts: ['Arms', 'Chest'],
		resistanceType: 'Weights (Free)',
		measurementType: 'Strength',
		steps: [
			'Lie flat on a bench and grip the barbell with hands about shoulder-width apart.',
			'Unrack and lower the bar to your mid-chest, keeping elbows close to your body.',
			'Press the bar up to full lockout.',
			'Repeat for the desired number of reps.'
		],
		videoUrl: 'https://www.youtube.com/watch?v=nEF0bv2FW94',
		category: 'Push'
	},
	{
		name: 'Overhead Cable Tricep Extension',
		muscles: ['Triceps'],
		bodyParts: ['Arms'],
		resistanceType: 'Cables',
		measurementType: 'Strength',
		steps: [
			'Attach a rope to a low cable pulley.',
			'Face away from the machine, holding the rope overhead.',
			'Extend your arms fully overhead.',
			'Slowly bend your elbows to return behind your head.'
		],
		videoUrl: 'https://www.youtube.com/watch?v=kiJISAfEWBo',
		category: 'Push'
	},
	{
		name: 'Seated Cable Row',
		muscles: ['Latissimus Dorsi', 'Trapezius', 'Biceps'],
		bodyParts: ['Back', 'Arms'],
		resistanceType: 'Cables',
		measurementType: 'Strength',
		steps: [
			'Sit at a cable row station with feet on the footrests.',
			'Grip the handle and sit upright with arms extended.',
			'Pull the handle toward your torso, squeezing your shoulder blades.',
			'Slowly return to the starting position.'
		],
		videoUrl: 'https://www.youtube.com/watch?v=GZbfZ033f74',
		category: 'Pull'
	},
	{
		name: 'Barbell Bent-Over Row',
		muscles: ['Latissimus Dorsi', 'Trapezius', 'Biceps'],
		bodyParts: ['Back', 'Arms'],
		resistanceType: 'Weights (Free)',
		measurementType: 'Strength',
		steps: [
			'Stand with feet hip-width apart, holding a barbell with an overhand grip.',
			'Hinge at the hips until your torso is roughly 45 degrees.',
			'Row the bar to your lower chest, squeezing your shoulder blades.',
			'Lower the bar with control.'
		],
		videoUrl: 'https://www.youtube.com/watch?v=FWJR5Ve8bnQ',
		category: 'Pull'
	},
	{
		name: 'Rear-Delt Cable Fly',
		muscles: ['Deltoids', 'Rotator Cuff', 'Trapezius'],
		bodyParts: ['Shoulders', 'Back'],
		resistanceType: 'Cables',
		measurementType: 'Strength',
		steps: [
			'Set the pulleys to shoulder height without any attachments (use the ball stops).',
			'Cross the cables: grab the left cable with your right hand and vice versa.',
			'Pull both handles outward and back, squeezing your rear delts.',
			'Slowly return to the crossed position.'
		],
		videoUrl: 'https://www.youtube.com/watch?v=B_5zINsNJpI',
		category: 'Pull'
	},
	{
		name: 'Cable Hammer Curl',
		muscles: ['Biceps', 'Brachioradialis'],
		bodyParts: ['Arms'],
		resistanceType: 'Cables',
		measurementType: 'Strength',
		steps: [
			'Attach a rope to a low cable pulley.',
			'Stand facing the machine and grip the rope with a neutral (hammer) grip.',
			'Curl the rope toward your shoulders, keeping elbows at your sides.',
			'Slowly lower back down.'
		],
		videoUrl: 'https://www.youtube.com/watch?v=pAplQXk3dkU',
		category: 'Pull'
	},
	{
		name: 'Barbell Farmer Carry',
		muscles: ['Trapezius', 'Wrist Flexors', 'Abdominals'],
		bodyParts: ['Back', 'Arms', 'Core'],
		resistanceType: 'Weights (Free)',
		measurementType: 'Distance-Based',
		steps: [
			'Pick up a barbell or trap bar with a firm grip.',
			'Stand tall with shoulders back and core braced.',
			'Walk forward with controlled, even steps.',
			'Maintain an upright posture throughout.'
		],
		videoUrl: 'https://www.youtube.com/watch?v=Fkzk_RqlYig',
		category: 'Pull'
	},
	{
		name: 'Plate Goblet Squat',
		muscles: ['Quadriceps', 'Glutes', 'Abdominals'],
		bodyParts: ['Lower Body', 'Core'],
		resistanceType: 'Weights (Free)',
		measurementType: 'Strength',
		steps: [
			'Hold a weight plate at your chest with both hands.',
			'Stand with feet slightly wider than shoulder-width.',
			'Squat down until your thighs are at least parallel to the floor.',
			'Drive through your heels to stand back up.'
		],
		videoUrl: 'https://www.youtube.com/watch?v=MeIiIdhvXT4',
		category: 'Legs'
	},
	{
		name: 'Barbell Split Squat',
		muscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
		bodyParts: ['Lower Body'],
		resistanceType: 'Weights (Free)',
		measurementType: 'Strength',
		steps: [
			'Stand in a split stance with a barbell on your upper back.',
			'Lower your back knee toward the floor.',
			'Keep your front knee tracked over your toes.',
			'Push through your front heel to return to standing.'
		],
		videoUrl: 'https://www.youtube.com/watch?v=Up1f2p_jGPQ',
		category: 'Legs'
	},
	{
		name: 'Cable Terminal Knee Extension',
		muscles: ['Quadriceps'],
		bodyParts: ['Lower Body'],
		resistanceType: 'Cables',
		measurementType: 'Rep-Only',
		steps: [
			'Attach a cable to a low pulley and loop it behind one knee.',
			'Face the machine and step back to create tension.',
			'Slightly bend the working knee, then extend it fully.',
			'Repeat for the desired number of reps.'
		],
		videoUrl: 'https://www.youtube.com/watch?v=MPoHMHmM2RM',
		category: 'Legs'
	},
	{
		name: 'Cable Hip Abduction',
		muscles: ['Abductors', 'Glutes'],
		bodyParts: ['Lower Body'],
		resistanceType: 'Cables',
		measurementType: 'Rep-Only',
		steps: [
			'Attach an ankle strap to a low cable pulley.',
			'Stand sideways to the machine and strap the far ankle.',
			'Lift your leg away from the machine in a controlled motion.',
			'Slowly return to the starting position.'
		],
		videoUrl: 'https://www.youtube.com/watch?v=PdsCAWkioUE',
		category: 'Legs'
	},
	{
		name: 'Single-Leg Balance',
		muscles: ['Tibialis Anterior', 'Calves', 'Quadriceps'],
		bodyParts: ['Lower Body'],
		resistanceType: 'Bodyweight',
		measurementType: 'Time-Based',
		steps: [
			'Stand on one foot with a slight bend in the knee.',
			'Keep your core engaged and eyes focused on a fixed point.',
			'Hold the position for the target duration.',
			'Switch legs and repeat.'
		],
		videoUrl: 'https://www.youtube.com/watch?v=H2bPFa73eHE',
		category: 'Legs'
	}
]
