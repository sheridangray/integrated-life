console.log("Loading recipe-list module");

function initRecipeList() {
  // console.log("Initializing recipe list");

  const recipeGrid = document.getElementById("recipe-list");
  const toggleFavoritesBtn = document.getElementById("toggle-favorites");
  const searchInput = document.querySelector(".search-bar__input input");
  const searchClearBtn = document.querySelector(".search-clear-btn");

  if (!recipeGrid) {
    console.log("Recipe grid not found");
    return;
  }

  // console.log("Found recipe grid:", recipeGrid);
  let showingFavorites = false;
  let searchQuery = "";

  // Function to check if a recipe matches the search query
  function recipeMatchesSearch(recipe) {
    if (!searchQuery) return true;

    const searchTerms = searchQuery.toLowerCase().split(" ");
    const recipeText = [
      recipe.querySelector(".recipe-card__title").textContent,
      recipe.querySelector(".recipe-card__description").textContent,
      recipe.querySelector(".recipe-meta").textContent,
    ]
      .join(" ")
      .toLowerCase();

    // Check if all search terms are found in the recipe text
    return searchTerms.every((term) => recipeText.includes(term));
  }

  // Function to update recipe visibility based on current filters
  function updateRecipeVisibility() {
    const recipes = recipeGrid.querySelectorAll(".recipe-card-wrapper");
    recipes.forEach((recipe) => {
      const isFavorite = recipe
        .querySelector(".favorite-button")
        .classList.contains("active");
      const matchesSearch = recipeMatchesSearch(recipe);

      const shouldShow = (!showingFavorites || isFavorite) && matchesSearch;

      recipe.style.display = shouldShow ? "flex" : "none";
    });
  }

  // Function to update search clear button visibility
  function updateSearchClearButton() {
    if (searchClearBtn) {
      searchClearBtn.classList.toggle("hidden", !searchQuery);
    }
  }

  // Function to clear search
  function clearSearch() {
    if (searchInput) {
      searchInput.value = "";
      searchQuery = "";
      updateSearchClearButton();
      updateRecipeVisibility();
    }
  }

  // Handle search input
  if (searchInput) {
    // Debounce function to limit how often the search is performed
    function debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }

    // Handle search input with debouncing
    searchInput.addEventListener(
      "input",
      debounce((e) => {
        searchQuery = e.target.value.trim();
        updateSearchClearButton();
        updateRecipeVisibility();
      }, 300)
    );

    // Handle clear button click
    if (searchClearBtn) {
      searchClearBtn.addEventListener("click", clearSearch);
    }

    // Handle escape key to clear search
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        clearSearch();
      }
    });
  }

  // Handle individual recipe favorite toggling
  recipeGrid.addEventListener("click", async (e) => {
    const favoriteBtn = e.target.closest(".favorite-button");
    if (!favoriteBtn) return;

    console.log("Favorite button clicked");
    e.preventDefault();
    e.stopPropagation();

    const recipeCard = favoriteBtn.closest(".recipe-card-wrapper");
    const recipeId = recipeCard.dataset.recipeId;
    console.log("Recipe ID:", recipeId);

    try {
      // Get CSRF token from meta tag
      const csrfToken = document.querySelector(
        'meta[name="csrf-token"]'
      ).content;
      console.log("CSRF Token:", csrfToken);

      console.log("Sending favorite toggle request...");
      const response = await fetch(`/food/recipes/${recipeId}/favorite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CSRF-Token": csrfToken,
          "X-CSRF-Token": csrfToken,
        },
        credentials: "same-origin",
      });

      console.log("Response status:", response.status);
      if (!response.ok) throw new Error("Failed to toggle favorite");

      const data = await response.json();
      console.log("Response data:", data);

      // Update UI
      favoriteBtn.classList.toggle("active");
      const icon = favoriteBtn.querySelector(".material-icons");
      icon.textContent = data.isFavorite ? "favorite" : "favorite_border";

      // Update visibility based on current filters
      updateRecipeVisibility();
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  });

  // Handle favorites filter toggle
  if (toggleFavoritesBtn) {
    toggleFavoritesBtn.addEventListener("click", () => {
      console.log("Toggle favorites filter clicked");
      showingFavorites = !showingFavorites;
      toggleFavoritesBtn.classList.toggle("active");
      updateRecipeVisibility();
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initRecipeList);
} else {
  initRecipeList();
}

export default initRecipeList;
