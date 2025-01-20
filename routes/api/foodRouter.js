const express = require("express");
const ingredientController = require("../../controllers/api/ingredientController");
const mealPlanController = require("../../controllers/api/mealPlanController");
const recipeController = require("../../controllers/api/recipeController");
const multer = require("multer");

const router = express.Router();

// Recipe routes
router
  .route("/recipes")
  .get(recipeController.getAllRecipes)
  .post(recipeController.createRecipe);

router
  .route("/recipes/:id")
  .get(recipeController.getRecipe)
  .patch(recipeController.updateRecipe)
  .delete(recipeController.deleteRecipe);

router.get("/recipes/slug/:slug", recipeController.getRecipeBySlug);

// Ingredient routes
router.get("/ingredients", ingredientController.getAllIngredients);
router.get("/ingredients/search", ingredientController.searchIngredients);
router.get(
  "/ingredients/grocery-aisles",
  ingredientController.getGroceryAisles
);
router.post("/ingredients", ingredientController.createIngredient);

router
  .route("/ingredients/:id")
  .get(ingredientController.getIngredient)
  .patch(ingredientController.updateIngredient)
  .delete(ingredientController.deleteIngredient);

// Meal Plan routes
router.get("/weekly-meal-plan", mealPlanController.generateWeeklyMealPlan);

module.exports = router;
