const AppError = require("./appError");

const convertFractionToDecimal = (value) => {
  if (typeof value === "string" && value.includes("/")) {
    const [numerator, denominator] = value.split("/").map(Number);
    return numerator / denominator;
  }
  return value;
};

const cleanAndParseJSON = (jsonString) => {
  try {
    console.log("Raw content:", jsonString);

    // First, try to extract JSON from the raw content
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON object found in string");
    }

    // Get the matched JSON string
    let cleanJson = jsonMatch[0];
    console.log("Extracted JSON string:", cleanJson);

    // Remove any potential markdown code block syntax
    cleanJson = cleanJson.replace(/```json\s*|\s*```/g, "");

    // Handle potential line breaks and irregular spacing
    cleanJson = cleanJson.replace(/\n\s*/g, " ").trim();

    // Convert fractions to decimals in the JSON string
    cleanJson = cleanJson.replace(
      /"quantity":\s*(\d+\/\d+)/g,
      (match, fraction) => {
        const decimal = convertFractionToDecimal(fraction);
        return `"quantity": ${decimal}`;
      }
    );

    // Handle any escaped quotes
    cleanJson = cleanJson.replace(/\\"/g, '"');

    // Remove any double spaces
    cleanJson = cleanJson.replace(/\s+/g, " ");

    try {
      // Parse the cleaned JSON
      const parsedJson = JSON.parse(cleanJson);

      // Convert any remaining fractions in nested objects
      const convertNestedFractions = (obj) => {
        if (typeof obj !== "object" || obj === null) return obj;

        Object.keys(obj).forEach((key) => {
          if (typeof obj[key] === "string" && obj[key].includes("/")) {
            obj[key] = convertFractionToDecimal(obj[key]);
          } else if (typeof obj[key] === "object") {
            convertNestedFractions(obj[key]);
          }
        });

        return obj;
      };

      return convertNestedFractions(parsedJson);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      throw new Error(`JSON parsing failed: ${parseError.message}`);
    }
  } catch (error) {
    console.error("Error in cleanAndParseJSON:", error);
    throw new AppError("Failed to parse LLM response", 400);
  }
};

module.exports = cleanAndParseJSON;
