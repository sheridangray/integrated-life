const express = require("express");
const ingredientController = require("../../controllers/ingredientController");
const mealPlanController = require("../../controllers/mealPlanController");

const router = express.Router();

// Endpoints for Ingredients
router.get("/ingredients", ingredientController.getAllIngredients);
router.route("/ingredients").post(ingredientController.createIngredient);
router.get("/ingredients/search", ingredientController.searchIngredients);
router.get(
  "/ingredients/grocery-aisles",
  ingredientController.getGroceryAisles
);

// Endpoint for generating a weekly meal plan
router.get("/weekly-meal-plan", mealPlanController.generateWeeklyMealPlan);

module.exports = router;
