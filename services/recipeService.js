const Together = require("together-ai");
const Recipe = require("../models/recipe");
const cleanAndParseJSON = require("../utils/cleanAndParseJSON");
const standardizeUnit = require("../utils/standardizeUnit");
const AppError = require("../utils/appError");
const together = require("./togetherClient");
const { uploadToS3, deleteFromS3 } = require("../config/aws");

exports.generateRecipeDetails = async (name) => {
  const recipePrompt = `Create a detailed recipe for "${name}". 
  The cuisine MUST be one of: Mediterranean, Chinese, Italian, Mexican, Indian, Japanese, Thai, Vietnamese, French, Greek, Spanish, Korean, Middle Eastern, American.
  Return a JSON object using ONLY these units: piece, tsp, tbsp, cup, oz, lb, g, kg, ml, l, pinch.
  For items like garlic cloves, use "piece" as the unit.
  Use decimal numbers (0.5) instead of fractions (1/2).
  Set the number of servings to 6 to feed a family.
  Required format:
  {
    "shortDescription": "A brief description",
    "fullDescription": "Detailed instructions",
    "prepTime": 30,
    "cookTime": 45,
    "totalTime": 75,
    "cuisine": "Italian",
    "instructions": [
      {
        "instructionStep": 1,
        "instruction": "Step description"
      }
    ],
    "ingredients": [
      {
        "item": "ingredient name",
        "quantity": 0.5,
        "unit": "cup"
      }
    ],
    "nutrition": {
      "servingSize": 100,
      "servingUnit": "g",
      "servings": 4,
      "macros": {
        "calories": 350,
        "protein": 12,
        "carbohydrates": 45,
        "fat": 14,
        "fiber": 3,
        "sugar": 5
      },
      "micros": {
        "vitaminA": 1000,
        "vitaminC": 60,
        "vitaminD": 400,
        "vitaminE": 15,
        "vitaminK": 80,
        "thiamin": 1.2,
        "riboflavin": 1.3,
        "niacin": 16,
        "vitaminB6": 1.7,
        "folate": 400,
        "vitaminB12": 2.4,
        "calcium": 1000,
        "iron": 18,
        "magnesium": 400,
        "potassium": 3500,
        "sodium": 2300,
        "zinc": 11
      }
    }
  }`;

  const recipeResponse = await together.chat.completions.create({
    messages: [
      {
        role: "user",
        content: recipePrompt,
      },
    ],
    model: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
    temperature: 0.7,
    max_tokens: 2000,
  });

  const recipeDetails = cleanAndParseJSON(
    recipeResponse.choices[0].message.content
  );

  // Additional validation can be performed here if needed

  // Standardize units
  if (recipeDetails.ingredients) {
    recipeDetails.ingredients = recipeDetails.ingredients.map((ingredient) => ({
      ...ingredient,
      unit: standardizeUnit(ingredient.unit),
    }));
  }

  return recipeDetails;
};

exports.createRecipe = async (name, files, recipeDetails) => {
  // console.log("Creating recipe with name:", name);
  // console.log("Files:", files);
  // console.log("Recipe details:", recipeDetails);
  try {
    let featuredImageData = null;
    let galleryImagesData = [];

    // Upload featured image if provided
    if (files?.featuredImage) {
      featuredImageData = await uploadToS3(files.featuredImage);
    }

    // Upload gallery images if provided
    if (files?.gallery && files.gallery.length > 0) {
      for (const image of files.gallery) {
        const imageData = await uploadToS3(image);
        galleryImagesData.push(imageData);
      }
    }

    // Create recipe with image data
    const recipe = new Recipe({
      name,
      ...recipeDetails,
      images: {
        featured: featuredImageData
          ? {
              url: featuredImageData.url,
              key: featuredImageData.key,
              altText: name,
            }
          : null,
        gallery: galleryImagesData.map((img) => ({
          url: img.url,
          key: img.key,
          altText: `Step image for ${name}`,
          caption: "",
        })),
      },
    });

    await recipe.save();
    return recipe;
  } catch (error) {
    console.error("Error in createRecipe:", error);
    throw error;
  }
};

exports.getRecipeBySlug = async (slug) => {
  const recipe = await Recipe.findOne({ slug });
  if (!recipe) {
    throw new AppError("No recipe found with that slug", 404);
  }
  return recipe;
};

exports.updateRecipe = async (id, recipeData, files) => {
  try {
    const recipe = await Recipe.findById(id);

    if (!recipe) {
      throw new Error("Recipe not found");
    }

    if (files?.featured) {
      // Delete old image if it exists
      if (recipe.images?.featured?.key) {
        await deleteFromS3(recipe.images.featured.key);
      }

      const imageData = await uploadToS3(files.featured[0]);
      recipe.images = {
        featured: {
          url: imageData.url,
          key: imageData.key,
          altText: recipeData.name,
        },
      };
    }

    Object.assign(recipe, recipeData);
    await recipe.save();
    return recipe;
  } catch (error) {
    console.error("Error updating recipe:", error);
    throw error;
  }
};

// Add cleanup for recipe deletion
exports.deleteRecipe = async (id) => {
  try {
    const recipe = await Recipe.findById(id);
    if (!recipe) throw new Error("Recipe not found");

    // Delete images from S3
    if (recipe.images?.featured?.key) {
      await deleteFromS3(recipe.images.featured.key);
    }

    if (recipe.images?.gallery?.length > 0) {
      for (const image of recipe.images.gallery) {
        if (image.key) {
          await deleteFromS3(image.key);
        }
      }
    }

    await Recipe.findByIdAndDelete(id);
  } catch (error) {
    console.error("Error in deleteRecipe:", error);
    throw error;
  }
};

exports.toggleFavorite = async (recipeId, userId) => {
  const recipe = await Recipe.findById(recipeId);
  if (!recipe) {
    throw new Error("Recipe not found");
  }

  const index = recipe.favoritedBy.indexOf(userId);
  if (index === -1) {
    recipe.favoritedBy.push(userId);
  } else {
    recipe.favoritedBy.splice(index, 1);
  }

  await recipe.save();
  return {
    isFavorite: recipe.favoritedBy.includes(userId),
  };
};

exports.getAllRecipes = async (userId = null) => {
  const recipes = await Recipe.find({}).populate("favoritedBy", "_id").lean();

  if (userId) {
    // Add isFavorite field to each recipe
    return recipes.map((recipe) => ({
      ...recipe,
      isFavorite:
        recipe.favoritedBy?.some(
          (user) => user._id.toString() === userId.toString()
        ) || false,
    }));
  }

  return recipes;
};
