const Ingredient = require("../../models/ingredient");
const factory = require("./handleFactory");
const catchAsync = require("../../utils/catchAsync");

exports.getAllIngredients = catchAsync(async (req, res, next) => {
  const ingredients = await Ingredient.find();

  res.status(200).json({
    status: "success",
    results: ingredients.length,
    data: {
      ingredients,
    },
  });
});

exports.searchIngredients = catchAsync(async (req, res, next) => {
  const { query } = req.query;
  const ingredients = await Ingredient.find({
    name: { $regex: query, $options: "i" },
  });

  res.status(200).json({
    status: "success",
    results: ingredients.length,
    data: {
      ingredients,
    },
  });
});

exports.getGroceryAisles = catchAsync(async (req, res, next) => {
  const distinctAisles = await Ingredient.distinct("groceryStoreAisle");

  res.status(200).json({
    status: "success",
    results: distinctAisles.length,
    data: {
      groceryAisles: distinctAisles,
    },
  });
});

exports.createIngredient = factory.createOne(Ingredient);
exports.getIngredient = factory.getOne(Ingredient);
exports.updateIngredient = factory.updateOne(Ingredient);
exports.deleteIngredient = factory.deleteOne(Ingredient);
