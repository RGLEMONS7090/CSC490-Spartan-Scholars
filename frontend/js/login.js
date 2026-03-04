document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      alert("Invalid email or password.");
      return;
    }

    const data = await response.json();
    localStorage.setItem("token", data.token);
    window.location.href = "index.html";
  } catch (error) {
    console.error("Login error:", error);
    alert("Something went wrong. Try again.");
  }
});
