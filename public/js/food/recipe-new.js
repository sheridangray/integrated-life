document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("recipeForm");

  if (!form) {
    console.warn("Recipe form not found");
    return;
  }

  const submitButton = document.getElementById("submitButton");
  const defaultIcon = submitButton.querySelector(".icon-default");
  const loadingIcon = submitButton.querySelector(".icon-loading");
  const buttonText = submitButton.querySelector(".button-text");

  // Add debug logging
  console.log("Elements found:", {
    submitButton,
    defaultIcon,
    loadingIcon,
    buttonText,
  });

  const setLoading = (isLoading) => {
    console.log("Setting loading state:", isLoading);
    submitButton.disabled = isLoading;
    defaultIcon.classList.toggle("hidden", isLoading);
    loadingIcon.classList.toggle("hidden", !isLoading);
    buttonText.textContent = isLoading ? "Creating Recipe..." : "Create Recipe";
  };

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    console.log("Submit button clicked");
    // Prevent double submission
    if (submitButton.disabled) {
      return;
    }

    setLoading(true);

    const token = document.querySelector('input[name="_csrf"]').value;
    const formData = new FormData(this);

    try {
      const response = await fetch("/food/recipes", {
        method: "POST",
        body: formData,
        headers: {
          "CSRF-Token": token,
          "X-CSRF-Token": token,
        },
        credentials: "same-origin",
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("Submission error:", data);
        if (response.status === 403) {
          alert("Session expired. Page will reload.");
          window.location.reload();
          return;
        }
        throw new Error(data.message || "Submission failed");
      }

      // Successful submission
      window.location.href = "/food/recipes";
    } catch (error) {
      console.error("Form submission error:", error);
      alert("Error submitting form. Please try again.");
      setLoading(false);
    }
  });
});
