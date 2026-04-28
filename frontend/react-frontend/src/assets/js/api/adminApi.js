import { clearAdminSessionArtifacts } from "../utils/adminSession";

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
    clearAdminSessionArtifacts();
    localStorage.removeItem("token");
    throw new Error(authErrorMessage);
  }

  if (!response.ok) {
    let message = "Request failed.";
    try {
      const data = await response.json();
      if (data?.message) {
        message = data.message;
      } else if (data?.error) {
        message = data.error;
      }
    } catch {}
    throw new Error(message);
  }

  return response;
}

export async function createAdminSession(password) {
  const response = await apiFetch("/api/admin/session", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
  return response.json();
}

export async function fetchAdminUsers() {
  const response = await apiFetch("/api/admin/users");
  return response.json();
}

export async function fetchAdminUserImplementations(userId) {
  const response = await apiFetch(`/api/admin/users/${userId}`);
  return response.json();
}

export async function deleteAdminUser(userId) {
  await apiFetch(`/api/admin/users/${userId}`, {
    method: "DELETE",
  });
}

export async function deleteAdminNote(userId, noteId) {
  await apiFetch(`/api/admin/users/${userId}/notes/${noteId}`, {
    method: "DELETE",
  });
}

export async function deleteAdminQuiz(userId, quizId) {
  await apiFetch(`/api/admin/users/${userId}/quizzes/${quizId}`, {
    method: "DELETE",
  });
}

export async function deleteAdminDiscussion(userId, discussionId) {
  await apiFetch(`/api/admin/users/${userId}/discussions/${discussionId}`, {
    method: "DELETE",
  });
}
