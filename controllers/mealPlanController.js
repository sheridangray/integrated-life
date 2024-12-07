const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const Together = require("together-ai");

const together = new Together({
  apiKey: process.env.TOGETHER_API_KEY,
});

// Controller method to generate weekly meal plan

exports.generateWeeklyMealPlan = async (req, res, next) => {
  try {
    const mealPlan = await generateMealPlan();
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

exports.generateWeeklyMealPlan = async (req, res, next) => {
  try {
    const mealPlan = [];

    const prompt = `Provide dinner options for Monday through Friday. 
      About half of the time the recipes should be Mediterranean diet, 25% Chinese, 
      and then an even distribution across the other cusine types.
      The recipe should be quick and efficient for a busy family cooking after work.
      It should be portioned for six. We want leftovers.
      It should prioritize speed and efficiency over complexity. 

      The response should start with a summary of the week, listing out each day, the recipe title, and short description. 
      It should not have any prepended messages before the summary 
      After the summary should should be the grocery list containing all of the ingredients to buy, categorized by grocery aisle. 
      It should break out pantry items the user likely already has such as oil and spices in a separate category.
      After the grocery list should be each recipe with its details. Include the following details:
        Title: A short, catchy name for the dish.
        Short Description: A single sentence summarizing the dish.
        Full Description: A more detailed explanation of the dish and its flavors.
        Prep Time, Cook Time, and Total Time: Specify times in minutes. Each of these should be on their own row for high readability.
        Step-by-Step Instructions: Provide clear, concise steps for preparing and cooking.
        Ingredient List
    `;

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

    // Return the weekly meal plan
    res.status(200).json({
      status: "success",
      data: response.choices[0]?.message?.content,
    });
  } catch (error) {
    console.error("Error generating meal plan:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to generate meal plan",
    });
  }
};
