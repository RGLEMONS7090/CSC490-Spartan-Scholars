const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "/login";
}

const pathMatch = window.location.pathname.match(/\/notes\/view\/(\d+)/);
const noteId = pathMatch ? pathMatch[1] : null;

const noteDetailTitle = document.getElementById("noteDetailTitle");
const noteDetailMeta = document.getElementById("noteDetailMeta");
const noteDetailCategory = document.getElementById("noteDetailCategory");
const noteDetailContent = document.getElementById("noteDetailContent");
const noteDetailAttachment = document.getElementById("noteDetailAttachment");

const editNoteBtn = document.getElementById("editNoteBtn");
const noteForm = document.getElementById("noteForm");
const noteModal = new bootstrap.Modal(document.getElementById("noteModal"));
const noteTitleInput = document.getElementById("noteTitle");
const noteCategoryInput = document.getElementById("noteCategory");
const noteContentInput = document.getElementById("noteContent");
const noteFileInput = document.getElementById("noteFile");
const removeAttachmentInput = document.getElementById("removeAttachment");
const noteAttachmentInfo = document.getElementById("noteAttachmentInfo");

let currentNote = null;

async function apiFetch(url, options = {}) {
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
      const body = await response.json();
      message = body.message || message;
    } catch (_err) {}
    throw new Error(message);
  }

  return response;
}

function render() {
  if (!currentNote) {
    return;
  }

  noteDetailTitle.textContent = currentNote.title || "Untitled";
  noteDetailMeta.textContent = `Updated ${new Date(currentNote.updatedAt).toLocaleString()}`;
  noteDetailCategory.textContent = currentNote.category || "General";
  noteDetailContent.textContent = currentNote.content || "No typed content.";

  if (currentNote.hasAttachment) {
    noteDetailAttachment.innerHTML = `
      <button type="button" class="btn btn-sm btn-outline-primary" id="downloadAttachmentBtn">
        Download ${currentNote.fileName || "attachment"}
      </button>
    `;
    document.getElementById("downloadAttachmentBtn").addEventListener("click", () => {
      window.open(`/api/notes/${noteId}/download`, "_blank");
    });
  } else {
    noteDetailAttachment.innerHTML = "";
  }
}

function fillEditForm() {
  noteTitleInput.value = currentNote.title || "";
  noteCategoryInput.value = currentNote.category || "";
  noteContentInput.value = currentNote.content || "";
  removeAttachmentInput.checked = false;
  noteFileInput.value = "";

  if (currentNote.hasAttachment) {
    noteAttachmentInfo.textContent = `Current attachment: ${currentNote.fileName || "file"}`;
  } else {
    noteAttachmentInfo.textContent = "No attachment on this note.";
  }
}

async function loadNote() {
  if (!noteId) {
    noteDetailTitle.textContent = "Note not found";
    noteDetailMeta.textContent = "Invalid URL";
    editNoteBtn.disabled = true;
    return;
  }

  const response = await apiFetch(`/api/notes/${noteId}`);
  if (!response) {
    return;
  }
  currentNote = await response.json();
  render();
}

editNoteBtn.addEventListener("click", () => {
  if (!currentNote) {
    return;
  }
  fillEditForm();
  noteModal.show();
});

noteForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const formData = new FormData();
    formData.append("title", noteTitleInput.value.trim());
    formData.append("category", noteCategoryInput.value.trim());
    formData.append("content", noteContentInput.value);
    formData.append("removeAttachment", removeAttachmentInput.checked ? "true" : "false");
    if (noteFileInput.files.length > 0) {
      formData.append("file", noteFileInput.files[0]);
    }

    await apiFetch(`/api/notes/${noteId}`, {
      method: "PUT",
      body: formData
    });

    noteModal.hide();
    await loadNote();
  } catch (error) {
    alert(error.message);
  }
});

loadNote().catch((error) => {
  noteDetailTitle.textContent = "Failed to load note";
  noteDetailMeta.textContent = error.message;
  editNoteBtn.disabled = true;
});
