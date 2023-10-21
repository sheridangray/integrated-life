import axios from "axios";

const loginForm = document.querySelector(".login-form");

// Submit the Login form

if (loginForm)
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    login(email, password);
  });

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: "POST",
      url: "/api/v1/users/login",
      data: {
        email,
        password,
      },
    });
    if ((res.data.status = "success")) window.location.href = "/";
  } catch (err) {
    // showAlert("error", err.response.data.message);
    console.log(err);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: "POST",
      url: "/api/v1/users/logout",
    });

    if ((res.data.status = "success")) window.location.href = "/";
  } catch (err) {
    // showAlert("error", err.response.data.message);
    console.log(err);
  }
};

// Check Authentication

export const checkAuthentication = async () => {
  try {
  } catch (err) {
    // showAlert("error", err.response.data.message);
    console.log(err);
  }
};
