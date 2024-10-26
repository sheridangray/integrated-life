const express = require("express");
const viewController = require("../../controllers/viewsController");
const authController = require("../../controllers/authController");

const router = express.Router();

// Check of user is logged in for all pages.

router.use(authController.isLoggedIn);

// Unprotected Page Routes

router.get("/", viewController.getHome);
router.get("/login", viewController.getLogin);
router.get("/logout", authController.logout);

// Protect all routes after this middleware

// router.use(authController.protect);

// Protected Page Routes

router.get("/time", viewController.getTime);
router.get("/food", viewController.getFood);
router.get("/food/learn", viewController.getFoodLearn);
router.get("/food/ingredients", viewController.getIngredients);
router.get("/food/recipes", viewController.getRecipes);
router.get("/food/meal_planner", viewController.getMealPlanner);
router.get("/food/grocery-list", viewController.getGroceryList);
router.get("/money", viewController.getMoney);
router.get("/relationships", viewController.getRelationships);
router.get("/health", viewController.getHealth);

module.exports = router;
