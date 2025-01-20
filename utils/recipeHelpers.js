function decimalToFraction(decimal) {
  if (decimal === undefined || decimal === null) return "";
  if (Number.isInteger(decimal)) return decimal;

  const fractions = {
    0.25: "¼",
    0.5: "½",
    0.75: "¾",
    0.33: "⅓",
    0.67: "⅔",
    0.2: "⅕",
    0.4: "⅖",
    0.6: "⅗",
    0.8: "⅘",
    0.125: "⅛",
    0.375: "⅜",
    0.625: "⅝",
    0.875: "⅞",
  };

  if (fractions[decimal]) {
    return fractions[decimal];
  }

  const wholePart = Math.floor(decimal);
  const decimalPart = decimal - wholePart;

  if (fractions[decimalPart]) {
    return wholePart === 0
      ? fractions[decimalPart]
      : `${wholePart}${fractions[decimalPart]}`;
  }

  return decimal;
}

module.exports = {
  decimalToFraction,
};
