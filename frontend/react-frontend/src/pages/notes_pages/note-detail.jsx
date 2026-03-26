import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch, enhanceNoteWithAi } from "../../assets/js/api/notesApi";

export default function NoteDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
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

  function handleMakeQuiz() {
    if (!note?.content?.trim()) {
      return;
    }

    navigate("/take-quizzes/create/ai", {
      state: {
        sourceNoteId: note.id,
        sourceNoteTitle: note.title || "",
        sourceNoteCategory: note.category || "",
        sourceNoteContent: note.content || "",
      },
    });
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
            className="noteDetails__quizBtn"
            disabled={!note.content?.trim()}
            onClick={handleMakeQuiz}
          >
            Make Quiz Using Note
          </button>
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
        <div className="noteDetail__attachments">
          <h3>Attachment</h3>
          {/* Download Link */}
          <a href={`http://localhost:8080/api/notes/${id}/download`} target="_blank" rel="noopener noreferrer" className="noteDetail__downloadLink">
           {note.fileName}
          </a>

        {note.fileContentType?.startsWith("image/") && (
          <img
            src={`http://localhost:8080/api/notes/${id}/preview`}
            alt={note.fileName}
            className="noteDetail__imagePreview"
          />
        )}

        {/* PDF PREVIEW */}
        {note.fileContentType === "application/pdf" && (
          <iframe
            src={`http://localhost:8080/api/notes/${id}/preview`}
            className="noteDetail__pdfPreview"
            title="PDF Preview"
          />
        )}

        {/* WORD FILE (no preview) */}
        {note.fileContentType?.includes("word") && (
          <p className="noteDetail__noPreview">
            Word documents cannot be previewed. Use the download link above.
          </p>
        )}
        </div>
      )}
    </main>
  );
}
