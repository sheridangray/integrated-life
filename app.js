// CONSTANTS

const path = require("path");
const express = require("express");
const app = express();
const port = process.env.PORT || 3001;
const viewRouter = require("./routes/viewRoutes");

// CONFIG

// Serve static files
app.use(express.static(path.join(__dirname, "/public")));

// Set up template engine
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

const router = express.Router();

// MIDLEWARE

// Set currentPage globally for all templates
app.use((req, res, next) => {
  res.locals.currentPage = req.path;
  next();
});

// ROUTES

// app.get("/", (req, res) => res.type("html").send(html));
app.use("/", viewRouter);

const server = app.listen(port, () =>
  console.log(`Integrated Life is listening on port ${port}!`)
);

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;
