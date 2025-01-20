exports.getTime = (req, res) => {
  res.render("time/time", {
    title: "Time Management",
    category: "Time",
    currentPage: "/time",
    user: req.user,
  });
};
