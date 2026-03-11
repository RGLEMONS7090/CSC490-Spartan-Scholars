const signupForm = document.getElementById("signupForm");
const signupError = document.getElementById("signupError");

function showSignupError(message) {
  signupError.textContent = message;
  signupError.hidden = false;
}

function clearSignupError() {
  signupError.textContent = "";
  signupError.hidden = true;
}

async function readErrorMessage(response, fallbackMessage) {
  try {
    const payload = await response.json();
    const details = Array.isArray(payload?.details) ? payload.details.filter(Boolean) : [];
    if (details.length > 0) {
      return details.join(" ");
    }

    return payload?.error || payload?.message || fallbackMessage;
  } catch (error) {
    return fallbackMessage;
  }
}

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearSignupError();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    if (!response.ok) {
      const message = await readErrorMessage(response, "Signup failed. Email may already be in use.");
      showSignupError(message);
      return;
    }

    const data = await response.json();
    localStorage.setItem("token", data.token);
    window.location.href = "/";
  } catch (error) {
    console.error("Signup error:", error);
    showSignupError("Something went wrong. Try again.");
  }
});
