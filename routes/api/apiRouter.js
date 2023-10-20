const express = require("express");
const userRouter = require("./userRouter");

const router = express.Router();

router.use("/v1/users", userRouter);

module.exports = router;
