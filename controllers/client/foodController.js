const Recipe = require("../../models/recipe");
const recipeService = require("../../services/recipeService");
const recipeHelpers = require("../../utils/recipeHelpers");

exports.getFood = (req, res) => {
  res.render("food/food", {
    title: "Food",
    category: "Food",
    currentPage: "/food",
    user: req.user,
    showLeftNav: true,
  });
};

exports.getAllRecipes = async (req, res) => {
  try {
    // Get recipes from the database using your Recipe model
    const recipes = await Recipe.find();

    res.render("food/recipe-list", {
      title: "Recipes",
      recipes: recipes,
      mainContentPadded: true,
    });
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).render("error", {
      title: "Error",
      message: "Failed to load recipes",
    });
  }
};

exports.getNewRecipeForm = (req, res) => {
  res.render("food/recipe-new", {
    title: "New Recipe",
    category: "Food",
    currentPage: "/food/recipes/new",
    user: req.user,
    showLeftNav: true,
  });
};

exports.getRecipeBySlug = async (req, res) => {
  try {
    const recipe = await recipeService.getRecipeBySlug(req.params.slug);

    res.render("food/recipe-detail", {
      title: recipe.name,
      category: "Food",
      currentPage: "/food/recipes",
      user: req.user,
      showLeftNav: true,
      recipe: recipe,
      decimalToFraction: recipeHelpers.decimalToFraction,
    });
  } catch (error) {
    console.error("Error fetching recipe:", error);
    res.status(404).render("error", {
      title: "Recipe Not Found",
      message: "The recipe you're looking for doesn't exist",
      user: req.user,
    });
  }
};

exports.createRecipe = async (req, res) => {
  console.log("Creating recipe (client side)");
  try {
    const name = req.body.name;

    // Debug file uploads
    console.log("Uploaded files:", req.files);

    // Get the uploaded files
    const files = {
      featuredImage: req.files?.featureImage?.[0]
        ? req.files.featureImage[0] // Pass the whole file object to the service
        : undefined,
      gallery: req.files?.stepImages
        ? req.files.stepImages // Pass the array of files
        : undefined,
    };

    console.log("Processed files:", files);

    // Generate recipe details using AI
    const recipeDetails = await recipeService.generateRecipeDetails(name);

    // Create the recipe using the service
    const recipe = await recipeService.createRecipe(name, files, recipeDetails);

    res.redirect(`/food/recipes/${recipe.slug}`);
  } catch (error) {
    console.error("Error creating recipe:", error);
    // Log the full error object for debugging
    console.log("Full error:", JSON.stringify(error, null, 2));

    res.status(500).render("food/recipe-new", {
      title: "New Recipe",
      category: "Food",
      currentPage: "/food/recipes/new",
      user: req.user,
      showLeftNav: true,
      error: error.message,
    });
  }
};
