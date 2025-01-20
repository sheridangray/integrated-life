exports.getMoney = (req, res) => {
  res.render("money/money", {
    title: "Money Management",
    category: "Money",
    currentPage: "/money",
    user: req.user,
    showLeftNav: true,
  });
};
