import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { fetchDiscussions } from "../assets/js/api/discussionAPi";
import {
  apiFetch,
  fetchPublicBoardNotes,
  publishNoteToBoard,
  unpublishNoteFromBoard,
} from "../assets/js/api/notesApi";
import discussionLightImage from "../assets/images/light_dicsussion.png";
import discussionDarkImage from "../assets/images/dark_mode_dicsussion.png";

export default function DiscussionBoard() {
  const [discussions, setDiscussions] = useState([]);
  const [publicNotes, setPublicNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPublicNotes, setLoadingPublicNotes] = useState(true);
  const [sort, setSort] = useState("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [notesError, setNotesError] = useState("");
  const [shareableNotes, setShareableNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState("");
  const [sharingNote, setSharingNote] = useState(false);
  const navigate = useNavigate();

  const [cache, setCache] = useState({
    all: null,
    trending: null,
    recent: null,
  });

  async function loadDiscussions(sortType = "all", searchQuery = "") {
    try {
      setError("");
      const normalizedQuery = searchQuery.trim();

      if (!normalizedQuery && cache[sortType]) {
        setDiscussions(cache[sortType]);
        setLoading(false);
        return;
      } else {
        setLoading(true);
      }

      const data = await fetchDiscussions(sortType, normalizedQuery);
      if (!normalizedQuery) {
        setCache((prev) => ({ ...prev, [sortType]: data }));
      }
      setDiscussions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

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
    loadDiscussions("all");
  }, []);

  useEffect(() => {
    loadPublicNotes();
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadDiscussions(sort, query);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [sort, query]);

  function handleOpenDiscussion(id) {
    navigate(`/discussion-board/${id}`);
  }

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

  return (
    <>
      <Helmet>
        <title> Discussion Board </title>
      </Helmet>

      <main className="main main--discussion">
        <section className="discussionTop">
          <div>
            <div className="discussionTitle">
              <div className="discussionTitle__icon" aria-hidden="true">
                <img
                  src={discussionLightImage}
                  alt=""
                  className="discussionTitle__iconImage discussionTitle__iconImage--light"
                />
                <img
                  src={discussionDarkImage}
                  alt=""
                  className="discussionTitle__iconImage discussionTitle__iconImage--dark"
                />
              </div>
              <h1>Discussion Board</h1>
            </div>
            <p className="discussionTop__subtitle">
              Discussions stay conversational. Public notes live in their own section below.
            </p>
          </div>

          <Link to="/discussion-board/new" className="discussionTop__button discussionTop__button--link">
            + New Discussion
          </Link>
        </section>

        <section className="discussionBoardSection">
          <div className="discussionBoardSection__header">
            <div>
              <h2>Public Notes</h2>
              <p>Share full notes separately from discussion posts while keeping the note layout and attachments.</p>
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

          <div className="boardNoteList">
            {loadingPublicNotes && (
              <article className="discussionCard">
                <h2>Loading public notes...</h2>
                <p className="discussionCard__text">Fetching shared notes.</p>
              </article>
            )}

            {!loadingPublicNotes && publicNotes.length === 0 && !notesError && (
              <article className="discussionCard">
                <h2>No public notes yet</h2>
                <p className="discussionCard__text">Share one of your notes above to start the public notes feed.</p>
              </article>
            )}

            {!loadingPublicNotes && publicNotes.map((note) => (
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

                <div className="boardNoteCard__content">
                  {(note.content || "").split("\n").map((line, index) => (
                    <p key={`${note.id}-${index}`}>{line || "\u00A0"}</p>
                  ))}
                </div>

                {note.fileName && (
                  <div className="noteDetail__attachments">
                    <h3>Attachment</h3>
                    <a
                      href={`/api/notes/${note.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="noteDetail__downloadLink"
                    >
                      {note.fileName}
                    </a>

                    {note.fileContentType?.startsWith("image/") && (
                      <img
                        src={`/api/notes/${note.id}/preview`}
                        alt={note.fileName}
                        className="noteDetail__imagePreview"
                      />
                    )}

                    {note.fileContentType === "application/pdf" && (
                      <iframe
                        src={`/api/notes/${note.id}/preview`}
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

                {note.ownedByCurrentUser && (
                  <div className="discussionCard__footer">
                    <button
                      type="button"
                      onClick={() => handleRemovePublicNote(note.id)}
                      className="discussionCard__action discussionCard__action--danger"
                    >
                      Remove from Public Notes
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="discussionFilters">
          {["all", "trending", "recent"].map((type) => (
            <button
              key={type}
              type="button"
              className={`discussionFilters__chip ${
                sort === type ? "discussionFilters__chip--active" : ""
              }`}
              onClick={() => {
                setSort(type);
              }}
            >
              {type === "all"
                ? "All Discussions"
                : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </section>

        <section className="discussionSearch">
          <label className="discussionSearch__field">
            <span>Search discussions</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title or description"
            />
          </label>
        </section>

        <section className="discussionList">
          {loading && !cache[sort] && (
            <article className="discussionCard">
              <h2>Loading discussions...</h2>
              <p className="discussionCard__text">Fetching current posts.</p>
            </article>
          )}

          {error && (
            <article className="discussionCard">
              <h2>Error</h2>
              <p className="discussionCard__text">{error}</p>
            </article>
          )}

          {!loading && discussions.length === 0 && (
            <article className="discussionCard">
              <h2>{query.trim() ? "No discussions found" : "No discussions yet"}</h2>
              <p className="discussionCard__text">
                {query.trim()
                  ? "Try another search or clear the search field."
                  : "Start the discussion with the + New Discussion button."}
              </p>
            </article>
          )}

          {!loading &&
            discussions.map((discussion) => (
              <article key={discussion.id} className="discussionCard">
                <div className="discussionCard__header">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      discussion.authorName
                    )}&background=9CC4FF&color=#1d4fae`}
                    alt={discussion.authorName}
                    className="discussionCard__avatar"
                  />

                  <div>
                    <h2>{discussion.title}</h2>
                    <p className="discussionCard__author">by {discussion.authorName}</p>
                  </div>
                </div>

                <p className="discussionCard__text">{discussion.description}</p>

                <div className="discussionCard__footer">
                  <div className="discussionCard__stats discussionCard__meta">
                    <span>{discussion.likeCount} likes</span>
                    <span>{discussion.commentCount} comments</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenDiscussion(discussion.id)}
                    className="discussionCard__action"
                  >
                    View Discussion
                  </button>
                </div>
              </article>
            ))}
        </section>
      </main>
    </>
  );
}
