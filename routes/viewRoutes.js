const express = require("express");
const viewController = require("../controllers/viewsController");

const router = express.Router();

router.get(
  "/",
  // authController.isLoggedIn,
  viewController.getHome
);

module.exports = router;
