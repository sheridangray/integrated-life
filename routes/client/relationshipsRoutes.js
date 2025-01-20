const express = require("express");
const router = express.Router();
const relationshipsController = require("../../controllers/client/relationshipsController");

router.get("/", relationshipsController.getRelationships);
// Add other relationship-related routes here
// router.get('/family', relationshipsController.getFamily);
// router.get('/friends', relationshipsController.getFriends);
// router.get('/professional', relationshipsController.getProfessional);

module.exports = router;
