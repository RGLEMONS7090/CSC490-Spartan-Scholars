import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { createNoteShare } from "../../assets/js/api/notesApi";

export default function NoteCard({ note, onEdit, onDelete }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [sharePassword, setSharePassword] = useState("");
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);

  async function handleShare(event) {
    event.preventDefault();
    event.stopPropagation();
    setSharing(true);
    setError("");
    try {
      const data = await createNoteShare(note.id);
      setSharePassword(data.password);
      setShareOpen(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSharing(false);
    }
  }

  async function handleCopy(event) {
    event.preventDefault();
    event.stopPropagation();
    await navigator.clipboard.writeText(sharePassword);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  useEffect(() => {
    function handleClickOutside() {
      setMenuOpen(false);
    }
  
    if (menuOpen) {
      document.addEventListener("click", handleClickOutside);
    }
  
    return () => document.removeEventListener("click", handleClickOutside);
  }, [menuOpen]);
  

  return (
    <article className="noteCard">
      <Link to={`/notes/${note.id}`} className="noteCard__overlayLink"></Link>

      <div className="noteCard__header">
        <div>
          <div className="noteCard__titleRow">
            <h2 className="noteCard__title">{note.title}</h2>
            {note.imported && <span className="sharePill">Imported</span>}
          </div>
        </div>

        {/*<div className="noteCard__actions">
          <div className="noteCard__actionsMain">
            <button className="quizActionBtn quizActionBtn--secondary" onClick={onEdit}>Edit</button>
            <button className="quizActionBtn quizActionBtn--secondary" onClick={handleShare}>
              {sharing ? "Sharing..." : "Share Note"}
            </button>
          </div>
          <button className="quizActionBtn quizActionBtn--danger noteCard__deleteBtn" onClick={onDelete}>
            Delete
          </button>
        </div> */}

        <div className="noteCard__menuWrapper">
          <button
            className="noteCard__menuBtn"
            onClick={(e) => {
            e.stopPropagation()
            setMenuOpen((prev) => !prev)
          }}
          >
            ⋮
          </button>

          {menuOpen && (
            <div className="noteCard__menu">
              <button onClick={onEdit}>Edit</button>
              <button onClick={handleShare}>{sharing ? "Sharing..." : "Share Note"}</button>
              <button className="danger" onClick={() => setShowDeleteModal(true)}>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="deleteModal">
          <div className="deleteModal__content">
            <h3>Delete this notebook?</h3>
            <p>This action cannot be undone. Are you sure you want to continue?</p>

            <div className="deleteModal__actions">
              <button 
                className="quizActionBtn quizActionBtn--danger"
                onClick={() => {
                  onDelete();
                  setShowDeleteModal(false);
                }}
              >
              Delete
              </button>

              <button 
                className="quizActionBtn quizActionBtn--secondary"
                onClick={() => setShowDeleteModal(false)}
              >
            Cancel
        </button>
      </div>
    </div>
  </div>
)}



      <p className="noteCard__text">
        {note.category || "No description added."}
      </p>

      {shareOpen && (
        <div className="sharePanel">
          <span className="sharePanel__label">Share password</span>
          <div className="sharePanel__row">
            <code className="sharePanel__code">{sharePassword}</code>
            <button className="quizActionBtn quizActionBtn--secondary" type="button" onClick={handleCopy}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="quizError">{error}</p>}

      <div className="noteCard__footer">
        <span className="noteCard__date">
          Updated {new Date(note.updatedAt).toLocaleDateString()}
        </span>

        <div className="noteCard__footerActions">
          <Link className="quizActionBtn quizActionBtn--primary" to={`/notes/${note.id}`}>
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}
