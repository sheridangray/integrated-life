const express = require("express");
const viewController = require("../../controllers/viewsController");

const router = express.Router();

router.get("/", viewController.getHome);
router.get("/time", viewController.getTime);
router.get("/food", viewController.getFood);
router.get("/money", viewController.getMoney);
router.get("/relationships", viewController.getRelationships);
router.get("/health", viewController.getHealth);

module.exports = router;
