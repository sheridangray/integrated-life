const express = require("express");
const userRouter = require("./userRouter");
const foodRouter = require("./foodRouter");

const router = express.Router();
console.log("instantiating api Router");
router.use("/v1/users", userRouter);
router.use("/v1/food", foodRouter);

module.exports = router;
