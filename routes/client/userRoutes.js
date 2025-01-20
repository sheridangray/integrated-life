const express = require("express");
const router = express.Router();
const userController = require("../../controllers/client/userController");
// const authController = require("../../controllers/api/authController");

router.get("/login", userController.getLoginForm);
// router.get("/signup", userController.getSignupForm);
// router.get("/account", authController.protect, userController.getAccount);

module.exports = router;
