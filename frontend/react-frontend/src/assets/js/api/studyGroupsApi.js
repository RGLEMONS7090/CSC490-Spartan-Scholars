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

export async function fetchStudyGroups(query = "") {
  const search = query.trim();
  const url = search ? `/api/study-groups?q=${encodeURIComponent(search)}` : "/api/study-groups";
  const response = await apiFetch(url);
  return response.json();
}

export async function createStudyGroup(payload) {
  const response = await apiFetch("/api/study-groups", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function fetchStudyGroup(id) {
  const response = await apiFetch(`/api/study-groups/${id}`);
  return response.json();
}

export async function joinStudyGroup(id) {
  const response = await apiFetch(`/api/study-groups/${id}/join`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  return response.json();
}

export async function joinPrivateStudyGroup(password) {
  const response = await apiFetch("/api/study-groups/join-private", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
  return response.json();
}

export async function sendStudyGroupMessage(id, content) {
  const response = await apiFetch(`/api/study-groups/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
  return response.json();
}

export async function deleteStudyGroup(id) {
  await apiFetch(`/api/study-groups/${id}`, {
    method: "DELETE",
  });
}

export async function shareStudyGroupItems(id, payload) {
  const response = await apiFetch(`/api/study-groups/${id}/shared-items`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function importStudyGroupItem(id, sharedItemId) {
  const response = await apiFetch(`/api/study-groups/${id}/shared-items/${sharedItemId}/import`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  return response.json();
}
