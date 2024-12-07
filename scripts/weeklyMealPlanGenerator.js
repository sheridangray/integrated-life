require("dotenv").config();
const axios = require("axios");

// Assuming that your meal planner API is accessible at `/api/v1/food/weekly-meal-plan`
const API_URL =
  process.env.API_BASE_URL ||
  "https://sheridangray.com/api/v1/food/weekly-meal-plan";

const generateWeeklyMealPlan = async () => {
  try {
    const response = await axios.get(`${API_URL}`);
    console.log("Weekly Meal Plan Generated:", response.data);
  } catch (error) {
    console.error("Error generating weekly meal plan:", error);
  }
};

generateWeeklyMealPlan();
