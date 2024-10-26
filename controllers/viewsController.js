const Ingredient = require("../models/ingredient");
const catchAsync = require("../utils/catchAsync");

exports.getHome = async (req, res) => {
  res.status(200).render("home", {
    title: "Home",
  });
};

exports.getTime = async (req, res) => {
  res.status(200).render("time/time", {
    title: "Time",
  });
};

exports.getFood = async (req, res) => {
  res.status(200).render("food/food", {
    category: "Food",
    title: "Food",
  });
};

exports.getFoodLearn = async (req, res) => {
  res.status(200).render("food/learn", {
    category: "Food",
    title: "Learn",
  });
};

exports.getIngredients = catchAsync(async (req, res, next) => {
  const page = req.query.page * 1 || 1; // Convert page to a number
  const limit = req.query.limit * 1 || 10; // Convert limit to a number
  const skip = (page - 1) * limit; // Calculate the number of documents to skip

  // Query for ingredients with pagination
  const filter = {}; // Define any additional filters here
  const estimatedTotal = await Ingredient.find(filter).estimatedDocumentCount();
  const query = Ingredient.find(filter).skip(skip).limit(limit);
  const ingredients = await query;

  const distinctAisles = await Ingredient.distinct("groceryStoreAisle");

  res.status(200).render("food/ingredients", {
    category: "Food",
    title: "Ingredients",
    limit: limit,
    skip: skip,
    resultsCount: ingredients.length,
    estimatedTotal: estimatedTotal,
    ingredients: ingredients,
    distinctAisles: distinctAisles,
  });
});

exports.getRecipes = async (req, res) => {
  res.status(200).render("food/recipes", {
    category: "Food",
    title: "Recipes",
  });
};

exports.getMealPlanner = async (req, res) => {
  res.status(200).render("food/meal-planner", {
    category: "Food",
    title: "Meal Planner",
  });
};

exports.getGroceryList = async (req, res) => {
  res.status(200).render("food/grocery-list", {
    category: "Food",
    title: "Grocery List",
  });
};

exports.getMoney = async (req, res) => {
  res.status(200).render("money/money", {
    title: "Money",
  });
};

exports.getRelationships = async (req, res) => {
  res.status(200).render("relationships/relationships", {
    title: "Relationships",
  });
};

exports.getHealth = async (req, res) => {
  res.status(200).render("health/health", {
    title: "Health",
  });
};

exports.getLogin = (req, res) => {
  res.status(200).render("user/login", {
    title: "Login",
  });
};
