exports.getRelationships = (req, res) => {
  res.render("relationships/relationships", {
    title: "Relationships",
    category: "Relationships",
    currentPage: "/relationships",
    user: req.user,
    showLeftNav: true,
  });
};
