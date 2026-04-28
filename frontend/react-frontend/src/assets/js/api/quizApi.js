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

export async function fetchQuizOverview() {
  const response = await apiFetch("/api/quizzes");
  return response.json();
}

export async function createTestQuiz(payload) {
  const response = await apiFetch("/api/quizzes/test", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function createFlashcardQuiz(payload) {
  const response = await apiFetch("/api/quizzes/flashcards", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function createAiTestQuiz(payload) {
  const response = await apiFetch("/api/quizzes/ai/test", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function createAiFlashcardQuiz(payload) {
  const response = await apiFetch("/api/quizzes/ai/flashcards", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function fetchQuiz(id) {
  const response = await apiFetch(`/api/quizzes/${id}`);
  return response.json();
}

export async function submitQuiz(id, answers) {
  const response = await apiFetch(`/api/quizzes/${id}/submit`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
  return response.json();
}

export async function completeFlashcards(id) {
  await apiFetch(`/api/quizzes/${id}/complete`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function deleteQuiz(id) {
  await apiFetch(`/api/quizzes/${id}`, {
    method: "DELETE",
  });
}

export async function createQuizShare(id) {
  const response = await apiFetch(`/api/quizzes/${id}/share`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  return response.json();
}

export async function importQuizByPassword(password) {
  const response = await apiFetch("/api/quizzes/import", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
  return response.json();
}
