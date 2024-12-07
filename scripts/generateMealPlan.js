const Together = require("together-ai");
const dotenv = require("dotenv");
const sendEmail = require("../utils/email");

// Load environment variables
dotenv.config();

const together = new Together({ apiKey: process.env.TOGETHER_API_KEY });

const userPreferences = {
  diet: "omnivore",
  numberOfMeals: 5,
  allergies: [],
  cuisine: [
    "chinese",
    "filipino",
    "french",
    "german",
    "greek",
    "indian",
    "japanese",
    "korean",
    "mexican",
    "russian",
    "spanish",
    "thai",
    "vietnamese",
  ],
};

const generateMealPlanAndSendEmail = async () => {
  try {
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const mealPlan = [];

    for (const day of daysOfWeek) {
      // Randomly select cuisine type: No weight provided.
      const randomCuisine =
        userPreferences.cuisine[
          Math.floor(Math.random() * userPreferences.cuisine.length)
        ];

      // Randomly select diet type: 70% meat, 30% vegetarian
      const randomDiet = Math.random() < 0.7 ? "meat" : "vegetarian";

      // Construct the prompt based on whether allergies exist
      const allergiesPart =
        userPreferences.allergies.length > 0
          ? `It should not include the following allergens ${userPreferences.allergies.join(
              ", "
            )}`
          : "";

      const prompt = `
				Suggest a ${randomDiet} dinner for ${day}.
				The meal should be a ${randomCuisine} dish.
				${allergiesPart}
				Include preparation and cook time and aim for a total time of less than 45 minutes.
				Include a list of ingredients.
				Include step-by-step cooking instructions.
				Include nutritional information.
				It should be for 4 people and would ideally have some leftovers for lunch the next day.
			`;

      const response = await together.completions.create({
        prompt: prompt,
        model: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
        max_tokens: 400,
        temperature: 0.7,
        top_p: 0.7,
        top_k: 50,
        repetition_penalty: 1,
        stop: ["<|eot_id|>", "<|eom_id|>"],
        stream: false,
      });

      if (response && response.choices && response.choices[0]?.text) {
        mealPlan.push({
          day: day,
          recipe: response.choices[0].text,
        });
      } else {
        mealPlan.push({
          day: day,
          recipe: "No recipe found",
        });
      }
    }

    // Send email with meal plan
    const emailBody = mealPlan
      .map((meal) => `<b>${meal.day}:</b> <br> ${meal.recipe}<br><br>`)
      .join("");

    await sendEmail({
      email: process.env.USER_EMAIL,
      subject: "Your Weekly Meal Plan",
      html: emailBody,
    });

    console.log("Weekly meal plan sent successfully!");
  } catch (error) {
    console.error("Error generating meal plan:", error);
  }
};

// Execute the function
generateMealPlanAndSendEmail();
