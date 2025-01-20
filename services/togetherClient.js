const Together = require("together-ai");
const AppError = require("../utils/appError");

if (!process.env.TOGETHER_API_KEY) {
  throw new AppError(
    "The TOGETHER_API_KEY environment variable is missing or empty.",
    500
  );
}

const together = new Together({
  apiKey: process.env.TOGETHER_API_KEY,
});

module.exports = together;
