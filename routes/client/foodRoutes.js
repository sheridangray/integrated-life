const express = require("express");
const router = express.Router();
const foodController = require("../../controllers/client/foodController");
const { upload } = require("../../middleware/uploadMiddleware");
const authController = require("../../controllers/api/authController");

router.get("/", foodController.getFood);

// Recipe routes
router.get("/recipes", foodController.getAllRecipes);
router.get("/recipes/new", foodController.getNewRecipeForm);
router.get("/recipes/:slug", foodController.getRecipeBySlug);
router.post(
  "/recipes/:id/favorite",
  authController.protect,
  foodController.toggleRecipeFavorite
);

router.post(
  "/recipes",
  authController.protect,
  upload.fields([
    { name: "featureImage", maxCount: 1 },
    { name: "stepImages", maxCount: 10 },
  ]),
  foodController.createRecipe
);

// Add other food-related routes here

module.exports = router;
