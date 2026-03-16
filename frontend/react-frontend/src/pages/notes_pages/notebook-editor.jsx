import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../../assets/js/api/notesApi";
import useAutosave from "../../assets/js/utils/useAutosave";

export default function NoteEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [note, setNote] = useState({
    title: "",
    category: "",
    content: "",
  });
  const [saved, setSaved] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentAttachment, setCurrentAttachment] = useState(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [lastUploadedFileName, setLastUploadedFileName] = useState("");
  const [currentNoteId, setCurrentNoteId] = useState(id ?? null);

  const loadedRef = useRef(false);
  const saveInFlightRef = useRef(false);
  const queuedSaveRef = useRef(null);
  const lastSavedSnapshotRef = useRef("");

  useEffect(() => {
    setCurrentNoteId(id ?? null);
  }, [id]);

  function buildSnapshot(noteValue, noteIdValue, attachmentValue, removeAttachmentValue, selectedFileValue) {
    return JSON.stringify({
      id: noteIdValue ?? null,
      title: noteValue.title || "",
      category: noteValue.category || "",
      content: noteValue.content || "",
      attachment: attachmentValue?.fileName || "",
      removeAttachment: removeAttachmentValue,
      selectedFile: selectedFileValue?.name || "",
    });
  }

  useEffect(() => {
    if (!id) {
      loadedRef.current = true;
      return;
    }

    async function loadNote() {
      const res = await apiFetch(`/api/notes/${id}`);
      const data = await res.json();

      const nextNote = {
        title: data.title || "",
        category: data.category || "",
        content: data.content || "",
      };
      const nextAttachment = data.hasAttachment
        ? { fileName: data.fileName, fileContentType: data.fileContentType }
        : null;

      setNote(nextNote);
      setCurrentAttachment(nextAttachment);
      setLastUploadedFileName(data.hasAttachment ? (data.fileName || "") : "");
      setRemoveAttachment(false);
      setSelectedFile(null);
      lastSavedSnapshotRef.current = buildSnapshot(nextNote, id, nextAttachment, false, null);
      loadedRef.current = true;
    }

    loadNote();
  }, [id]);

  async function saveNote(latestNote) {
    if (saveInFlightRef.current) {
      queuedSaveRef.current = latestNote;
      return;
    }

    if (!latestNote.title.trim()) {
      return;
    }

    const snapshot = buildSnapshot(
      latestNote,
      currentNoteId,
      currentAttachment,
      removeAttachment,
      selectedFile
    );
    if (snapshot === lastSavedSnapshotRef.current) {
      setSaved(true);
      return;
    }

    saveInFlightRef.current = true;
    setSaved(false);

    const formData = new FormData();
    formData.append("title", latestNote.title || "");
    formData.append("category", latestNote.category || "");
    formData.append("content", latestNote.content || "");
    formData.append("removeAttachment", removeAttachment ? "true" : "false");
    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    const isNew = !currentNoteId;
    const url = isNew ? "/api/notes" : `/api/notes/${currentNoteId}`;
    const method = isNew ? "POST" : "PUT";

    try {
      const res = await apiFetch(url, { method, body: formData });
      const savedNote = await res.json();

      const nextNote = {
        title: savedNote.title || "",
        category: savedNote.category || "",
        content: savedNote.content || "",
      };
      const nextAttachment = savedNote.hasAttachment
        ? { fileName: savedNote.fileName, fileContentType: savedNote.fileContentType }
        : null;

      setNote(nextNote);
      setCurrentAttachment(nextAttachment);
      setLastUploadedFileName(savedNote.hasAttachment ? (savedNote.fileName || "") : "");
      setSelectedFile(null);
      setRemoveAttachment(false);
      lastSavedSnapshotRef.current = buildSnapshot(nextNote, savedNote.id, nextAttachment, false, null);

      if (isNew) {
        setCurrentNoteId(savedNote.id);
        navigate(`/notes/edit/${savedNote.id}`, { replace: true });
      }

      setSaved(true);
      return savedNote;
    } finally {
      saveInFlightRef.current = false;

      if (queuedSaveRef.current) {
        const queuedNote = queuedSaveRef.current;
        queuedSaveRef.current = null;
        saveNote(queuedNote);
      }
    }
  }

  useAutosave(
    {
      note,
      currentNoteId,
      currentAttachment,
      removeAttachment,
      selectedFileName: selectedFile?.name || "",
    },
    ({ note: latest }) => {
      if (!loadedRef.current) {
        return;
      }
      saveNote(latest);
    },
    800
  );

  function updateField(field, value) {
    setSaved(false);
    setNote((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  return (
    <div className="noteEditor">
      <header className="noteEditor__header">
        <div className="noteEditor__nav">
          <button onClick={() => navigate("/notes")}>Back</button>
          {currentNoteId && (
            <Link className="noteEditor__viewBtn" to={`/notes/${currentNoteId}`}>
              View Details
            </Link>
          )}
        </div>

        <div className="noteEditor__actions">
          <span className="noteEditor__status">{saved ? "Saved" : "Saving..."}</span>
          <button
            className="noteEditor__saveBtn"
            disabled={!note.title.trim()}
            onClick={() => saveNote(note)}
          >
            Save
          </button>
        </div>
      </header>

      <div className="noteEditor__form">
        <input
          className="noteEditor__title"
          value={note.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="Note title..."
        />

        <input
          className="noteEditor__category"
          value={note.category}
          onChange={(e) => updateField("category", e.target.value)}
          placeholder="Category (optional)"
        />

        <div className="noteEditor__file">
          <label htmlFor="noteFile">Upload PDF or Word file</label>
          <input
            id="noteFile"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => {
              const nextFile = e.target.files?.[0] ?? null;
              setSelectedFile(nextFile);
              if (nextFile) {
                setLastUploadedFileName("");
                setRemoveAttachment(false);
                setSaved(false);
              }
            }}
          />

          {currentAttachment && !removeAttachment && !selectedFile && (
            <p>
              Current attachment:{" "}
              <a href={`/api/notes/${currentNoteId}/download`} target="_blank" rel="noreferrer">
                {currentAttachment.fileName}
              </a>
            </p>
          )}

          {selectedFile && <p>Selected file: {selectedFile.name}</p>}

          {!selectedFile && lastUploadedFileName && <p>Attached file: {lastUploadedFileName}</p>}

          {(currentAttachment || selectedFile) && (
            <label>
              <input
                type="checkbox"
                checked={removeAttachment}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setRemoveAttachment(checked);
                  if (checked) {
                    setSelectedFile(null);
                  }
                  setSaved(false);
                }}
              />
              Remove current attachment
            </label>
          )}
        </div>

        <textarea
          className="noteEditor__content"
          value={note.content}
          onChange={(e) => updateField("content", e.target.value)}
          placeholder="Start typing your notes..."
        />
      </div>
    </div>
  );
}
