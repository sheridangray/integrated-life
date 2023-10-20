exports.getHome = async (req, res) => {
  res.status(200).render("home", {
    title: "Home",
  });
};

exports.getTime = async (req, res) => {
  res.status(200).render("time/time", {
    title: "Time",
  });
};

exports.getFood = async (req, res) => {
  res.status(200).render("food/food", {
    title: "Food",
  });
};

exports.getMoney = async (req, res) => {
  res.status(200).render("money/money", {
    title: "Money",
  });
};

exports.getRelationships = async (req, res) => {
  res.status(200).render("relationships/relationships", {
    title: "Relationships",
  });
};

exports.getHealth = async (req, res) => {
  res.status(200).render("health/health", {
    title: "Health",
  });
};

exports.getLogin = (req, res) => {
  res.status(200).render("user/login", {
    title: "Login",
  });
};
