const express = require("express");
const router = express.Router();
const timeController = require("../../controllers/client/timeController");

router.get("/", timeController.getTime);

// Add other time-related routes here
// router.get('/calendar', timeController.getCalendar);
// router.get('/tasks', timeController.getTasks);
// router.get('/goals', timeController.getGoals);

module.exports = router;
