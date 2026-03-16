import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch, enhanceNoteWithAi } from "../../assets/js/api/notesApi";

export default function NoteDetails() {
  const { id } = useParams();
  const [note, setNote] = useState(null);
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch(`/api/notes/${id}`);
        const data = await res.json();
        setNote(data);
        setError("");
      } catch (loadError) {
        setError(loadError.message);
      }
    }

    load();
  }, [id]);

  async function handleEnhance() {
    if (!note?.content?.trim() || enhancing) {
      return;
    }

    setEnhancing(true);
    setError("");
    try {
      const enhancedNote = await enhanceNoteWithAi(id);
      setNote(enhancedNote);
    } catch (enhanceError) {
      setError(enhanceError.message);
    } finally {
      setEnhancing(false);
    }
  }

  if (!note) {
    return <p>{error || "Loading..."}</p>;
  }

  return (
    <main className="noteDetails">
      <header className="noteDetails__header">
        <Link to="/notes" className="noteDetails__back">
          Back to Notes
        </Link>
        <div className="noteDetails__actions">
          <button
            className="noteDetails__enhanceBtn"
            disabled={enhancing || !note.content?.trim()}
            onClick={handleEnhance}
          >
            {enhancing ? "Enhancing..." : "Enhance with AI"}
          </button>
          <Link to={`/notes/edit/${id}`} className="noteDetails__editBtn">
            Edit Note
          </Link>
        </div>
      </header>

      <h1 className="noteDetails__title">{note.title}</h1>
      <p className="noteDetails__updated">
        Updated {new Date(note.updatedAt).toLocaleString()}
      </p>
      {note.category && <p className="noteDetails__category">{note.category}</p>}
      {error && <p className="noteDetails__error">{error}</p>}

      <article className="noteDetails__content">
        {note.content.split("\n").map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </article>

      {note.fileName && (
        <a href={`/api/notes/${id}/download`} className="noteDetails__attachment">
          Download Attachment ({note.fileName})
        </a>
      )}
    </main>
  );
}
