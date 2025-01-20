const standardizeUnit = (unit) => {
  const unitMap = {
    "": "piece",
    slices: "piece",
    slice: "piece",
    medium: "piece",
    large: "piece",
    small: "piece",
    whole: "piece",
    clove: "piece",
    cloves: "piece",
    teaspoon: "tsp",
    teaspoons: "tsp",
    tablespoon: "tbsp",
    tablespoons: "tbsp",
    cup: "cup",
    cups: "cup",
    ounce: "oz",
    ounces: "oz",
    pound: "lb",
    pounds: "lb",
    gram: "g",
    grams: "g",
    kilogram: "kg",
    kilograms: "kg",
    milliliter: "ml",
    milliliters: "ml",
    liter: "l",
    liters: "l",
    piece: "piece",
    pieces: "piece",
    pinch: "pinch",
    pinches: "pinch",
  };

  const lowercaseUnit = unit?.toLowerCase().trim() || "";
  return unitMap[lowercaseUnit] || "piece";
};

module.exports = standardizeUnit;
