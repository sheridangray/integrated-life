exports.getHome = async (req, res) => {
  res.status(200).render("home", {
    title: "Home",
  });
};
