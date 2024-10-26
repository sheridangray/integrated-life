const searchInput = document.getElementById("search-input");
if (searchInput) {
  searchInput.addEventListener("input", debounce(handleSearch, 300));
}

const addIngredientButton = document.getElementById("add-ingredient-button");
if (addIngredientButton) {
  addIngredientButton.addEventListener("click", addIngredient());
}

function debounce(func, wait) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    const later = function () {
      timeout = null;
      func.apply(context, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function handleSearch() {
  const query = searchInput.value;
  fetch(`/api/v1/food/ingredients/search?query=${query}`, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((parsedData) => {
      const ingredientTableBody = document.getElementById(
        "ingredient-table-body"
      );

      // Clear the existing contents of the tbody
      while (ingredientTableBody.firstChild) {
        ingredientTableBody.removeChild(ingredientTableBody.firstChild);
      }

      // Initialize the index variable and class name
      let rowIndex = 0;
      let rowClass = "row-even";

      // Add the new data to the tbody with alternating odd/even classes
      parsedData.data.forEach((ingredient) => {
        // Create a new row
        const row = document.createElement("tr");

        // Add the appropriate row class
        row.className = rowClass;

        // Toggle between "row-even" and "row-odd" for the next row
        rowClass = rowClass === "row-even" ? "row-odd" : "row-even";

        // Create and populate the table cells
        const nameCell = document.createElement("td");
        nameCell.textContent = ingredient.ingredientName;
        const descriptionCell = document.createElement("td");
        descriptionCell.textContent = ingredient.description;
        const aisleCell = document.createElement("td");
        aisleCell.textContent = ingredient.groceryStoreAisle;

        // Append the cells to the row and the row to the tbody
        row.appendChild(nameCell);
        row.appendChild(descriptionCell);
        row.appendChild(aisleCell);
        ingredientTableBody.appendChild(row);

        // Increment the index for the next row
        rowIndex++;
      });

      // Update the pagination values
      const pagination = document.getElementById("pagination");
      const paginationMessage = document.querySelector("#pagination p"); // Get the paragraph element
      const recordStart =
        parsedData.data.length > 0 ? (page - 1) * limit + 1 : 0;
      const recordEnd = recordStart + parsedData.data.length - 1;
      const recordTotal = parsedData.estimatedTotal;
      const newPaginationMessage = `Showing ${recordStart} - ${recordEnd} of ${recordTotal} filtered records`;
      paginationMessage.textContent = newPaginationMessage; // Update the text content
    })
    .catch((error) => {
      console.error(error);
    });
}

function addIngredient() {
  console.log("Clicked addIngredient()");

  // Get form data
  var ingredientName = document.getElementById("ingredient-name").value;
  var description = document.getElementById("ingredient-description").value;
  var groceryAisle = document.getElementById("grocery-aisle").value;

  // Validate form data (add your validation logic here)

  // Save data to the Ingredient table (replace this with your actual logic)
  saveToIngredientTable(ingredientName, description, groceryAisle);

  // Close the modal or perform any other actions
  hideModel();
}

function saveToIngredientTable(ingredientName, description, groceryAisle) {
  // Create a new instance of the Ingredient model
  const newIngredient = new Ingredient({
    ingredientName: ingredientName,
    description: description,
    groceryStoreAisle: groceryAisle,
  });

  // Save the new ingredient to the database
  newIngredient
    .save()
    .then((savedIngredient) => {
      console.log("Ingredient saved:", savedIngredient);
      // Add the new ingredient to your ingredients array (if needed)
      ingredients.push(savedIngredient);

      // Update the table (replace this with your actual logic)
      updateIngredientTable();
    })
    .catch((error) => {
      console.error("Error saving ingredient:", error);
      // Handle the error as needed
    });
}
