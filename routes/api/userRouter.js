const express = require("express");
const userController = require("../../controllers/client/userController");
const authController = require("../../controllers/api/authController");

const router = express.Router();

router.post("/google-login", authController.googleLogin);
router.post("/logout", authController.logout);

// Protect all routes after this middleware
router.use(authController.protect);

router.patch("/updateMyPassword", authController.updatePassword);
router.get("/me", userController.getMe, userController.getUser);
router.patch(
  "/updateMe",
  userController.userPhotoUpload,
  userController.updateMe
);
router.delete("/deleteMe", userController.deleteMe);

// Restrict to admin for all routes after this middleware
router.use(authController.restrictTo("admin"));

router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
