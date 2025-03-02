const catchAsync = require("../../utils/catchAsync");
const factory = require("./handleFactory");
const Recipe = require("../../models/recipe");

// Use the factory methods for CRUD operations
exports.getAllRecipes = factory.getAll(Recipe);
exports.getRecipe = factory.getOne(Recipe);
exports.createRecipe = factory.createOne(Recipe);
exports.updateRecipe = factory.updateOne(Recipe);
exports.deleteRecipe = factory.deleteOne(Recipe);

// Custom method for slug-based lookup
exports.getRecipeBySlug = catchAsync(async (req, res, next) => {
  const recipe = await Recipe.findOne({ slug: req.params.slug });

  if (!recipe) {
    return next(new AppError("No recipe found with that slug", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      recipe,
    },
  });
});
