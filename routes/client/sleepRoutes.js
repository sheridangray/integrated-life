const express = require("express");
const router = express.Router();
const sleepController = require("../../controllers/client/sleepController");

router.get("/", sleepController.getSleep);

module.exports = router;
