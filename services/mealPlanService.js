const Together = require("together-ai");

const together = new Together({
  apiKey: process.env.TOGETHER_AI_API_KEY,
});

const generateMealPlan = async () => {
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const mealPlan = [];

  for (const day of daysOfWeek) {
    const prompt = `Suggest a meal for dinner on ${day}...`; // Use your detailed prompt here.

    const response = await together.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
      max_tokens: null,
      temperature: 0.7,
      top_p: 0.7,
      top_k: 50,
      repetition_penalty: 1,
      stop: ["<|eot_id|>", "<|eom_id|>"],
      stream: false,
    });

    if (response && response.choices && response.choices[0]?.message?.content) {
      mealPlan.push({
        day,
        recipe: response.choices[0]?.message?.content,
      });
    } else {
      mealPlan.push({ day, recipe: "No recipe found" });
    }
  }
  return mealPlan;
};

module.exports = { generateMealPlan };
