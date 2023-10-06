// Define constants

const dotenv = require("dotenv");
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const port = process.env.PORT || 3000;
const clientRouter = require("./routes/client/clientRouter");
const apiRouter = require("./routes/api/apiRouter");

// Handle uncaught exceptions

process.on("uncaughtException", (err) => {
  console.log("Uncaught Exception! Shutting down...");
  console.log(err);
  process.exit(1);
});

// Load the configuration file

dotenv.config({ path: "./config.env" });

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

// Set up template engine

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// Use Middleware

// Set currentPage globally for all templates
app.use((req, res, next) => {
  res.locals.currentPage = req.path;
  next();
});

// Initize Routes

app.use("/api", apiRouter);
app.use("/", clientRouter);

// Begin listening for HTTP requests

const server = app.listen(port, () =>
  console.log(`Integrated Life is listening on port ${port}!`)
);

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;
