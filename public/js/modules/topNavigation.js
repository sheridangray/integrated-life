// Toggle the User Menu

const userPhoto = document.querySelector(".user-photo");
const userMenu = document.querySelector(".user-menu");
const mobileNavigationMenu = document.querySelector(".mobile-navigation");

if (userPhoto) {
  let isMenuOpen = false; // Initial State

  userPhoto.addEventListener("click", function () {
    if (isMenuOpen) {
      userMenu.classList.remove("show");
      mobileNavigationMenu.classList.remove("show");
    } else {
      userMenu.classList.add("show");
      mobileNavigationMenu.classList.add("show");
    }

    // Toggle the state
    isMenuOpen = !isMenuOpen;

    // Prevent the click event from propagating to the document
    event.stopPropagation();
  });

  // Add a click event listener to the document to close the user menu when clicking outside
  document.addEventListener("click", function () {
    if (isMenuOpen) {
      userMenu.classList.remove("show");
      mobileNavigationMenu.classList.remove("show");
      isMenuOpen = false; // Update the state
    }
  });
}
