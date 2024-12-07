const Together = require("together-ai");

const together = new Together({
  apiKey: "cfcd67ba6ea7f771b747ca1e9ecd2feaec1e51174bc9c731f8cad7c3a220ec21",
});

// Placeholder for user preferences
const userPreferences = {
  diet: "vegetarian", // User-specific dietary preference
  numberOfMeals: 5, // Number of dinner meals for the week
  allergies: ["nuts"], // Allergies to consider while generating meals
  cuisine: ["italian", "mexican"], // Preferred cuisines
};

// Controller method to generate weekly meal plan
exports.generateWeeklyMealPlan = async (req, res, next) => {
  try {
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const mealPlan = [];

    for (const day of daysOfWeek) {
      const prompt = `Suggest a vegetarian dinner for ${day} without nuts. The meal should preferably be italian, mexican. Include preparation time and ingredients.`;

      const response = await together.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
        max_tokens: null,
        temperature: 0.7,
        top_p: 0.7,
        top_k: 50,
        repetition_penalty: 1,
        stop: ["<|eot_id|>", "<|eom_id|>"],
        stream: false, // Set to true if you want to stream tokens
      });

      if (
        response &&
        response.choices &&
        response.choices[0]?.message?.content
      ) {
        const content = response.choices[0]?.message?.content;
        mealPlan.push({
          day: day,
          recipe: content, // You might need to parse content if it includes the recipe, prep time, etc.
        });
      } else {
        mealPlan.push({
          day: day,
          recipe: "No recipe found",
        });
      }
    }

    // Return the weekly meal plan
    res.status(200).json({
      status: "success",
      data: mealPlan,
    });
  } catch (error) {
    console.error("Error generating meal plan:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to generate meal plan",
    });
  }
};
