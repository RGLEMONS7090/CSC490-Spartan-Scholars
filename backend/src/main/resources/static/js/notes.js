const token = localStorage.getItem("token");
const authErrorMessage = "Your session has expired or you are not logged in.";

const notesGrid = document.getElementById("notesGrid");
const notesCount = document.getElementById("notesCount");
const newNoteBtn = document.getElementById("newNoteBtn");
const noteForm = document.getElementById("noteForm");
const noteModalElement = document.getElementById("noteModal");
const noteModalTitle = document.getElementById("noteModalTitle");
const noteModal = new bootstrap.Modal(noteModalElement);

const noteIdInput = document.getElementById("noteId");
const noteTitleInput = document.getElementById("noteTitle");
const noteCategoryInput = document.getElementById("noteCategory");
const noteContentInput = document.getElementById("noteContent");
const noteFileInput = document.getElementById("noteFile");
const removeAttachmentInput = document.getElementById("removeAttachment");
const noteAttachmentInfo = document.getElementById("noteAttachmentInfo");

let notes = [];

async function apiFetch(url, options = {}) {
  if (!token) {
    throw new Error(authErrorMessage);
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    localStorage.removeItem("token");
    throw new Error(authErrorMessage);
  }

  if (!response.ok) {
    let message = "Request failed.";
    try {
      const errorBody = await response.json();
      if (errorBody && errorBody.message) {
        message = errorBody.message;
      }
    } catch (_err) {
      message = "Request failed.";
    }
    throw new Error(message);
  }

  return response;
}

function escapeHtml(value) {
  const text = value ?? "";
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(isoDate) {
  if (!isoDate) {
    return "Updated recently";
  }
  return `Updated ${new Date(isoDate).toLocaleDateString()}`;
}

function renderNotes() {
  notesCount.textContent = `${notes.length}`;

  if (notes.length === 0) {
    notesGrid.innerHTML = `
      <article class="noteCard">
        <h2>No notes yet</h2>
        <p class="noteCard__text">Create your first note by typing content or uploading a PDF/Word document.</p>
      </article>
    `;
    return;
  }

  notesGrid.innerHTML = notes.map((note) => {
    const category = note.category ? escapeHtml(note.category) : "General";
    const preview = note.preview ? escapeHtml(note.preview) : "No typed content yet.";
    const attachment = note.hasAttachment
      ? `<span class="badge text-bg-secondary">Attachment: ${escapeHtml(note.fileName || "file")}</span>`
      : "";

    return `
      <article class="noteCard">
        <div class="noteCard__actions">
          <button type="button" class="noteCard__iconBtn" data-action="edit" data-id="${note.id}">Edit</button>
          <button type="button" class="noteCard__iconBtn noteCard__iconBtn--danger" data-action="delete" data-id="${note.id}">Delete</button>
        </div>
        <p class="noteCard__category">${category}</p>
        <h2>${escapeHtml(note.title)}</h2>
        <p class="noteCard__text">${preview}</p>
        <div class="d-flex align-items-center gap-2 mb-2">${attachment}</div>
        <div class="noteCard__footer">
          <span class="noteCard__date">${formatDate(note.updatedAt)}</span>
          <a class="noteCard__link" href="/notes/view/${note.id}">View Details &rarr;</a>
        </div>
      </article>
    `;
  }).join("");
}

async function loadNotes() {
  const response = await apiFetch("/api/notes");
  notes = await response.json();
  renderNotes();
}

function resetForm() {
  noteForm.reset();
  noteIdInput.value = "";
  noteAttachmentInfo.textContent = "";
  removeAttachmentInput.checked = false;
}

function fillForm(note) {
  noteIdInput.value = note.id;
  noteTitleInput.value = note.title || "";
  noteCategoryInput.value = note.category || "";
  noteContentInput.value = note.content || "";
  removeAttachmentInput.checked = false;

  if (note.hasAttachment) {
    noteAttachmentInfo.innerHTML = `
      Current attachment: <strong>${escapeHtml(note.fileName || "file")}</strong>
      <button type="button" class="btn btn-sm btn-link p-0 ms-2" id="downloadAttachmentBtn">Download</button>
    `;
    const downloadBtn = document.getElementById("downloadAttachmentBtn");
    downloadBtn.addEventListener("click", () => {
      window.open(`/api/notes/${note.id}/download`, "_blank");
    });
  } else {
    noteAttachmentInfo.textContent = "No attachment on this note.";
  }
}

async function openForEdit(noteId) {
  const response = await apiFetch(`/api/notes/${noteId}`);
  const note = await response.json();
  noteModalTitle.textContent = "Edit Note";
  resetForm();
  fillForm(note);
  noteModal.show();
}

async function saveNote(event) {
  event.preventDefault();

  const formData = new FormData();
  formData.append("title", noteTitleInput.value.trim());
  formData.append("category", noteCategoryInput.value.trim());
  formData.append("content", noteContentInput.value);
  formData.append("removeAttachment", removeAttachmentInput.checked ? "true" : "false");

  if (noteFileInput.files.length > 0) {
    formData.append("file", noteFileInput.files[0]);
  }

  const noteId = noteIdInput.value;
  const url = noteId ? `/api/notes/${noteId}` : "/api/notes";
  const method = noteId ? "PUT" : "POST";

  await apiFetch(url, {
    method,
    body: formData
  });

  noteModal.hide();
  resetForm();
  await loadNotes();
}

async function deleteNote(noteId) {
  const confirmed = window.confirm("Delete this note?");
  if (!confirmed) {
    return;
  }

  await apiFetch(`/api/notes/${noteId}`, { method: "DELETE" });
  await loadNotes();
}

notesGrid.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const action = button.dataset.action;
  const noteId = button.dataset.id;
  if (!noteId) {
    return;
  }

  try {
    if (action === "edit") {
      await openForEdit(noteId);
      return;
    }

    if (action === "delete") {
      await deleteNote(noteId);
    }
  } catch (error) {
    alert(error.message);
  }
});

newNoteBtn.addEventListener("click", () => {
  noteModalTitle.textContent = "New Note";
  resetForm();
  noteModal.show();
});

noteForm.addEventListener("submit", async (event) => {
  try {
    await saveNote(event);
  } catch (error) {
    alert(error.message);
  }
});

loadNotes().catch((error) => {
  alert(error.message);
});

