import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  apiFetch,
  fetchPublicBoardNotes,
  importPublicNote,
  publishNoteToBoard,
  unpublishNoteFromBoard,
} from "../assets/js/api/notesApi";
import publicNotesLightImage from "../assets/images/light_public_notes.png";
import publicNotesDarkImage from "../assets/images/dark_public_notes.png";

export default function DiscussionBoard() {
  const [publicNotes, setPublicNotes] = useState([]);
  const [loadingPublicNotes, setLoadingPublicNotes] = useState(true);
  const [query, setQuery] = useState("");
  const [notesError, setNotesError] = useState("");
  const [shareableNotes, setShareableNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState("");
  const [sharingNote, setSharingNote] = useState(false);
  const [importingNoteId, setImportingNoteId] = useState(null);
  const navigate = useNavigate();

  async function loadPublicNotes() {
    try {
      setNotesError("");
      setLoadingPublicNotes(true);
      const [publicBoardNotes, ownNotesResponse] = await Promise.all([
        fetchPublicBoardNotes(),
        apiFetch("/api/notes"),
      ]);
      const ownNotes = ownNotesResponse ? await ownNotesResponse.json() : [];
      setPublicNotes(publicBoardNotes);
      setShareableNotes(ownNotes);
    } catch (err) {
      setNotesError(err.message);
    } finally {
      setLoadingPublicNotes(false);
    }
  }

  useEffect(() => {
    loadPublicNotes();
  }, []);

  async function handleShareNote() {
    if (!selectedNoteId || sharingNote) {
      return;
    }

    setSharingNote(true);
    setNotesError("");
    try {
      await publishNoteToBoard(selectedNoteId);
      setSelectedNoteId("");
      await loadPublicNotes();
    } catch (err) {
      setNotesError(err.message);
    } finally {
      setSharingNote(false);
    }
  }

  async function handleRemovePublicNote(noteId) {
    setNotesError("");
    try {
      await unpublishNoteFromBoard(noteId);
      await loadPublicNotes();
    } catch (err) {
      setNotesError(err.message);
    }
  }

  async function handleImportPublicNote(noteId) {
    if (importingNoteId) {
      return;
    }

    setImportingNoteId(noteId);
    setNotesError("");
    try {
      await importPublicNote(noteId);
    } catch (err) {
      setNotesError(err.message);
    } finally {
      setImportingNoteId(null);
    }
  }

  function handleViewNote(noteId) {
    navigate(`/public-notes/${noteId}`);
  }

  const filteredPublicNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return publicNotes;
    }
    return publicNotes.filter((note) => (note.title || "").toLowerCase().includes(normalizedQuery));
  }, [publicNotes, query]);

  function getVisibleDescription(note) {
    const description = (note.description || "").trim();
    if (!description) {
      return "";
    }

    const letterCount = Array.from(description).filter((character) => /[A-Za-z]/.test(character)).length;
    return letterCount >= 3 ? description : "";
  }

  return (
    <>
      <Helmet>
        <title>Public Notes</title>
      </Helmet>

      <main className="main main--discussion">
        <section className="discussionTop">
          <div>
            <div className="discussionTitle">
              <div className="notesHeader__icon notesHeader__icon--image" aria-hidden="true">
                <img
                  src={publicNotesLightImage}
                  alt=""
                  className="pageHeader__logo pageHeader__logo--light"
                />
                <img
                  src={publicNotesDarkImage}
                  alt=""
                  className="pageHeader__logo pageHeader__logo--dark"
                />
              </div>
              <h1>Public Notes</h1>
            </div>
            <p className="discussionTop__subtitle">
              Share notes with the community, search by title, and import useful notes into your own workspace.
            </p>
          </div>
        </section>

        <section className="discussionBoardSection">
          <div className="discussionBoardSection__header">
            <div>
              <h2>Share Your Notes</h2>
              <p>Publish one of your notes to the public forum so other students can read and import it.</p>
            </div>
            <div className="discussionBoardSection__actions">
              <select
                className="form-control discussionBoardSection__select"
                value={selectedNoteId}
                onChange={(event) => setSelectedNoteId(event.target.value)}
                disabled={loadingPublicNotes || sharingNote}
              >
                <option value="">Choose one of your notes</option>
                {shareableNotes.map((note) => (
                  <option key={note.id} value={note.id}>
                    {note.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="discussionTop__button"
                onClick={handleShareNote}
                disabled={!selectedNoteId || sharingNote}
              >
                {sharingNote ? "Sharing..." : "Share Note"}
              </button>
            </div>
          </div>

          {notesError && (
            <article className="discussionCard">
              <h2>Error</h2>
              <p className="discussionCard__text">{notesError}</p>
            </article>
          )}
        </section>

        <section className="discussionSearch">
          <label className="discussionSearch__field">
            <span>Search public notes by title</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by note title"
            />
          </label>
        </section>

        <section className="discussionList">
          {loadingPublicNotes && (
            <article className="discussionCard">
              <h2>Loading public notes...</h2>
              <p className="discussionCard__text">Fetching shared notes.</p>
            </article>
          )}

          {!loadingPublicNotes && filteredPublicNotes.length === 0 && !notesError && (
            <article className="discussionCard">
              <h2>{query.trim() ? "No public notes found" : "No public notes yet"}</h2>
              <p className="discussionCard__text">
                {query.trim()
                  ? "Try another title search or clear the search field."
                  : "Share one of your notes above to start the public notes feed."}
              </p>
            </article>
          )}

          {!loadingPublicNotes &&
            filteredPublicNotes.map((note) => {
              const visibleDescription = getVisibleDescription(note);

              return (
                <article key={note.id} className="discussionCard boardNoteCard">
                  <div className="discussionCard__header">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                        note.authorName
                      )}&background=CEE8D7&color=1d5c3a`}
                      alt={note.authorName}
                      className="discussionCard__avatar"
                    />

                    <div className="boardNoteCard__titleWrap">
                      <h2>{note.title}</h2>
                      <p className="discussionCard__author">by {note.authorName}</p>
                      <p className="boardNoteCard__meta">
                        Shared {new Date(note.publishedToBoardAt || note.updatedAt).toLocaleString()}
                      </p>
                      {note.category && <p className="noteDetails__category">{note.category}</p>}
                    </div>
                  </div>

                  {visibleDescription && <p className="discussionCard__text">{visibleDescription}</p>}

                  <div className="discussionCard__footer">
                    <button
                      type="button"
                      onClick={() => handleViewNote(note.id)}
                      className="discussionCard__action"
                    >
                      View Note
                    </button>

                    {note.ownedByCurrentUser ? (
                      <button
                        type="button"
                        onClick={() => handleRemovePublicNote(note.id)}
                        className="discussionCard__action discussionCard__action--danger"
                      >
                        Remove from Public Notes
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleImportPublicNote(note.id)}
                        className="discussionCard__action"
                        disabled={importingNoteId === note.id}
                      >
                        {importingNoteId === note.id ? "Importing..." : "Import to My Notes"}
                      </button>
                    )}
                  </div>

                </article>
              );
            })}
        </section>
      </main>
    </>
  );
}
