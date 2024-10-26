const express = require("express");
const ingredientController = require("../../controllers/ingredientController");

const router = express.Router();

router.get("/ingredients", ingredientController.getAllIngredients);
router.route("/ingredients").post(ingredientController.createIngredient);
router.get("/ingredients/search", ingredientController.searchIngredients);
router.get(
  "/ingredients/grocery-aisles",
  ingredientController.getGroceryAisles
);

module.exports = router;
