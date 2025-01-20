document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("recipeForm");

  if (!form) {
    console.warn("Recipe form not found");
    return;
  }

  const submitButton = document.getElementById("submitButton");
  const buttonText = submitButton.querySelector(".button-text");
  const buttonSpinner = submitButton.querySelector(".button-spinner");

  // Add debug logging
  console.log("Elements found:", {
    submitButton,
    buttonText,
    buttonSpinner,
  });

  const setLoading = (isLoading) => {
    console.log("Setting loading state:", isLoading);
    submitButton.disabled = isLoading;
    buttonText.classList.toggle("hidden", isLoading);
    buttonSpinner.classList.toggle("hidden", !isLoading);

    // Debug log the classes after toggle
    console.log("Button classes after toggle:", {
      buttonTextClasses: buttonText.classList.toString(),
      spinnerClasses: buttonSpinner.classList.toString(),
    });
  };

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

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
