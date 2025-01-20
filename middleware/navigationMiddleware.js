const navigationMiddleware = (req, res, next) => {
  // Set currentPage based on the current route
  res.locals.currentPage = req.path;

  // Set showLeftNav based on the route (true for main sections)
  const mainSections = [
    "time",
    "food",
    "money",
    "health",
    "sleep",
    "relationships",
  ];
  const section = req.path.split("/")[1];
  res.locals.showLeftNav = mainSections.includes(section);

  next();
};

module.exports = navigationMiddleware;
