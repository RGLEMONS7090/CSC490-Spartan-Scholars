import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {apiFetch} from "../../assets/js/api/notesApi";
import useAutosave from "../../assets/js/utils/useAutosave";
import NoteCard from "../notes_pages/notes-card";

export default function NoteEditor() {
  const { id } = useParams(); 
  const navigate = useNavigate();

  const [note, setNote] = useState({
    title: "",
    category: "",
    content: "",
  });

  const [saved, setSaved] = useState(true);
  const loadedRef = useRef(false);

  // Load existing note if editing
  useEffect(() => {
    if (!id) {
      loadedRef.current = true;
      return;
    }

    async function loadNote() {
      const res = await apiFetch(`/api/notes/${id}`);
      const data = await res.json();
      setNote({
        title: data.title || "",
        category: data.category || "",
        content: data.content || "",
      });
      loadedRef.current = true;
    }

    loadNote();
  }, [id]);

  async function saveNote(latestNote) {

    if (!latestNote.title.trim()) return;
    setSaved(false);

    const formData = new FormData();
    formData.append("title", latestNote.title || "");
    formData.append("category", latestNote.category || "");
    formData.append("content", latestNote.content || "");



    const isNew = !id;
    const url = isNew ? "/api/notes" : `/api/notes/${id}`;
    const method = isNew ? "POST" : "PUT";

    const res = await apiFetch(url, { method, body: formData});
    const savedNote = await res.json();

    if (isNew) {
      navigate(`/notes/edit/${savedNote.id}`, { replace: true });
    }
  
    setSaved(true);

    return savedNote;
  }

  useAutosave(note, (latest) => {
    if (!loadedRef.current) return;
    saveNote(latest);
  }, 800);

  function updateField(field, value) {
    setNote(prev => ({
      ...prev,
      [field]: value
    }));
  }

  return (
    <div className="noteEditor">
      <header className="noteEditor__header">
        <button onClick={() => navigate("/notes")}>← Back</button>

        <div className="noteEditor__actions">
          <span className="noteEditor__status">
            {saved ? "Saved" : "Saving..."}
          </span>

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