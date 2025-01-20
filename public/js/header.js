document.addEventListener("DOMContentLoaded", () => {
  const userMenuButton = document.getElementById("userMenuButton");

  if (userMenuButton) {
    userMenuButton.addEventListener("click", function () {
      const dropdown = document.getElementById("userDropdown");
      if (dropdown.style.display === "block") {
        dropdown.style.display = "none";
        console.log("Menu closed");
      } else {
        dropdown.style.display = "block";
        console.log("Menu opened");
      }
    });

    // Close the dropdown if the user clicks outside of it
    window.onclick = function (event) {
      if (!event.target.matches("#userMenuButton")) {
        const dropdowns = document.getElementsByClassName("dropdown-menu");
        for (let i = 0; i < dropdowns.length; i++) {
          const openDropdown = dropdowns[i];
          if (openDropdown.style.display === "block") {
            openDropdown.style.display = "none";
            console.log("Menu closed");
          }
        }
      }
    };
  }
});
