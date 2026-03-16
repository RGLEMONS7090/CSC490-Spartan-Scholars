import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { deleteStudyGroup, fetchStudyGroup, joinStudyGroup, sendStudyGroupMessage } from "../../assets/js/api/studyGroupsApi";

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
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadGroup() {
      try {
        const data = await fetchStudyGroup(id);
        setGroup(data);
      } catch (err) {
        setError(err.message);
      }
    }

    loadGroup();
  }, [id]);

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
          </aside>

          <section className="groupChatCard">
            <div className="groupChatCard__header">
              <h2>Group Chat</h2>
              <p>Use this chatroom to coordinate study sessions and ask quick questions.</p>
            </div>

            <div className="groupChatFeed">
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
