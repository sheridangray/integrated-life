document.addEventListener("DOMContentLoaded", () => {
  const fileUpload = document.querySelector(".file-upload");

  if (!fileUpload) {
    return;
  }

  const fileInput = document.querySelector(".file-upload__input");
  const fileLabel = document.querySelector(".file-upload__label span");
  const defaultText = fileLabel
    ? fileLabel.textContent
    : "Choose a photo or drag it here";

  if (!fileUpload || !fileInput || !fileLabel) {
    console.warn("File upload elements not found.");
    return;
  }

  // Update filename when file is selected
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      const fileName = fileInput.files[0].name;
      fileLabel.textContent = fileName;
    } else {
      fileLabel.textContent = defaultText;
    }
  });

  // Drag and drop functionality
  fileUpload.addEventListener("dragover", (e) => {
    e.preventDefault();
    fileUpload.classList.add("dragover");
  });

  fileUpload.addEventListener("dragleave", () => {
    fileUpload.classList.remove("dragover");
  });

  fileUpload.addEventListener("drop", (e) => {
    e.preventDefault();
    fileUpload.classList.remove("dragover");
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      fileInput.files = files;
      fileLabel.textContent = files[0].name;
    }
  });
});
