const express = require("express");
const router = express.Router();
const userRouter = require("./userRouter");
const foodRouter = require("./foodRouter");

console.log("Instantiating API Router");

router.use("/v1/users", userRouter);
router.use("/v1/food", foodRouter);

module.exports = router;
