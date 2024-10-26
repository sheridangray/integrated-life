const mongoose = require("mongoose");

const fnddsIngredientSchema = new mongoose.Schema({
  foodCode: {
    type: String,
    required: true,
  },
  mainFoodDescription: {
    type: String,
    required: true,
  },
  wweiaCategoryNumber: {
    type: String,
    required: true,
  },
  wweiaCategoryDescription: {
    type: String,
    required: true,
  },
  seqNum: {
    type: Number,
    required: true,
  },
  ingredientCode: {
    type: String,
    required: true,
  },
  ingredientDescription: {
    type: String,
    required: true,
  },
  ingredientWeight: {
    type: Number,
    required: true,
  },
  retentionCode: {
    type: Number,
    required: true,
  },
  moistureChange: {
    type: Number,
    required: true,
  },
});

const FNDDSIngredient = mongoose.model(
  "FNDDSIngredient",
  fnddsIngredientSchema
);

module.exports = FNDDSIngredient;
