// Define the callback function first
window.handleCredentialResponse = function (response) {
  // Detailed logging of the entire response
  console.log("=== Google Sign-In Response ===");
  //   console.log("Full response object:", response);
  //   console.log("Credential:", response.credential);

  // Decode the JWT token to see the user information
  if (response.credential) {
    const payload = JSON.parse(atob(response.credential.split(".")[1]));
    // console.log("Decoded JWT payload:", payload);
    console.log("User email:", payload.email);
    console.log("User name:", payload.name);
    console.log("User picture:", payload.picture);
  }

  // Display the email address from the response object
  if (response.ky && response.ky.ez) {
    console.log("User email from response object:", response.ky.ez);
  }

  if (!response || !response.credential) {
    console.error("Invalid Google response:", response);
    return;
  }

  // Get CSRF token from meta tag
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;

  // Define requestBody after ensuring response.credential is valid
  const requestBody = {
    credential: response.credential,
    _csrf: csrfToken,
  };

  console.log("Sending to server:", requestBody);

  fetch("/api/v1/users/google-login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "CSRF-Token": csrfToken,
    },
    credentials: "include",
    body: JSON.stringify(requestBody),
  })
    .then((res) => {
      console.log("Server response status:", res.status);
      return res.json();
    })
    .then((data) => {
      console.log("Server response data:", data);
      // Check for success status
      if (data.status === "success") {
        console.log("Login successful, redirecting to homepage...");
        window.location.href = "/";
      } else {
        console.error("Login failed:", data.message);
        const errorMessage = document.getElementById("error-message");
        if (errorMessage) {
          errorMessage.textContent =
            data.message || "Login failed. Please try again.";
        }
      }
    })
    .catch((error) => {
      console.error("Error during login:", error);
      const errorMessage = document.getElementById("error-message");
      if (errorMessage) {
        errorMessage.textContent =
          "An unexpected error occurred. Please try again later.";
      }
    });
};
