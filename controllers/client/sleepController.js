exports.getSleep = (req, res) => {
  res.render("sleep/sleep", {
    title: "Sleep",
    category: "Sleep",
    currentPage: "/sleep",
    user: req.user,
    showLeftNav: true,
  });
};
