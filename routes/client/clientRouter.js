const express = require("express");
const router = express.Router();

console.log("Instantiating Client Router");

// Import controllers
const homeController = require("../../controllers/client/homeController");
const authController = require("../../controllers/api/authController");

// Import route modules
const userRoutes = require("./userRoutes");
const timeRoutes = require("./timeRoutes");
const foodRoutes = require("./foodRoutes");
const moneyRoutes = require("./moneyRoutes");
const relationshipsRoutes = require("./relationshipsRoutes");
const healthRoutes = require("./healthRoutes");
const sleepRoutes = require("./sleepRoutes");

// Public routes

router.get("/login", authController.googleLogin);

// Protect all routes after this middleware
router.use(authController.protect);

router.get("/", homeController.getHomePage);
router.use("/profile", userRoutes);
router.use("/time", timeRoutes);
router.use("/food", foodRoutes);
router.use("/money", moneyRoutes);
router.use("/relationships", relationshipsRoutes);
router.use("/health", healthRoutes);
router.use("/sleep", sleepRoutes);

module.exports = router;
