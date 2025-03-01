const mongoose = require("mongoose");
const slugify = require("slugify");
const { Schema } = require("mongoose");

const recipeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "A recipe must have a name"],
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  shortDescription: {
    type: String,
    required: [true, "A recipe must have a short description"],
  },
  fullDescription: {
    type: String,
    required: [true, "A recipe must have a full description"],
  },
  prepTime: {
    type: Number,
    required: [true, "A recipe must have a prep time"],
  },
  cookTime: {
    type: Number,
    required: [true, "A recipe must have a cook time"],
  },
  totalTime: {
    type: Number,
    required: [true, "A recipe must have a total time"],
  },
  cuisine: {
    type: String,
    required: [true, "A recipe must have a cuisine type"],
    enum: [
      "Mediterranean",
      "Chinese",
      "Italian",
      "Mexican",
      "Indian",
      "Japanese",
      "Thai",
      "Vietnamese",
      "French",
      "Greek",
      "Spanish",
      "Korean",
      "Middle Eastern",
      "American",
    ],
  },
  instructions: [
    {
      instructionStep: {
        type: Number,
        required: [true, "Each instruction must have a step number"],
      },
      instruction: {
        type: String,
        required: [true, "Each instruction must have a description"],
        trim: true,
      },
    },
  ],
  ingredients: [
    {
      item: {
        type: String,
        required: [true, "An ingredient must have a name"],
      },
      quantity: {
        type: Number,
        required: [true, "An ingredient must have a quantity"],
      },
      unit: {
        type: String,
        required: [true, "An ingredient must have a unit"],
        enum: [
          "g", // grams
          "kg", // kilograms
          "oz", // ounces
          "lb", // pounds
          "ml", // milliliters
          "l", // liters
          "tsp", // teaspoon
          "tbsp", // tablespoon
          "cup", // cup
          "piece", // whole pieces
          "pinch", // pinch
          "", // empty for items like "to taste"
        ],
      },
      notes: {
        type: String,
        default: "",
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  nutrition: {
    servingSize: {
      type: Number,
      required: [true, "Please specify serving size"],
    },
    servingUnit: {
      type: String,
      required: [true, "Please specify serving unit"],
      enum: ["g", "ml", "oz", "cup", "piece"],
    },
    servings: {
      type: Number,
      required: [true, "Please specify number of servings"],
    },
    // Macronutrients (per serving)
    macros: {
      calories: {
        type: Number,
        required: [true, "Please specify calories per serving"],
      },
      protein: {
        type: Number,
        required: [true, "Please specify protein content"],
      },
      carbohydrates: {
        type: Number,
        required: [true, "Please specify carbohydrate content"],
      },
      fat: {
        type: Number,
        required: [true, "Please specify fat content"],
      },
      fiber: {
        type: Number,
        required: [true, "Please specify fiber content"],
      },
      sugar: {
        type: Number,
        default: 0,
      },
    },
    // Micronutrients (per serving)
    micros: {
      vitaminA: { type: Number },
      vitaminC: { type: Number },
      vitaminD: { type: Number },
      vitaminE: { type: Number },
      vitaminK: { type: Number },
      thiamin: { type: Number },
      riboflavin: { type: Number },
      niacin: { type: Number },
      vitaminB6: { type: Number },
      folate: { type: Number },
      vitaminB12: { type: Number },
      calcium: { type: Number },
      iron: { type: Number },
      magnesium: { type: Number },
      potassium: { type: Number },
      sodium: { type: Number },
      zinc: { type: Number },
    },
  },
  images: {
    featured: {
      url: String,
      key: String,
      altText: String,
    },
    gallery: [
      {
        url: String,
        key: String,
        altText: String,
        caption: String,
      },
    ],
  },
  favoritedBy: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

// Add pre-save middleware to generate slug
recipeSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Add a virtual property to check if a specific user has favorited the recipe
recipeSchema.virtual("isFavorite").get(function () {
  if (!this._userId) return false; // _userId will be set in the route handler
  return this.favoritedBy.includes(this._userId);
});

// Helper method to toggle favorite status for a user
recipeSchema.methods.toggleFavorite = async function (userId) {
  const index = this.favoritedBy.indexOf(userId);
  if (index === -1) {
    this.favoritedBy.push(userId);
  } else {
    this.favoritedBy.splice(index, 1);
  }
  await this.save();
  return this.favoritedBy.includes(userId);
};

const Recipe = mongoose.model("Recipe", recipeSchema);

module.exports = Recipe;
