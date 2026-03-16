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
        
  
  
