const express = require("express");
const router = express.Router();
const healthController = require("../../controllers/client/healthController");

router.get("/", healthController.getHealth);
// Add other health-related routes here
// router.get('/mental', healthController.getMental);
// router.get('/physical', healthController.getPhysical);

module.exports = router;
