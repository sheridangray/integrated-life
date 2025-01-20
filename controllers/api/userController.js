const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const User = require("../../models/User"); // Adjust the path as necessary

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Handles Google Login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.googleLogin = async (req, res) => {
  const { credential } = req.body;

  try {
    if (!credential) {
      return res.status(400).json({ message: "Credential is required." });
    }

    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    if (!email) {
      return res
        .status(400)
        .json({ message: "Email not found in Google response." });
    }

    // Check if the user already exists
    let user = await User.findOne({ googleId: sub });

    if (!user) {
      // If user doesn't exist, create a new one
      user = new User({
        googleId: sub,
        email,
        name,
        profilePicture: picture, // Assuming you have this field
        // Add other fields as necessary
      });

      await user.save();
    }

    // Generate JWT Token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Set the token in an httpOnly cookie
    res.cookie("authToken", token, {
      httpOnly: true, // Prevents JavaScript access
      secure: process.env.NODE_ENV === "production", // Ensures the cookie is sent over HTTPS
      sameSite: "Strict", // Mitigates CSRF
      maxAge: 3600000, // 1 hour in milliseconds
    });

    // Optionally, send a success response
    res.status(200).json({ message: "Login successful." });
  } catch (error) {
    console.error("Error in googleLogin:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

/**
 * Handles User Logout
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.logout = (req, res) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });
  res.status(200).json({ message: "Logout successful." });
};
