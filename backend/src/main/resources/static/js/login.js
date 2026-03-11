const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

function showLoginError(message) {
  loginError.textContent = message;
  loginError.hidden = false;
}

function clearLoginError() {
  loginError.textContent = "";
  loginError.hidden = true;
}

async function readErrorMessage(response, fallbackMessage) {
  try {
    const payload = await response.json();
    return payload?.error || payload?.message || fallbackMessage;
  } catch (error) {
    return fallbackMessage;
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearLoginError();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const message = await readErrorMessage(response, "Invalid email or password.");
      showLoginError(message);
      return;
    }

    const data = await response.json();
    localStorage.setItem("token", data.token);
    window.location.href = "/";
  } catch (error) {
    console.error("Login error:", error);
    showLoginError("Something went wrong. Try again.");
  }
});
