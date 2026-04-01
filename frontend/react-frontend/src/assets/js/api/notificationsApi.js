const authErrorMessage = "Your session has expired or you are not logged in.";

function buildHeaders(options = {}) {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error(authErrorMessage);
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
}

async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: buildHeaders(options),
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    throw new Error(authErrorMessage);
  }

  if (!response.ok) {
    let message = "Request failed.";
    try {
      const data = await response.json();
      if (data?.message) {
        message = data.message;
      }
    } catch {}
    throw new Error(message);
  }

  return response;
}

export async function fetchNotifications() {
  const response = await apiFetch("/api/notifications");
  return response.json();
}

export async function markAllNotificationsRead() {
  await apiFetch("/api/notifications/read-all", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function markNotificationRead(id) {
  await apiFetch(`/api/notifications/${id}/read`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}
