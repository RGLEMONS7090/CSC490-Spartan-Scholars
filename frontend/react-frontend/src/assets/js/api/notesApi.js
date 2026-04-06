// Replaces the apiFetch function 

export async function apiFetch(url, options = {}) {
    const token = localStorage.getItem("token");
  
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${token}`);

    const response = await fetch(url, { ...options, headers });
  
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      return null;
    }
    
    if (!response.ok) {
        let message = "Request failed.";
        try {
          const errorBody = await response.json();
          if (errorBody?.message) message = errorBody.message;
        } catch {}
        throw new Error(message);
      }
    
      return response;
 }

export async function enhanceNoteWithAi(noteId) {
  const response = await apiFetch(`/api/notes/${noteId}/enhance`, {
    method: "POST",
  });
  return response.json();
}

export async function createNoteShare(noteId) {
  const response = await apiFetch(`/api/notes/${noteId}/share`, {
    method: "POST",
  });
  return response.json();
}

export async function fetchPublicBoardNotes() {
  const response = await apiFetch("/api/notes/public");
  return response.json();
}

export async function publishNoteToBoard(noteId) {
  const response = await apiFetch(`/api/notes/${noteId}/publish-to-board`, {
    method: "POST",
  });
  return response.json();
}

export async function unpublishNoteFromBoard(noteId) {
  const response = await apiFetch(`/api/notes/${noteId}/publish-to-board`, {
    method: "DELETE",
  });
  return response.json();
}

export async function importNoteByPassword(password) {
  const response = await apiFetch("/api/notes/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  return response.json();
}
        
  
  
