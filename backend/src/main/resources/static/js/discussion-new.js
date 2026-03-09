const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "/login";
}

const form = document.getElementById("newDiscussionForm");
const titleInput = document.getElementById("discussionTitle");
const descriptionInput = document.getElementById("discussionDescription");

async function apiFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    return null;
  }
  if (!response.ok) {
    let message = "Request failed.";
    try {
      const data = await response.json();
      if (data && data.message) {
        message = data.message;
      }
    } catch (_err) {
      message = "Request failed.";
    }
    throw new Error(message);
  }
  return response;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  if (!title || !description) {
    alert("Title and description are required.");
    return;
  }

  try {
    await apiFetch("/api/discussions", {
      method: "POST",
      body: JSON.stringify({ title, description })
    });
    window.location.href = "/discussion-board";
  } catch (error) {
    alert(error.message);
  }
});
