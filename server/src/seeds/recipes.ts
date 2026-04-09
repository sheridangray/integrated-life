type RecipeSeed = {
	name: string
	description: string
	servings: number
	prepTime: number
	cookTime: number
	ingredients: Array<{ name: string; quantity: number; unit: string; category: string }>
	instructions: string[]
	tags: string[]
	nutritionPerServing: {
		calories: number
		protein: number
		carbs: number
		fat: number
		fiber: number
		sodium?: number
		sugar?: number
	}
}

// 5 Quick Weeknight Meals (< 30 min)
const quickMeals: RecipeSeed[] = [
	{
		name: 'Garlic Shrimp Pasta',
		description: 'Quick sautéed shrimp with garlic, lemon, and angel hair pasta',
		servings: 4,
		prepTime: 5,
		cookTime: 15,
		ingredients: [
			{ name: 'angel hair pasta', quantity: 12, unit: 'oz', category: 'pantry' },
			{ name: 'large shrimp', quantity: 1, unit: 'lb', category: 'seafood' },
			{ name: 'garlic', quantity: 4, unit: 'cloves', category: 'produce' },
			{ name: 'lemon', quantity: 1, unit: 'whole', category: 'produce' },
			{ name: 'red pepper flakes', quantity: 0.25, unit: 'tsp', category: 'pantry' },
			{ name: 'parsley', quantity: 0.25, unit: 'cup', category: 'produce' },
			{ name: 'butter', quantity: 2, unit: 'tbsp', category: 'dairy' },
			{ name: 'olive oil', quantity: 2, unit: 'tbsp', category: 'pantry' }
		],
		instructions: [
			'Cook pasta according to package directions. Reserve 1 cup pasta water.',
			'Heat olive oil in a large skillet over medium-high heat.',
			'Season shrimp with salt and pepper, cook 2 minutes per side. Remove.',
			'Add garlic and red pepper flakes, cook 30 seconds.',
			'Add butter, lemon juice, and 1/2 cup pasta water.',
			'Toss in pasta and shrimp, adding more pasta water if needed.',
			'Garnish with parsley and serve immediately.'
		],
		tags: ['quick', 'weeknight', 'italian', 'seafood'],
		nutritionPerServing: { calories: 420, protein: 28, carbs: 48, fat: 14, fiber: 2, sodium: 380 }
	},
	{
		name: 'Chicken Teriyaki Rice Bowl',
		description: 'Sweet and savory chicken thighs with steamed rice and quick-pickled cucumbers',
		servings: 4,
		prepTime: 10,
		cookTime: 15,
		ingredients: [
			{ name: 'chicken thighs', quantity: 1.5, unit: 'lbs', category: 'meat' },
			{ name: 'jasmine rice', quantity: 2, unit: 'cups', category: 'pantry' },
			{ name: 'soy sauce', quantity: 3, unit: 'tbsp', category: 'pantry' },
			{ name: 'mirin', quantity: 2, unit: 'tbsp', category: 'pantry' },
			{ name: 'honey', quantity: 1, unit: 'tbsp', category: 'pantry' },
			{ name: 'cucumber', quantity: 1, unit: 'whole', category: 'produce' },
			{ name: 'rice vinegar', quantity: 2, unit: 'tbsp', category: 'pantry' },
			{ name: 'sesame seeds', quantity: 1, unit: 'tbsp', category: 'pantry' },
			{ name: 'green onions', quantity: 3, unit: 'stalks', category: 'produce' }
		],
		instructions: [
			'Cook rice according to package directions.',
			'Mix soy sauce, mirin, and honey for teriyaki sauce.',
			'Slice cucumber thinly, toss with rice vinegar and pinch of sugar.',
			'Heat oil in skillet, cook chicken thighs 5-6 minutes per side.',
			'Add teriyaki sauce to pan, cook until glazed, about 2 minutes.',
			'Slice chicken and serve over rice with pickled cucumber.',
			'Top with sesame seeds and sliced green onions.'
		],
		tags: ['quick', 'weeknight', 'asian', 'kid-friendly'],
		nutritionPerServing: { calories: 510, protein: 32, carbs: 62, fat: 14, fiber: 1, sodium: 720 }
	},
	{
		name: '15-Minute Black Bean Tacos',
		description: 'Spiced black beans with fresh pico, avocado, and lime crema',
		servings: 4,
		prepTime: 5,
		cookTime: 10,
		ingredients: [
			{ name: 'black beans', quantity: 2, unit: 'cans', category: 'pantry' },
			{ name: 'corn tortillas', quantity: 12, unit: 'pieces', category: 'bakery' },
			{ name: 'avocado', quantity: 2, unit: 'whole', category: 'produce' },
			{ name: 'lime', quantity: 2, unit: 'whole', category: 'produce' },
			{ name: 'sour cream', quantity: 0.5, unit: 'cup', category: 'dairy' },
			{ name: 'tomatoes', quantity: 2, unit: 'whole', category: 'produce' },
			{ name: 'red onion', quantity: 0.5, unit: 'whole', category: 'produce' },
			{ name: 'cilantro', quantity: 0.25, unit: 'cup', category: 'produce' },
			{ name: 'cumin', quantity: 1, unit: 'tsp', category: 'pantry' },
			{ name: 'chili powder', quantity: 1, unit: 'tsp', category: 'pantry' }
		],
		instructions: [
			'Drain and rinse beans. Heat in a pan with cumin, chili powder, and salt.',
			'Mash half the beans for a creamy texture, leave rest whole.',
			'Dice tomatoes and onion for pico. Toss with lime juice and cilantro.',
			'Mix sour cream with lime juice and a pinch of salt for crema.',
			'Warm tortillas in a dry skillet or microwave.',
			'Assemble tacos with beans, sliced avocado, pico, and lime crema.'
		],
		tags: ['quick', 'weeknight', 'mexican', 'vegetarian', 'healthy'],
		nutritionPerServing: { calories: 380, protein: 14, carbs: 52, fat: 16, fiber: 14, sodium: 420 }
	},
	{
		name: 'Pan-Seared Salmon with Asparagus',
		description: 'Crispy-skin salmon with roasted asparagus and lemon-dill sauce',
		servings: 2,
		prepTime: 5,
		cookTime: 20,
		ingredients: [
			{ name: 'salmon fillets', quantity: 2, unit: 'pieces', category: 'seafood' },
			{ name: 'asparagus', quantity: 1, unit: 'bunch', category: 'produce' },
			{ name: 'lemon', quantity: 1, unit: 'whole', category: 'produce' },
			{ name: 'fresh dill', quantity: 2, unit: 'tbsp', category: 'produce' },
			{ name: 'olive oil', quantity: 2, unit: 'tbsp', category: 'pantry' },
			{ name: 'butter', quantity: 1, unit: 'tbsp', category: 'dairy' }
		],
		instructions: [
			'Preheat oven to 400°F. Toss asparagus with olive oil, salt, and pepper.',
			'Roast asparagus for 12-15 minutes.',
			'Pat salmon dry, season with salt and pepper.',
			'Heat oil in an oven-safe skillet over medium-high heat.',
			'Place salmon skin-side down, cook 4 minutes until crispy.',
			'Flip and cook 3 more minutes for medium.',
			'Add butter, lemon juice, and dill to pan. Spoon over salmon.'
		],
		tags: ['quick', 'weeknight', 'healthy', 'mediterranean'],
		nutritionPerServing: { calories: 440, protein: 38, carbs: 8, fat: 28, fiber: 4, sodium: 290 }
	},
	{
		name: 'Caprese Grilled Cheese',
		description: 'Elevated grilled cheese with fresh mozzarella, tomato, basil, and balsamic',
		servings: 2,
		prepTime: 5,
		cookTime: 8,
		ingredients: [
			{ name: 'sourdough bread', quantity: 4, unit: 'slices', category: 'bakery' },
			{ name: 'fresh mozzarella', quantity: 8, unit: 'oz', category: 'dairy' },
			{ name: 'tomato', quantity: 1, unit: 'large', category: 'produce' },
			{ name: 'fresh basil', quantity: 8, unit: 'leaves', category: 'produce' },
			{ name: 'balsamic glaze', quantity: 2, unit: 'tbsp', category: 'pantry' },
			{ name: 'butter', quantity: 2, unit: 'tbsp', category: 'dairy' }
		],
		instructions: [
			'Slice mozzarella and tomato into thin rounds.',
			'Layer mozzarella, tomato, and basil on bread. Season with salt and pepper.',
			'Butter the outside of each slice.',
			'Cook in a skillet over medium heat, 3-4 minutes per side until golden.',
			'Drizzle with balsamic glaze and serve.'
		],
		tags: ['quick', 'weeknight', 'italian', 'kid-friendly', 'vegetarian'],
		nutritionPerServing: { calories: 520, protein: 24, carbs: 38, fat: 30, fiber: 2, sodium: 680 }
	}
]

// 5 Kid-Friendly
const kidFriendly: RecipeSeed[] = [
	{
		name: 'Baked Chicken Tenders',
		description: 'Crispy panko-crusted chicken tenders baked to golden perfection',
		servings: 4,
		prepTime: 15,
		cookTime: 20,
		ingredients: [
			{ name: 'chicken breast', quantity: 1.5, unit: 'lbs', category: 'meat' },
			{ name: 'panko breadcrumbs', quantity: 1.5, unit: 'cups', category: 'pantry' },
			{ name: 'parmesan cheese', quantity: 0.5, unit: 'cup', category: 'dairy' },
			{ name: 'eggs', quantity: 2, unit: 'whole', category: 'dairy' },
			{ name: 'flour', quantity: 0.5, unit: 'cup', category: 'pantry' },
			{ name: 'garlic powder', quantity: 1, unit: 'tsp', category: 'pantry' },
			{ name: 'paprika', quantity: 0.5, unit: 'tsp', category: 'pantry' }
		],
		instructions: [
			'Preheat oven to 425°F. Line a baking sheet with parchment.',
			'Cut chicken into strips about 1 inch wide.',
			'Set up breading station: flour, beaten eggs, panko mixed with parmesan and spices.',
			'Coat each strip: flour, egg, panko mixture.',
			'Place on baking sheet, spray lightly with cooking spray.',
			'Bake 15-18 minutes until golden and cooked through.',
			'Serve with honey mustard or ketchup for dipping.'
		],
		tags: ['kid-friendly', 'american', 'weeknight'],
		nutritionPerServing: { calories: 340, protein: 38, carbs: 22, fat: 10, fiber: 1, sodium: 420 }
	},
	{
		name: 'Mac and Cheese with Hidden Veggies',
		description: 'Creamy stovetop mac and cheese with puréed butternut squash and carrots',
		servings: 6,
		prepTime: 10,
		cookTime: 25,
		ingredients: [
			{ name: 'elbow macaroni', quantity: 1, unit: 'lb', category: 'pantry' },
			{ name: 'butternut squash', quantity: 1, unit: 'cup', category: 'produce' },
			{ name: 'carrots', quantity: 2, unit: 'medium', category: 'produce' },
			{ name: 'sharp cheddar cheese', quantity: 2, unit: 'cups', category: 'dairy' },
			{ name: 'whole milk', quantity: 1, unit: 'cup', category: 'dairy' },
			{ name: 'butter', quantity: 2, unit: 'tbsp', category: 'dairy' },
			{ name: 'cream cheese', quantity: 4, unit: 'oz', category: 'dairy' }
		],
		instructions: [
			'Boil squash and carrots until very tender, about 15 minutes.',
			'Blend cooked vegetables with milk until smooth.',
			'Cook macaroni according to package directions.',
			'In the same pot, melt butter and cream cheese over low heat.',
			'Stir in veggie purée and shredded cheddar until melty.',
			'Add pasta, stir to coat. Season with salt and pepper.',
			'Serve immediately while creamy.'
		],
		tags: ['kid-friendly', 'american', 'vegetarian'],
		nutritionPerServing: { calories: 480, protein: 20, carbs: 56, fat: 20, fiber: 3, sodium: 520 }
	},
	{
		name: 'Mini Meatball Sliders',
		description: 'Bite-sized turkey meatballs on soft rolls with marinara and melted provolone',
		servings: 6,
		prepTime: 15,
		cookTime: 25,
		ingredients: [
			{ name: 'ground turkey', quantity: 1.5, unit: 'lbs', category: 'meat' },
			{ name: 'slider rolls', quantity: 12, unit: 'pieces', category: 'bakery' },
			{ name: 'marinara sauce', quantity: 2, unit: 'cups', category: 'pantry' },
			{ name: 'provolone cheese', quantity: 6, unit: 'slices', category: 'dairy' },
			{ name: 'breadcrumbs', quantity: 0.5, unit: 'cup', category: 'pantry' },
			{ name: 'egg', quantity: 1, unit: 'whole', category: 'dairy' },
			{ name: 'Italian seasoning', quantity: 1, unit: 'tsp', category: 'pantry' },
			{ name: 'garlic powder', quantity: 0.5, unit: 'tsp', category: 'pantry' }
		],
		instructions: [
			'Preheat oven to 375°F.',
			'Mix turkey, breadcrumbs, egg, Italian seasoning, garlic powder, salt, and pepper.',
			'Roll into small meatballs (about 24 total).',
			'Bake meatballs on a sheet pan for 18-20 minutes.',
			'Heat marinara sauce in a saucepan.',
			'Place 2 meatballs on each roll, top with sauce and half-slice provolone.',
			'Broil 1-2 minutes until cheese is melted.'
		],
		tags: ['kid-friendly', 'american', 'weeknight'],
		nutritionPerServing: { calories: 410, protein: 32, carbs: 36, fat: 16, fiber: 2, sodium: 680 }
	},
	{
		name: 'Peanut Butter Banana Pancakes',
		description: 'Fluffy whole wheat pancakes with peanut butter swirl and banana slices',
		servings: 4,
		prepTime: 10,
		cookTime: 15,
		ingredients: [
			{ name: 'whole wheat flour', quantity: 1.5, unit: 'cups', category: 'pantry' },
			{ name: 'bananas', quantity: 2, unit: 'whole', category: 'produce' },
			{ name: 'peanut butter', quantity: 3, unit: 'tbsp', category: 'pantry' },
			{ name: 'milk', quantity: 1, unit: 'cup', category: 'dairy' },
			{ name: 'egg', quantity: 1, unit: 'whole', category: 'dairy' },
			{ name: 'baking powder', quantity: 2, unit: 'tsp', category: 'pantry' },
			{ name: 'maple syrup', quantity: 4, unit: 'tbsp', category: 'pantry' },
			{ name: 'butter', quantity: 1, unit: 'tbsp', category: 'dairy' }
		],
		instructions: [
			'Mix flour, baking powder, and pinch of salt in a bowl.',
			'Whisk milk and egg, add to dry ingredients. Stir until just combined.',
			'Warm peanut butter so it is drizzleable.',
			'Heat a griddle or pan over medium heat, add a little butter.',
			'Pour 1/4 cup batter per pancake. Drizzle peanut butter on top, swirl with a toothpick.',
			'Cook until bubbles form, flip, cook 1-2 more minutes.',
			'Serve topped with sliced bananas and maple syrup.'
		],
		tags: ['kid-friendly', 'american', 'breakfast'],
		nutritionPerServing: { calories: 380, protein: 14, carbs: 56, fat: 12, fiber: 5, sodium: 320 }
	},
	{
		name: 'Pizza Quesadillas',
		description: 'Crispy tortillas filled with pepperoni, mozzarella, and pizza sauce',
		servings: 4,
		prepTime: 5,
		cookTime: 10,
		ingredients: [
			{ name: 'flour tortillas', quantity: 4, unit: 'large', category: 'bakery' },
			{ name: 'mozzarella cheese', quantity: 2, unit: 'cups', category: 'dairy' },
			{ name: 'pepperoni', quantity: 24, unit: 'slices', category: 'meat' },
			{ name: 'pizza sauce', quantity: 0.5, unit: 'cup', category: 'pantry' },
			{ name: 'Italian seasoning', quantity: 0.5, unit: 'tsp', category: 'pantry' },
			{ name: 'butter', quantity: 1, unit: 'tbsp', category: 'dairy' }
		],
		instructions: [
			'Spread pizza sauce on one half of each tortilla.',
			'Layer mozzarella and pepperoni on the sauce side.',
			'Sprinkle with Italian seasoning. Fold tortilla in half.',
			'Heat butter in a skillet over medium heat.',
			'Cook each quesadilla 2-3 minutes per side until golden and cheese melts.',
			'Cut into wedges. Serve with extra pizza sauce for dipping.'
		],
		tags: ['kid-friendly', 'quick', 'american'],
		nutritionPerServing: { calories: 440, protein: 22, carbs: 32, fat: 24, fiber: 1, sodium: 920 }
	}
]

// 5 Healthy/Low-Calorie
const healthy: RecipeSeed[] = [
	{
		name: 'Mediterranean Quinoa Bowl',
		description: 'Protein-packed quinoa with chickpeas, cucumber, tomatoes, and lemon-tahini dressing',
		servings: 4,
		prepTime: 10,
		cookTime: 20,
		ingredients: [
			{ name: 'quinoa', quantity: 1, unit: 'cup', category: 'pantry' },
			{ name: 'chickpeas', quantity: 1, unit: 'can', category: 'pantry' },
			{ name: 'cucumber', quantity: 1, unit: 'whole', category: 'produce' },
			{ name: 'cherry tomatoes', quantity: 1, unit: 'cup', category: 'produce' },
			{ name: 'red onion', quantity: 0.25, unit: 'whole', category: 'produce' },
			{ name: 'kalamata olives', quantity: 0.25, unit: 'cup', category: 'pantry' },
			{ name: 'feta cheese', quantity: 0.5, unit: 'cup', category: 'dairy' },
			{ name: 'tahini', quantity: 2, unit: 'tbsp', category: 'pantry' },
			{ name: 'lemon', quantity: 1, unit: 'whole', category: 'produce' },
			{ name: 'fresh parsley', quantity: 0.25, unit: 'cup', category: 'produce' }
		],
		instructions: [
			'Cook quinoa according to package directions. Let cool slightly.',
			'Drain and rinse chickpeas.',
			'Dice cucumber, halve tomatoes, thinly slice red onion.',
			'Whisk tahini, lemon juice, 2 tbsp water, salt, and pepper for dressing.',
			'Combine quinoa, chickpeas, vegetables, and olives.',
			'Drizzle with tahini dressing and top with crumbled feta and parsley.'
		],
		tags: ['healthy', 'mediterranean', 'vegetarian', 'weeknight'],
		nutritionPerServing: { calories: 340, protein: 14, carbs: 42, fat: 14, fiber: 8, sodium: 380 }
	},
	{
		name: 'Thai Chicken Lettuce Wraps',
		description: 'Savory ground chicken in butter lettuce cups with peanut sauce and fresh herbs',
		servings: 4,
		prepTime: 10,
		cookTime: 10,
		ingredients: [
			{ name: 'ground chicken', quantity: 1, unit: 'lb', category: 'meat' },
			{ name: 'butter lettuce', quantity: 1, unit: 'head', category: 'produce' },
			{ name: 'water chestnuts', quantity: 1, unit: 'can', category: 'pantry' },
			{ name: 'green onions', quantity: 4, unit: 'stalks', category: 'produce' },
			{ name: 'soy sauce', quantity: 2, unit: 'tbsp', category: 'pantry' },
			{ name: 'rice vinegar', quantity: 1, unit: 'tbsp', category: 'pantry' },
			{ name: 'sesame oil', quantity: 1, unit: 'tsp', category: 'pantry' },
			{ name: 'peanut butter', quantity: 2, unit: 'tbsp', category: 'pantry' },
			{ name: 'sriracha', quantity: 1, unit: 'tsp', category: 'pantry' },
			{ name: 'fresh mint', quantity: 2, unit: 'tbsp', category: 'produce' },
			{ name: 'fresh cilantro', quantity: 2, unit: 'tbsp', category: 'produce' }
		],
		instructions: [
			'Cook ground chicken in a skillet over medium-high heat, breaking up pieces.',
			'Add diced water chestnuts, soy sauce, rice vinegar, and sesame oil.',
			'Mix peanut butter, sriracha, and 1 tbsp warm water for dipping sauce.',
			'Separate lettuce into cup-shaped leaves.',
			'Spoon chicken mixture into lettuce cups.',
			'Top with green onions, mint, and cilantro. Serve with peanut sauce.'
		],
		tags: ['healthy', 'asian', 'quick', 'low-carb'],
		nutritionPerServing: { calories: 260, protein: 26, carbs: 10, fat: 14, fiber: 2, sodium: 520 }
	},
	{
		name: 'Roasted Cauliflower Soup',
		description: 'Velvety roasted cauliflower soup with nutmeg and crispy shallots',
		servings: 6,
		prepTime: 10,
		cookTime: 35,
		ingredients: [
			{ name: 'cauliflower', quantity: 1, unit: 'large head', category: 'produce' },
			{ name: 'shallots', quantity: 3, unit: 'whole', category: 'produce' },
			{ name: 'garlic', quantity: 4, unit: 'cloves', category: 'produce' },
			{ name: 'vegetable broth', quantity: 4, unit: 'cups', category: 'pantry' },
			{ name: 'olive oil', quantity: 2, unit: 'tbsp', category: 'pantry' },
			{ name: 'nutmeg', quantity: 0.25, unit: 'tsp', category: 'pantry' },
			{ name: 'Greek yogurt', quantity: 0.25, unit: 'cup', category: 'dairy' }
		],
		instructions: [
			'Preheat oven to 425°F.',
			'Cut cauliflower into florets. Toss with olive oil, salt, and pepper.',
			'Roast for 25 minutes until golden brown.',
			'Thinly slice 1 shallot into rings. Fry in olive oil until crispy. Set aside.',
			'Sauté remaining shallots and garlic in a pot until soft.',
			'Add roasted cauliflower and broth. Simmer 10 minutes.',
			'Blend until smooth. Stir in nutmeg and yogurt.',
			'Serve topped with crispy shallots.'
		],
		tags: ['healthy', 'vegetarian', 'low-carb', 'weekend'],
		nutritionPerServing: { calories: 120, protein: 5, carbs: 14, fat: 6, fiber: 4, sodium: 340 }
	},
	{
		name: 'Grilled Chicken Greek Salad',
		description: 'Herb-marinated grilled chicken over a classic Greek salad with oregano vinaigrette',
		servings: 2,
		prepTime: 15,
		cookTime: 12,
		ingredients: [
			{ name: 'chicken breast', quantity: 2, unit: 'pieces', category: 'meat' },
			{ name: 'romaine lettuce', quantity: 1, unit: 'head', category: 'produce' },
			{ name: 'cucumber', quantity: 1, unit: 'whole', category: 'produce' },
			{ name: 'cherry tomatoes', quantity: 1, unit: 'cup', category: 'produce' },
			{ name: 'red onion', quantity: 0.25, unit: 'whole', category: 'produce' },
			{ name: 'kalamata olives', quantity: 0.25, unit: 'cup', category: 'pantry' },
			{ name: 'feta cheese', quantity: 0.25, unit: 'cup', category: 'dairy' },
			{ name: 'red wine vinegar', quantity: 2, unit: 'tbsp', category: 'pantry' },
			{ name: 'dried oregano', quantity: 1, unit: 'tsp', category: 'pantry' },
			{ name: 'olive oil', quantity: 3, unit: 'tbsp', category: 'pantry' },
			{ name: 'lemon', quantity: 0.5, unit: 'whole', category: 'produce' }
		],
		instructions: [
			'Marinate chicken with 1 tbsp olive oil, oregano, lemon juice, salt, pepper for 10 min.',
			'Grill chicken over medium-high heat, 5-6 minutes per side.',
			'Let rest 5 minutes, then slice.',
			'Chop romaine, dice cucumber, halve tomatoes, slice onion.',
			'Whisk remaining olive oil, red wine vinegar, oregano, salt, and pepper.',
			'Assemble salad, top with chicken, olives, and feta. Drizzle with dressing.'
		],
		tags: ['healthy', 'mediterranean', 'quick', 'low-carb'],
		nutritionPerServing: { calories: 380, protein: 40, carbs: 12, fat: 20, fiber: 4, sodium: 520 }
	},
	{
		name: 'Miso Glazed Cod with Bok Choy',
		description: 'Sweet white miso-glazed cod with steamed baby bok choy and brown rice',
		servings: 2,
		prepTime: 10,
		cookTime: 15,
		ingredients: [
			{ name: 'cod fillets', quantity: 2, unit: 'pieces', category: 'seafood' },
			{ name: 'white miso paste', quantity: 2, unit: 'tbsp', category: 'pantry' },
			{ name: 'mirin', quantity: 1, unit: 'tbsp', category: 'pantry' },
			{ name: 'honey', quantity: 1, unit: 'tsp', category: 'pantry' },
			{ name: 'baby bok choy', quantity: 4, unit: 'heads', category: 'produce' },
			{ name: 'brown rice', quantity: 1, unit: 'cup', category: 'pantry' },
			{ name: 'sesame oil', quantity: 1, unit: 'tsp', category: 'pantry' },
			{ name: 'ginger', quantity: 1, unit: 'tsp', category: 'produce' }
		],
		instructions: [
			'Cook brown rice according to package directions.',
			'Mix miso, mirin, and honey. Spread over cod fillets.',
			'Let marinate 5 minutes while oven preheats to 400°F.',
			'Bake cod for 12-15 minutes until flaky.',
			'Meanwhile, halve bok choy and steam 3-4 minutes.',
			'Toss bok choy with sesame oil and grated ginger.',
			'Serve cod over rice with bok choy alongside.'
		],
		tags: ['healthy', 'asian', 'weeknight'],
		nutritionPerServing: { calories: 360, protein: 32, carbs: 44, fat: 6, fiber: 4, sodium: 580 }
	}
]

// 5 Weekend Cooking (longer prep)
const weekend: RecipeSeed[] = [
	{
		name: 'Slow-Braised Short Ribs',
		description: 'Red wine-braised beef short ribs with root vegetables and creamy polenta',
		servings: 6,
		prepTime: 30,
		cookTime: 180,
		ingredients: [
			{ name: 'beef short ribs', quantity: 4, unit: 'lbs', category: 'meat' },
			{ name: 'red wine', quantity: 2, unit: 'cups', category: 'pantry' },
			{ name: 'beef broth', quantity: 2, unit: 'cups', category: 'pantry' },
			{ name: 'carrots', quantity: 3, unit: 'medium', category: 'produce' },
			{ name: 'celery', quantity: 3, unit: 'stalks', category: 'produce' },
			{ name: 'onion', quantity: 1, unit: 'large', category: 'produce' },
			{ name: 'tomato paste', quantity: 2, unit: 'tbsp', category: 'pantry' },
			{ name: 'garlic', quantity: 4, unit: 'cloves', category: 'produce' },
			{ name: 'polenta', quantity: 1, unit: 'cup', category: 'pantry' },
			{ name: 'parmesan cheese', quantity: 0.5, unit: 'cup', category: 'dairy' },
			{ name: 'fresh thyme', quantity: 4, unit: 'sprigs', category: 'produce' },
			{ name: 'bay leaves', quantity: 2, unit: 'pieces', category: 'pantry' }
		],
		instructions: [
			'Preheat oven to 325°F. Season ribs generously with salt and pepper.',
			'Sear ribs in a Dutch oven until browned on all sides, about 3 min per side. Remove.',
			'Sauté diced onion, carrots, and celery for 5 minutes.',
			'Add garlic and tomato paste, cook 1 minute.',
			'Deglaze with red wine, scraping up fond. Reduce by half.',
			'Add broth, thyme, bay leaves, and return ribs to pot.',
			'Cover and braise in oven for 2.5-3 hours until fork-tender.',
			'Cook polenta according to package, stir in parmesan and butter.',
			'Serve ribs over polenta with braising vegetables and sauce.'
		],
		tags: ['weekend', 'american', 'comfort'],
		nutritionPerServing: { calories: 620, protein: 42, carbs: 28, fat: 34, fiber: 3, sodium: 580 }
	},
	{
		name: 'Homemade Ramen',
		description: 'Rich tonkotsu-style broth with chashu pork, soft-boiled eggs, and fresh toppings',
		servings: 4,
		prepTime: 30,
		cookTime: 120,
		ingredients: [
			{ name: 'pork belly', quantity: 1, unit: 'lb', category: 'meat' },
			{ name: 'ramen noodles', quantity: 4, unit: 'portions', category: 'pantry' },
			{ name: 'chicken broth', quantity: 6, unit: 'cups', category: 'pantry' },
			{ name: 'soy sauce', quantity: 4, unit: 'tbsp', category: 'pantry' },
			{ name: 'mirin', quantity: 2, unit: 'tbsp', category: 'pantry' },
			{ name: 'eggs', quantity: 4, unit: 'whole', category: 'dairy' },
			{ name: 'green onions', quantity: 4, unit: 'stalks', category: 'produce' },
			{ name: 'nori sheets', quantity: 4, unit: 'pieces', category: 'pantry' },
			{ name: 'ginger', quantity: 2, unit: 'inches', category: 'produce' },
			{ name: 'garlic', quantity: 4, unit: 'cloves', category: 'produce' },
			{ name: 'sesame oil', quantity: 1, unit: 'tbsp', category: 'pantry' },
			{ name: 'corn', quantity: 1, unit: 'cup', category: 'produce' }
		],
		instructions: [
			'Braise pork belly: sear in a pot, add soy sauce, mirin, ginger, garlic, and water to cover.',
			'Simmer pork belly for 1.5-2 hours until tender. Remove and slice.',
			'Strain braising liquid, reserve as tare (seasoning base).',
			'Soft-boil eggs: boil 6.5 minutes, ice bath, peel. Marinate in tare for 30 min.',
			'Heat chicken broth with sesame oil and 3 tbsp tare. Taste and adjust.',
			'Cook ramen noodles according to package.',
			'Divide noodles into bowls, ladle hot broth over.',
			'Top with sliced chashu, halved eggs, corn, nori, and green onions.'
		],
		tags: ['weekend', 'asian', 'comfort'],
		nutritionPerServing: { calories: 680, protein: 38, carbs: 52, fat: 34, fiber: 3, sodium: 1200 }
	},
	{
		name: 'Lamb Tagine with Apricots',
		description: 'Moroccan-spiced lamb stew with dried apricots, almonds, and couscous',
		servings: 6,
		prepTime: 20,
		cookTime: 120,
		ingredients: [
			{ name: 'lamb shoulder', quantity: 2, unit: 'lbs', category: 'meat' },
			{ name: 'dried apricots', quantity: 0.5, unit: 'cup', category: 'pantry' },
			{ name: 'onion', quantity: 2, unit: 'medium', category: 'produce' },
			{ name: 'cinnamon stick', quantity: 1, unit: 'piece', category: 'pantry' },
			{ name: 'ground cumin', quantity: 1, unit: 'tsp', category: 'pantry' },
			{ name: 'ground coriander', quantity: 1, unit: 'tsp', category: 'pantry' },
			{ name: 'turmeric', quantity: 0.5, unit: 'tsp', category: 'pantry' },
			{ name: 'chickpeas', quantity: 1, unit: 'can', category: 'pantry' },
			{ name: 'chicken broth', quantity: 2, unit: 'cups', category: 'pantry' },
			{ name: 'slivered almonds', quantity: 0.25, unit: 'cup', category: 'pantry' },
			{ name: 'couscous', quantity: 1.5, unit: 'cups', category: 'pantry' },
			{ name: 'fresh cilantro', quantity: 0.25, unit: 'cup', category: 'produce' },
			{ name: 'honey', quantity: 1, unit: 'tbsp', category: 'pantry' }
		],
		instructions: [
			'Cut lamb into 2-inch cubes. Season with spices, salt, and pepper.',
			'Brown lamb in batches in a heavy pot or tagine. Remove.',
			'Sauté onions until golden, about 8 minutes.',
			'Add remaining spices and cook 1 minute until fragrant.',
			'Return lamb, add broth, cinnamon stick, and chickpeas.',
			'Cover and simmer on low for 1.5 hours.',
			'Add apricots and honey, cook 30 more minutes.',
			'Toast almonds in a dry pan.',
			'Prepare couscous according to package.',
			'Serve tagine over couscous, topped with almonds and cilantro.'
		],
		tags: ['weekend', 'mediterranean', 'comfort'],
		nutritionPerServing: { calories: 540, protein: 36, carbs: 48, fat: 22, fiber: 6, sodium: 460 }
	},
	{
		name: 'Fresh Pasta with Bolognese',
		description: 'Handmade tagliatelle with a slow-simmered traditional Bolognese sauce',
		servings: 6,
		prepTime: 45,
		cookTime: 120,
		ingredients: [
			{ name: 'tipo 00 flour', quantity: 3, unit: 'cups', category: 'pantry' },
			{ name: 'eggs', quantity: 4, unit: 'whole', category: 'dairy' },
			{ name: 'ground beef', quantity: 1, unit: 'lb', category: 'meat' },
			{ name: 'ground pork', quantity: 0.5, unit: 'lb', category: 'meat' },
			{ name: 'onion', quantity: 1, unit: 'medium', category: 'produce' },
			{ name: 'carrots', quantity: 2, unit: 'medium', category: 'produce' },
			{ name: 'celery', quantity: 2, unit: 'stalks', category: 'produce' },
			{ name: 'crushed tomatoes', quantity: 28, unit: 'oz', category: 'pantry' },
			{ name: 'whole milk', quantity: 0.5, unit: 'cup', category: 'dairy' },
			{ name: 'dry white wine', quantity: 0.5, unit: 'cup', category: 'pantry' },
			{ name: 'tomato paste', quantity: 2, unit: 'tbsp', category: 'pantry' },
			{ name: 'parmesan cheese', quantity: 0.5, unit: 'cup', category: 'dairy' }
		],
		instructions: [
			'Make pasta: mound flour, create well, add eggs. Mix and knead 10 minutes until smooth.',
			'Wrap dough and rest 30 minutes.',
			'For Bolognese: finely dice onion, carrots, and celery (soffritto).',
			'Brown meats in a heavy pot, breaking up pieces. Remove excess fat.',
			'Add soffritto, cook until soft, about 8 minutes.',
			'Add tomato paste and wine, cook until wine evaporates.',
			'Add crushed tomatoes and milk. Simmer on very low heat for 2 hours, stirring occasionally.',
			'Roll pasta thin and cut into tagliatelle strips.',
			'Cook fresh pasta in salted water for 2-3 minutes.',
			'Toss with Bolognese, serve with grated parmesan.'
		],
		tags: ['weekend', 'italian', 'comfort'],
		nutritionPerServing: { calories: 580, protein: 34, carbs: 52, fat: 24, fiber: 4, sodium: 520 }
	},
	{
		name: 'Korean Bibimbap',
		description: 'Colorful rice bowl with seasoned vegetables, beef bulgogi, fried egg, and gochujang',
		servings: 4,
		prepTime: 30,
		cookTime: 30,
		ingredients: [
			{ name: 'short grain rice', quantity: 2, unit: 'cups', category: 'pantry' },
			{ name: 'beef sirloin', quantity: 1, unit: 'lb', category: 'meat' },
			{ name: 'spinach', quantity: 4, unit: 'cups', category: 'produce' },
			{ name: 'carrots', quantity: 2, unit: 'medium', category: 'produce' },
			{ name: 'zucchini', quantity: 1, unit: 'medium', category: 'produce' },
			{ name: 'bean sprouts', quantity: 1, unit: 'cup', category: 'produce' },
			{ name: 'eggs', quantity: 4, unit: 'whole', category: 'dairy' },
			{ name: 'gochujang', quantity: 3, unit: 'tbsp', category: 'pantry' },
			{ name: 'soy sauce', quantity: 3, unit: 'tbsp', category: 'pantry' },
			{ name: 'sesame oil', quantity: 2, unit: 'tbsp', category: 'pantry' },
			{ name: 'garlic', quantity: 3, unit: 'cloves', category: 'produce' },
			{ name: 'sesame seeds', quantity: 1, unit: 'tbsp', category: 'pantry' }
		],
		instructions: [
			'Cook rice according to package directions.',
			'Slice beef thinly. Marinate in soy sauce, sesame oil, garlic, and sugar for 15 min.',
			'Julienne carrots and zucchini. Sauté each vegetable separately with sesame oil and salt.',
			'Blanch spinach, squeeze dry, season with sesame oil and garlic.',
			'Blanch bean sprouts, season with sesame oil and salt.',
			'Cook marinated beef in a hot skillet until caramelized.',
			'Fry eggs sunny-side up.',
			'Assemble bowls: rice base, arrange vegetables and beef in sections, top with egg.',
			'Serve with gochujang on the side. Mix everything together before eating.'
		],
		tags: ['weekend', 'asian', 'healthy'],
		nutritionPerServing: { calories: 560, protein: 34, carbs: 62, fat: 18, fiber: 5, sodium: 780 }
	}
]

export const recipeSeeds: RecipeSeed[] = [...quickMeals, ...kidFriendly, ...healthy, ...weekend]

// Runner for seeding recipes with AI-generated images
export async function runRecipeSeed() {
	const { Recipe } = await import('../models/Recipe')
	const { generateRecipeImage } = await import('../services/imageGeneration')
	const { uploadImage } = await import('../services/storage')
	
	console.log(`Seeding ${recipeSeeds.length} recipes...`)
	
	for (const seed of recipeSeeds) {
		// Check if recipe already exists
		const existing = await Recipe.findOne({ name: seed.name })
		if (existing) {
			console.log(`Skipping "${seed.name}" — already exists`)
			continue
		}
		
		// Generate image
		console.log(`Generating image for "${seed.name}"...`)
		const imageBuffer = await generateRecipeImage(seed.name, seed.description)
		if (!imageBuffer) {
			console.log(`Skipping "${seed.name}" — image generation failed`)
			continue
		}
		
		// Upload to R2
		const imageId = `recipes/${seed.name.toLowerCase().replace(/\s+/g, '-')}.png`
		const imageUrl = await uploadImage(imageBuffer, imageId, 'image/png')
		
		// Create recipe
		await Recipe.create({
			...seed,
			imageUrl,
			imageId,
			userId: null, // System recipes have no user
			source: 'seed'
		})
		
		console.log(`✓ Created "${seed.name}"`)
	}
	
	console.log('Done seeding recipes!')
}
