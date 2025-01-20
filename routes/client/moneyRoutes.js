const express = require("express");
const router = express.Router();
const moneyController = require("../../controllers/client/moneyController");

router.get("/", moneyController.getMoney);
// Add other money-related routes here
// router.get('/dashboard', moneyController.getDashboard);
// router.get('/accounts', moneyController.getAccounts);
// router.get('/transactions', moneyController.getTransactions);

module.exports = router;
