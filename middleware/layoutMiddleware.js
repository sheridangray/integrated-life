const determineLayout = (req, res, next) => {
  // Default to showing left nav
  res.locals.showLeftNav = true;

  // List of paths that shouldn't show left nav
  const noNavPaths = ["/", "/login", "/register"];

  if (noNavPaths.includes(req.path)) {
    res.locals.showLeftNav = false;
  }

  next();
};

module.exports = determineLayout;
