const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../../models/userModel");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const sendEmail = require("../../utils/email");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  console.log("Creating and sending token");
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;

  // console.log("createSendToken User:", user);

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.logout = (req, res) => {
  res.cookie("jwt", "logged_out", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.redirect("/");
};

exports.protect = catchAsync(async (req, res, next) => {
  console.log("This page is protected.");
  let token;

  // 1. Get the token and check if it exists
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    console.log("No token found.");
    return next(new AppError("You are not logged in.", 401));
  }

  try {
    // 2. Verify the token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    console.log("Token decoded:", decoded);

    // 3. Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      console.log("User not found.");
      return next(
        new AppError("The user belonging to this token no longer exists.", 401)
      );
    }

    // 4. Check if user changed password after token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      console.log("User changed password after token was issued.");
      return next(
        new AppError("User recently changed password. Please log in again", 401)
      );
    }

    // 5. Grant access to user
    // console.log("User authenticated:", currentUser);
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  } catch (err) {
    console.error("Error during token verification:", err);
    return next(new AppError("Authentication failed.", 401));
  }
});

// Only for rendered pages, no errors
exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      // 1. Verify the token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2. Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        console.log("There is no user.");

        return next();
      }

      // 3. Check if user changed password after token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        console.log("The user changed their password.");
        return next();
      }

      // 4. There is a logged in user
      res.locals.user = currentUser;
      return next();
    }
  } catch {
    console.log("Try failed and catching error.");
    return next();
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError(
        `There is not user with email address ${req.body.email}`,
        404
      )
    );
  }

  // 2. Generage the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3. Send it to the user's email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to ${resetURL}.\nIf you didn't forget your password, please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 minutes)",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Token sent to email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "There was an error sending the email. Please try again later."
      ),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1. Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2. If token has not expired and user exists
  if (!user) {
    return next(new AppError("Token is invalid or has expired"), 400);
  }
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3. Update passwordChangedAt

  // 4. Log user in and send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. Get user from collection
  const user = await User.findById(req.user.id).select("+password");

  // 2. Check if POSTed currentPassword is correct
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError("Your current password is wrong", 401));
  }

  // 3. Update password and confirmPassword
  user.password = req.body.newPassword;
  user.confirmPassword = req.body.confirmNewPassword;

  await user.save();

  // 4. Log user in and send JWT
  createSendToken(user, 200, res);
});

exports.googleLogin = async (req, res) => {
  try {
    console.log("Received request body:", req.body);
    const { credential } = req.body;

    if (!credential) {
      throw new Error("No credential received from Google");
    }

    console.log(
      "Attempting to verify token:",
      credential.substring(0, 20) + "..."
    );

    // Verify the token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    console.log("Token payload:", payload);

    // Find or create user
    let user = await User.findOne({ email: payload.email });
    console.log("MongoDB User:", user);

    if (!user) {
      // Create new user
      user = await User.create({
        name: payload.name,
        email: payload.email,
        googleId: payload.sub,
        avatar: payload.picture, // Google profile picture URL
      });
    }

    // Create and send JWT token
    createSendToken(user, 200, res);
  } catch (err) {
    console.error("Google login error details:", {
      message: err.message,
      body: req.body,
      hasCredential: !!req.body.credential,
    });
    res.status(400).json({
      status: "fail",
      message: "Failed to authenticate with Google",
    });
  }
};
