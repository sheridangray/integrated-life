const catchAsync = require("../../utils/catchAsync");
const {
  generateWeeklyMealPlan,
} = require("../../services/weeklyMealPlanService");

// API endpoint for generating meal plan data
exports.generateWeeklyMealPlan = catchAsync(async (req, res, next) => {
  try {
    const mealPlan = await generateWeeklyMealPlan();
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
});
