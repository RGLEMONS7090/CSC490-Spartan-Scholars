import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { apiFetch } from "../../assets/js/api/notesApi";
import { deleteStudyGroup, fetchStudyGroup, importStudyGroupItem, joinStudyGroup, sendStudyGroupMessage, shareStudyGroupItems } from "../../assets/js/api/studyGroupsApi";

const CHAT_POLL_INTERVAL_MS = 2000;

function formatTimestamp(value) {
  if (!value) {
    return "";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function StudyGroupView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [message, setMessage] = useState("");
  const [joining, setJoining] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sharingItems, setSharingItems] = useState(false);
  const [importingItemId, setImportingItemId] = useState(null);
  const [sharePickerOpen, setSharePickerOpen] = useState(false);
  const [shareableNotes, setShareableNotes] = useState([]);
  const [shareableQuizzes, setShareableQuizzes] = useState([]);
  const [selectedNoteIds, setSelectedNoteIds] = useState([]);
  const [selectedQuizIds, setSelectedQuizIds] = useState([]);
  const [error, setError] = useState("");
  const chatFeedRef = useRef(null);
  const latestMessageIdRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadGroup(showError = true) {
      try {
        const data = await fetchStudyGroup(id);
        if (!cancelled) {
          setGroup(data);
          setError("");
        }
      } catch (err) {
        if (!cancelled && showError) {
          setError(err.message);
        }
      }
    }

    loadGroup();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        loadGroup(false);
      }
    }, CHAT_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [id]);

  useEffect(() => {
    if (!group?.messages?.length || !chatFeedRef.current) {
      return;
    }

    const newestMessageId = group.messages[group.messages.length - 1]?.id ?? null;
    if (newestMessageId && newestMessageId !== latestMessageIdRef.current) {
      latestMessageIdRef.current = newestMessageId;
      chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
    }
  }, [group]);

  async function handleJoin() {
    setJoining(true);
    setError("");
    try {
      const data = await joinStudyGroup(id);
      setGroup(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  }

  async function handleSend(event) {
    event.preventDefault();
    setSending(true);
    setError("");
    try {
      const created = await sendStudyGroupMessage(id, message);
      setGroup((prev) => ({ ...prev, messages: [...prev.messages, created] }));
      setMessage("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm("Delete this group? This will remove the chat and all memberships.");
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");
    try {
      await deleteStudyGroup(id);
      navigate("/study-groups");
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  async function openSharePicker() {
    const nextOpen = !sharePickerOpen;
    setSharePickerOpen(nextOpen);
    if (!nextOpen) {
      return;
    }

    try {
      const [notesResponse, quizzesResponse] = await Promise.all([
        apiFetch("/api/notes"),
        apiFetch("/api/quizzes"),
      ]);
      const notes = await notesResponse.json();
      const quizzes = await quizzesResponse.json();
      setShareableNotes(notes);
      setShareableQuizzes(quizzes.quizzes || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleShareItems(event) {
    event.preventDefault();
    setSharingItems(true);
    setError("");
    try {
      const data = await shareStudyGroupItems(id, {
        noteIds: selectedNoteIds,
        quizIds: selectedQuizIds,
      });
      setGroup(data);
      setSelectedNoteIds([]);
      setSelectedQuizIds([]);
      setSharePickerOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSharingItems(false);
    }
  }

  async function handleImportSharedItem(sharedItemId) {
    setImportingItemId(sharedItemId);
    setError("");
    try {
      const data = await importStudyGroupItem(id, sharedItemId);
      setGroup(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setImportingItemId(null);
    }
  }

  function toggleSelection(setter, value) {
    setter((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  if (!group) {
    return <main className="main main--groups"><p>{error || "Loading group..."}</p></main>;
  }

  return (
    <>
      <Helmet>
        <title>{group.name}</title>
      </Helmet>

      <main className="main main--groups">
        <section className="groupsHeader">
          <div className="groupsHeader__title">
            <div className="groupsHeader__icon">G</div>
            <div>
              <h1>{group.name}</h1>
              <p>{group.course} · {group.memberCount} members · Hosted by {group.ownerName}</p>
            </div>
          </div>
          <div className="groupDetail__actions">
            <Link className="quizActionBtn quizActionBtn--secondary" to="/study-groups">
              Back to Groups
            </Link>
            {!group.joined && (
              <button className="quizActionBtn quizActionBtn--primary" type="button" onClick={handleJoin} disabled={joining}>
                {joining ? "Joining..." : "Join Group"}
              </button>
            )}
            {group.owner && (
              <button className="quizActionBtn quizActionBtn--danger" type="button" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete Group"}
              </button>
            )}
          </div>
        </section>

        <section className="groupDetailLayout">
          <aside className="groupDetailCard">
            <span className="groupCard__tag">{group.course}</span>
            <h2>About this group</h2>
            <p>{group.description || "No description yet."}</p>
            <div className="groupDetail__stats">
              <span>{group.memberCount} members</span>
              <span>{group.joined ? "You are a member" : "Join to send messages"}</span>
            </div>
            {group.joined && (
              <div className="groupShareActions">
                <button className="quizActionBtn quizActionBtn--secondary" type="button" onClick={openSharePicker}>
                  {sharePickerOpen ? "Hide Share Picker" : "Share Your Quizzes / Notes to This Group"}
                </button>
              </div>
            )}
            {group.joined && sharePickerOpen && (
              <form className="groupSharePanel" onSubmit={handleShareItems}>
                <div className="groupSharePanel__lists">
                  <div>
                    <h3>My Notes</h3>
                    <div className="groupSharePanel__options">
                      {shareableNotes.map((note) => (
                        <label key={note.id} className="groupShareOption">
                          <input
                            type="checkbox"
                            checked={selectedNoteIds.includes(note.id)}
                            onChange={() => toggleSelection(setSelectedNoteIds, note.id)}
                          />
                          <span>{note.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3>My Quizzes</h3>
                    <div className="groupSharePanel__options">
                      {shareableQuizzes.map((quiz) => (
                        <label key={quiz.id} className="groupShareOption">
                          <input
                            type="checkbox"
                            checked={selectedQuizIds.includes(quiz.id)}
                            onChange={() => toggleSelection(setSelectedQuizIds, quiz.id)}
                          />
                          <span>{quiz.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <button className="quizActionBtn quizActionBtn--primary" type="submit" disabled={sharingItems}>
                  {sharingItems ? "Sharing..." : "Share Selected Items"}
                </button>
              </form>
            )}
          </aside>

          <section className="groupChatCard">
            <div className="groupChatCard__header">
              <h2>Group Chat</h2>
              <p>Use this chatroom to coordinate study sessions and ask quick questions.</p>
            </div>

            {group.joined && (
              <section className="groupSharedLibrary">
                <div className="groupChatCard__header">
                  <h2>Import from Study Group</h2>
                  <p>Browse all notes and quizzes shared to this group and import only what you want.</p>
                </div>
                <div className="groupSharedLibrary__list">
                  {group.sharedItems?.length ? group.sharedItems.map((item) => (
                    <article key={item.id} className="groupSharedItem">
                      <div>
                        <div className="quizCard__tagRow">
                          <span className="quizCard__tag">{item.itemType === "NOTE" ? "Note" : "Quiz"}</span>
                        </div>
                        <h3>{item.title}</h3>
                        <p>Shared by {item.sharedByName}</p>
                      </div>
                      <button
                        className="quizActionBtn quizActionBtn--secondary"
                        type="button"
                        onClick={() => handleImportSharedItem(item.id)}
                        disabled={importingItemId === item.id}
                      >
                        {importingItemId === item.id ? "Importing..." : `Import ${item.itemType === "NOTE" ? "Note" : "Quiz"}`}
                      </button>
                    </article>
                  )) : (
                    <p className="groupChatFeed__empty">No shared notes or quizzes yet.</p>
                  )}
                </div>
              </section>
            )}

            <div className="groupChatFeed" ref={chatFeedRef}>
              {group.messages.length === 0 && (
                <p className="groupChatFeed__empty">No messages yet. Start the conversation.</p>
              )}

              {group.messages.map((entry) => (
                <article key={entry.id} className={`groupMessage ${entry.mine ? "groupMessage--mine" : ""}`}>
                  <div className="groupMessage__meta">
                    <strong>{entry.authorName}</strong>
                    <span>{formatTimestamp(entry.createdAt)}</span>
                  </div>
                  <p>{entry.content}</p>
                </article>
              ))}
            </div>

            <form className="groupChatComposer" onSubmit={handleSend}>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={group.joined ? "Write a message to the group" : "Join this group to participate in chat"}
                disabled={!group.joined || sending}
              />
              <button className="quizActionBtn quizActionBtn--primary" type="submit" disabled={!group.joined || sending}>
                {sending ? "Sending..." : "Send Message"}
              </button>
            </form>

            {error && <p className="quizError">{error}</p>}
          </section>
        </section>
      </main>
    </>
  );
}
