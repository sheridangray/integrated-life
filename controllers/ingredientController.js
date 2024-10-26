const Ingredient = require("../models/ingredient");
const catchAsync = require("../utils/catchAsync");
const APIFeatures = require("../utils/apiFeatures");
const factory = require("./handleFactory");

exports.searchIngredients = catchAsync(async (req, res, next) => {
  const { query } = req.query;

  const filter = {
    $or: [
      { ingredientName: { $regex: query, $options: "i" } }, // Case-insensitive search in name
      { description: { $regex: query, $options: "i" } }, // Case-insensitive search in description
      { groceryStoreAisle: { $regex: query, $options: "i" } }, // Case-insensitive search in description
    ],
  };

  const estimatedTotal = await Ingredient.find(filter).estimatedDocumentCount();
  const doc = await Ingredient.find(filter);

  res.status(200).json({
    status: "success",
    requestedAt: req.requestTime,
    results: doc.length,
    estimatedTotal: estimatedTotal,
    data: doc,
  });
});

exports.getAllIngredients = catchAsync(async (req, res, next) => {
  const page = req.query.page * 1 || 1; // Convert page to a number
  const limit = req.query.limit * 1 || 10; // Convert limit to a number
  const skip = (page - 1) * limit; // Calculate the number of documents to skip

  const estimatedTotal = await Ingredient.find().estimatedDocumentCount();

  // Query for ingredients with pagination
  const filter = {}; // Define any additional filters here
  const query = Ingredient.find(filter).skip(skip).limit(limit);

  const doc = await query;

  res.status(200).json({
    status: "success",
    requestedAt: req.requestTime,
    results: doc.length,
    estimatedTotal: estimatedTotal,
    data: {
      data: doc,
    },
  });
});

exports.getGroceryAisles = catchAsync(async (req, res, next) => {
  // Use the distinct method to get unique grocery aisles
  const distinctAisles = await Ingredient.distinct("groceryStoreAisle");

  res.status(200).json({
    status: "success",
    requestedAt: req.requestTime,
    results: distinctAisles.length,
    data: {
      groceryAisles: distinctAisles,
    },
  });
});

exports.getIngredient = factory.getOne(Ingredient);

exports.createIngredient = catchAsync(async (req, res, next) => {
  console.log("ingredientController.js createIngredient()");

  console.log("handleFactory.js createOne()");
  const doc = await Ingredient.create(req.body);
  res.status(201).json({
    status: "success",
    data: {
      data: doc,
    },
  });
});

exports.updateIngredient = factory.updateOne(Ingredient);
exports.deleteIngredient = factory.deleteOne(Ingredient);
