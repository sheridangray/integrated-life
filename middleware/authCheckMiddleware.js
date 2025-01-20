const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

/**
 * Middleware to check if a user is authenticated.
 * If authenticated, attaches user data to res.locals.user.
 */
const authCheckMiddleware = async (req, res, next) => {
  console.log("Auth Check Middleware");
  const token = req.cookies.authToken;
  console.log("Token:", token);

  if (!token) {
    // No token found; proceed without attaching user
    res.locals.user = null;
    return next();
  }

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from the database
    const user = await User.findById(decoded.userId).select("-password -__v");

    if (user) {
      // Attach user data to res.locals for EJS templates
      console.log("User:", user);
      res.locals.user = user;
    } else {
      // User not found; clear the invalid token
      console.log("User not found");
      res.clearCookie("authToken");
      res.locals.user = null;
    }

    next();
  } catch (error) {
    console.error("Authentication Middleware Error:", error);
    // Token verification failed; clear the invalid token
    res.clearCookie("authToken");
    res.locals.user = null;
    next();
  }
};

module.exports = authCheckMiddleware;
