const Together = require("together-ai");
const cleanAndParseJSON = require("../utils/cleanAndParseJSON");

const together = new Together({
  apiKey: process.env.TOGETHER_API_KEY,
});

exports.createCompletion = async (
  prompt,
  model = "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
  temperature = 0.7,
  max_tokens = 2000
) => {
  const response = await together.chat.completions.create({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    model,
    temperature,
    max_tokens,
  });

  return response.choices[0].message.content;
};
