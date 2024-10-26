const mongoose = require("mongoose");
const validator = require("validator");

const ingredientSchema = new mongoose.Schema({
  ingredientName: {
    type: String,
    required: true,
    trim: true,
  },
  photo: {
    type: String,
    // You can add validation specific to photos, e.g., URL validation
    validate: {
      validator: (value) => validator.isURL(value),
      message: "Invalid photo URL",
    },
  },
  description: {
    type: String,
    required: true,
  },
  groceryStoreAisle: {
    type: String,
    required: true,
  },
  fnddsIngredient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FNDDSIngredients",
    required: false,
  },
});

const Ingredient = mongoose.model("Ingredient", ingredientSchema);

module.exports = Ingredient;
