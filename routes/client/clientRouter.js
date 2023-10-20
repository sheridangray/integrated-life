const express = require("express");
const viewController = require("../../controllers/viewsController");
const authController = require("../../controllers/authController");

const router = express.Router();

// Check of user is logged in for all pages.

router.use(authController.isLoggedIn);

// Unprotected Page Routes

router.get("/", viewController.getHome);
router.get("/login", viewController.getLogin);
router.get("/logout", authController.logout);

// Protect all routes after this middleware

// router.use(authController.protect);

// Protected Page Routes

router.get("/time", viewController.getTime);
router.get("/food", viewController.getFood);
router.get("/money", viewController.getMoney);
router.get("/relationships", viewController.getRelationships);
router.get("/health", viewController.getHealth);

module.exports = router;
