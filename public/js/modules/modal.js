// Function to show the modal
function showModal() {
  const modal = document.getElementById("add-ingredient-modal");
  modal.style.display = "block";
}

// Function to close the modal
function closeModal() {
  const modal = document.getElementById("add-ingredient-modal");
  modal.style.display = "none";
}

// Open the modal when the "Add Ingredient" button is clicked
const addIngredientButton = document.querySelector("#add-ingredient-button");
addIngredientButton.addEventListener("click", showModal);

// Close the modal when the "Cancel" button is clicked
const cancelButton = document.querySelector("#cancel-button");
cancelButton.addEventListener("click", closeModal);

// Close the modal when clicking outside of it
const modal = document.getElementById("add-ingredient-modal");
modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

// Prevent clicks inside the modal from closing it
const modalContent = document.querySelector(".modal-content");
modalContent.addEventListener("click", (event) => {
  event.stopPropagation();
});
