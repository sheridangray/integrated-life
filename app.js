// app.js

// Define constants and load environment variables
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const path = require("path");
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const csurf = require("csurf");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const { getBundlePath } = require("./utils/assetHelpers");
const app = express();

const port = process.env.PORT || 3000;
const globalErrorHandler = require("./controllers/errorController");
const clientRouter = require("./routes/client/clientRouter");
const apiRouter = require("./routes/api/apiRouter");

// Custom Middleware
const layoutMiddleware = require("./middleware/layoutMiddleware");
const navigationMiddleware = require("./middleware/navigationMiddleware");
const authCheckMiddleware = require("./middleware/authCheckMiddleware");

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.log("Uncaught Exception! Shutting down...");
  console.log(err);
  process.exit(1);
});

// Connect to the database
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);
mongoose.connect(DB, {}).then(() => {
  console.log(`DB connection successful.`);
});

// Serve static files
app.use(express.static(path.join(__dirname, "/public")));

// Basic Middleware
app.use(cookieParser());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Set up Helmet with custom CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://accounts.google.com/gsi/client",
          "https://apis.google.com",
          "https://*.googleusercontent.com",
          "https://www.google.com",
          "https://*.gstatic.com",
          "https://*.google.com",
        ],
        scriptSrcElem: [
          "'self'",
          "https://accounts.google.com",
          "https://apis.google.com",
          "https://*.googleusercontent.com",
          "https://www.google.com",
          "https://*.gstatic.com",
          "https://*.google.com",
        ],
        connectSrc: [
          "'self'",
          "https://accounts.google.com/gsi/",
          "https://*.google.com",
          "https://www.googleapis.com",
        ],
        frameSrc: [
          "'self'",
          "https://accounts.google.com/gsi/",
          "https://*.google.com",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https://*.google.com",
          "https://*.googleusercontent.com",
          "https://*.gstatic.com",
          "https://storage.googleapis.com",
          "https://integrated-life-recipe-images.s3.us-east-2.amazonaws.com",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://accounts.google.com/gsi/style",
          "https://*.google.com",
          "https://fonts.googleapis.com",
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
      },
    },
  })
);

// // Set Cross-Origin-Opener-Policy header
// app.use((req, res, next) => {
//   res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
//   next();
// });

// CORS middleware
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://sheridangray.com"
        : "http://localhost:3000",
    credentials: true,
  })
);

// Add Cross-Origin-Opener-Policy header
app.use((req, res, next) => {
  // When using Google Sign-In, we need to allow popups
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

// Add this before your routes. This is to prevent the referrer policy from being set to no-referrer-when-downgrade for local development.
app.use((req, res, next) => {
  res.setHeader("Referrer-Policy", "no-referrer-when-downgrade");
  next();
});

// Initialize CSRF Protection
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
});

// Middleware to assign csrfToken to EJS templates
app.use((req, res, next) => {
  csrfProtection(req, res, () => {
    res.locals.csrfToken = req.csrfToken();
    next();
  });
});

// Set up template engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layouts/main");
app.set("layout extractScripts", true);
app.set("layout extractStyles", true);

// Global Variables Middleware
app.use((req, res, next) => {
  res.locals.currentPage = req.path;
  res.locals.user = req.user || null;
  res.locals.nonce = Buffer.from(crypto.randomBytes(16)).toString("base64");
  app.locals.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  res.locals.getBundlePath = getBundlePath;
  next();
});

// Layout Middleware
app.use(layoutMiddleware);

// Apply CSRF protection globally except for specific routes
app.use((req, res, next) => {
  // Log the request details
  console.log("Request path:", req.path);
  console.log("Request method:", req.method);
  console.log("Session:", req.session);
  console.log("User:", req.user);

  // Skip CSRF for specific routes
  if (req.path.startsWith("/api/v1/users/google-login")) {
    console.log("Skipping CSRF for:", req.path);
    next();
  } else {
    csrfProtection(req, res, (err) => {
      if (err) {
        console.error("CSRF Error:", err);
        console.error("Session:", req.session);
        console.error("Headers:", req.headers);

        // If it's an AJAX request or form submission
        if (
          req.xhr ||
          req.headers["content-type"]?.includes("multipart/form-data")
        ) {
          return res.status(403).json({
            error: "CSRF token validation failed",
            message: "Please refresh the page and try again",
          });
        }

        // For regular requests
        return res.status(403).render("error", {
          error: "Session expired. Please try again.",
          title: "Error",
          category: "Error",
          currentPage: req.path,
          user: null,
          showLeftNav: false,
        });
      }
      res.locals.csrfToken = req.csrfToken();
      next();
    });
  }
});

// Apply rate limiting to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again after 15 minutes.",
});
app.use(limiter);

// Initialize Routes
app.use("/api", apiRouter);
app.use("/", clientRouter);

// Handle React routing in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "client/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client/build", "index.html"));
  });
}

// Error Handling Middleware
app.use(globalErrorHandler);

// Apply middleware before your routes
app.use(navigationMiddleware);

// Apply Authentication Check Middleware Before Routes
app.use(authCheckMiddleware);

// Error Handling Middleware
app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    return res.status(403).send("Form tampered with.");
  }
  console.error(err);
  res.status(500).send("Internal Server Error");
});

// Add session logging middleware
app.use((req, res, next) => {
  console.log("Session ID:", req.sessionID);
  console.log("User:", req.user ? "Logged in" : "Not logged in");
  console.log("CSRF Token present:", !!req.csrfToken);
  next();
});

// Begin listening for HTTP requests
const server = app.listen(port, () =>
  console.log(`Integrated Life is listening at http://localhost:${port}!`)
);

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;
