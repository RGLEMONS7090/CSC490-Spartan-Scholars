document.getElementById("signupForm").addEventListener("submit", async (e) => {
    e.preventDefault();
  
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
        alert("Signup failed. Email may already be in use.");
        return;
      }
  
      const data = await response.json();
  
      // Save JWT token
      localStorage.setItem("token", data.token);

      // Redirect to homepage or dashboard
      window.location.href = "/index.html";
  
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Try again.");
    }
  });
  
  