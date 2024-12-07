const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const axios = require("axios");
const nodemailer = require("nodemailer");
const { marked } = require("marked");

const API_URL =
  process.env.API_BASE_URL ||
  "https://sheridangray.com/api/v1/food/weekly-meal-plan";

const sendWeeklyMealPlanEmail = async () => {
  try {
    console.log("Starting meal plan generation process...");

    console.log("Fetching meal plan from API...");
    const response = await axios.get(`${API_URL}`);
    const mealPlanMarkdown = response.data.data;
    console.log("Meal plan fetched successfully.");

    console.log(mealPlanMarkdown);

    console.log("Compiling email content...");
    const emailContent = `
      <html>
        <body>
          ${marked.parse(mealPlanMarkdown)}
        </body>
      </html>
    `;
    console.log("Setting up email transporter...");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log("Sending email...");
    await transporter.sendMail({
      from: `"Gray Family Assistant" <${process.env.EMAIL_USER}>`, // Specify sender name and email
      to: process.env.EMAIL_TO,
      subject: "Your Weekly Meal Plan",
      html: emailContent,
    });

    console.log("Weekly meal plan email sent successfully.");
  } catch (error) {
    console.error("Error generating or sending email:", error);
  }
};

const categorizeIngredient = (ingredient) => {
  console.log(`Categorizing ingredient: ${ingredient}`);
  const aisles = {
    Produce: ["zucchini", "bell pepper", "onion", "garlic", "spinach"],
    "Canned & Dry Goods": ["black beans", "corn kernels", "marinara sauce"],
    Dairy: ["cheese", "mozzarella", "parmesan", "ricotta"],
    Staples: ["olive oil", "salt", "pepper", "flour", "breadcrumbs"],
  };

  for (const aisle of Object.keys(aisles)) {
    if (
      aisles[aisle].some((keyword) =>
        ingredient.toLowerCase().includes(keyword)
      )
    ) {
      console.log(`Ingredient categorized under: ${aisle}`);
      return aisle;
    }
  }
  console.log("Ingredient categorized under: Other");
  return "Other";
};

console.log("Initiating sendWeeklyMealPlanEmail...");
sendWeeklyMealPlanEmail();
