import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import {
  fetchPublicNote,
  fetchPublicBoardNotes,
  importPublicNote,
  unpublishNoteFromBoard,
} from "../assets/js/api/notesApi";

export default function PublicNoteView() {
  const { id } = useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const [publicNote, publicNotes] = await Promise.all([
          fetchPublicNote(id),
          fetchPublicBoardNotes(),
        ]);
        const summary = publicNotes.find((entry) => String(entry.id) === String(id));
        setNote({
          ...publicNote,
          authorName: summary?.authorName || "",
          ownedByCurrentUser: summary?.ownedByCurrentUser || false,
          publishedToBoardAt: summary?.publishedToBoardAt || publicNote.updatedAt,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  async function handleImport() {
    if (importing) {
      return;
    }

    setImporting(true);
    setError("");
    try {
      await importPublicNote(id);
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  }

  async function handleRemove() {
    if (removing) {
      return;
    }

    setRemoving(true);
    setError("");
    try {
      await unpublishNoteFromBoard(id);
      window.location.href = "/public-notes";
    } catch (err) {
      setError(err.message);
      setRemoving(false);
    }
  }

  if (loading) {
    return <p>{error || "Loading..."}</p>;
  }

  if (!note) {
    return <p>{error || "Public note not found."}</p>;
  }

  return (
    <>
      <Helmet>
        <title>{note.title} | Public Notes</title>
      </Helmet>

      <main className="noteDetails">
        <header className="noteDetails__header">
          <Link to="/public-notes" className="noteDetails__back">
            Back to Public Notes
          </Link>
          <div className="noteDetails__actions">
            {note.ownedByCurrentUser ? (
              <button
                className="noteDetails__shareForumBtn"
                disabled={removing}
                onClick={handleRemove}
              >
                {removing ? "Removing..." : "Remove from Public Notes"}
              </button>
            ) : (
              <button
                className="noteDetails__quizBtn"
                disabled={importing}
                onClick={handleImport}
              >
                {importing ? "Importing..." : "Import to My Notes"}
              </button>
            )}
          </div>
        </header>

        <h1 className="noteDetails__title">{note.title}</h1>
        {note.authorName && <p className="noteDetails__updated">by {note.authorName}</p>}
        <p className="noteDetails__updated">
          Shared {new Date(note.publishedToBoardAt || note.updatedAt).toLocaleString()}
        </p>
        {note.category && <p className="noteDetails__category">{note.category}</p>}
        {error && <p className="noteDetails__error">{error}</p>}

        <article className="noteDetails__content">
          {(note.content || "").split("\n").map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </article>

        {note.fileName && (
          <div className="noteDetail__attachments">
            <h3>Attachment</h3>
            <a
              href={`/api/notes/${id}/download`}
              target="_blank"
              rel="noopener noreferrer"
              className="noteDetail__downloadLink"
            >
              {note.fileName}
            </a>

            {note.fileContentType?.startsWith("image/") && (
              <img
                src={`/api/notes/${id}/preview`}
                alt={note.fileName}
                className="noteDetail__imagePreview"
              />
            )}

            {note.fileContentType === "application/pdf" && (
              <iframe
                src={`/api/notes/${id}/preview`}
                className="noteDetail__pdfPreview"
                title={`Preview for ${note.title}`}
              />
            )}

            {note.fileContentType?.includes("word") && (
              <p className="noteDetail__noPreview">
                Word documents cannot be previewed. Use the download link above.
              </p>
            )}
          </div>
        )}
      </main>
    </>
  );
}
