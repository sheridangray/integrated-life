exports.getHealth = (req, res) => {
  res.render("health/health", {
    title: "Health",
    category: "Health",
    currentPage: "/health",
    user: req.user,
    showLeftNav: true,
  });
};

exports.getMental = (req, res) => {
  res.render("health/mental", {
    title: "Mental Health",
    category: "Health",
    currentPage: "/health/mental",
    user: req.user,
    showLeftNav: true,
  });
};

exports.getPhysical = (req, res) => {
  res.render("health/physical", {
    title: "Physical Health",
    category: "Health",
    currentPage: "/health/physical",
    user: req.user,
    showLeftNav: true,
  });
};
