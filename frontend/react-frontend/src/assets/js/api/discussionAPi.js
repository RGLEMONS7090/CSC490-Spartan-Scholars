
const authErrorMessage = "Your session has expired or you are not logged in.";

function getToken() {
  return localStorage.getItem("token");
}

async function apiFetch(url, options = {}) {
  const token = getToken();
  if (!token) {
    throw new Error(authErrorMessage);
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    localStorage.removeItem("token");
    throw new Error(authErrorMessage);
  }

  if (!response.ok) {
    let message = "Request failed.";
    try {
      const data = await response.json();
      if (data && data.message) {
        message = data.message;
      }
    } catch {
      message = "Request failed.";
    }
    throw new Error(message);
  }

  return response;
}

export function initials(name) {
  const parts = (name || "User").trim().split(/\s+/);
  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "U"
  );
}

export function relativeTime(iso) {
  if (!iso) return "just now";
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export async function fetchDiscussions(sort, query = "") {
  const params = new URLSearchParams();
  params.set("sort", sort);
  if (query.trim()) {
    params.set("query", query.trim());
  }
  const response = await apiFetch(`/api/discussions?${params.toString()}`);
  return response.json();
}

export async function createDiscussion(payload) {
  const response = await apiFetch("/api/discussions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function toggleLike(discussionId) {
  const response = await apiFetch(`/api/discussions/${discussionId}/likes`, {
    method: "POST",
  });
  return response.json();
}

export async function deleteDiscussion(discussionId) {
  await apiFetch(`/api/discussions/${discussionId}`, {
    method: "DELETE",
  });
}

export async function fetchComments(discussionId) {
  const response = await apiFetch(`/api/discussions/${discussionId}/comments`);
  return response.json();
}

export async function postComment(discussionId, content, parentId = null) {
  const response = await apiFetch(`/api/discussions/${discussionId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content, parentId }),
  });
  return response.json();
}

export async function postReply(discussionId, parentId, content) {
  return apiFetch(`/api/discussions/${discussionId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content, parentId })
  }).then(res => res.json());
}


export {apiFetch};
