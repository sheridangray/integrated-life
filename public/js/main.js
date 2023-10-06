// document.addEventListener("DOMContentLoaded", function () {
//   const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
//   const navigationMenu = document.getElementsByClassName("navigation");
//   const mobileNavigationMenu =
//     document.getElementsByClassName("mobile-navigation");

//   let isMenuOpen = false; // Initial state

//   console.log("Top Navigation Action clicked.");

//   mobileMenuToggle.addEventListener("click", function () {
//     if (isMenuOpen) {
//       // If the menu is open, change to "menu"
//       mobileMenuToggle.textContent = "menu";
//       navigationMenu.style.display = "none";

//     } else {
//       // If the menu is closed, change to "close"
//       mobileMenuToggle.textContent = "close";
//       navigationMenu.style.display = "block";

//     }

//     // Toggle the state
//     isMenuOpen = !isMenuOpen;
//   });
// });

document.addEventListener("DOMContentLoaded", function () {
  const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
  const navigationMenu = document.querySelector(".navigation");
  const mobileNavigationMenu = document.querySelector(".mobile-navigation");

  let isMenuOpen = false; // Initial state

  mobileMenuToggle.addEventListener("click", function () {
    if (isMenuOpen) {
      // If the menu is open, change to "menu" and hide mobileNavigationMenu
      mobileMenuToggle.textContent = "menu";
      mobileNavigationMenu.classList.remove("show");
    } else {
      // If the menu is closed, change to "close" and show mobileNavigationMenu
      mobileMenuToggle.textContent = "close";
      mobileNavigationMenu.classList.add("show");
    }

    // Toggle the state
    isMenuOpen = !isMenuOpen;
  });
});
