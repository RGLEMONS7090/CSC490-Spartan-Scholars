import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { createStudyGroup, fetchStudyGroups, joinStudyGroup } from "../assets/js/api/studyGroupsApi";

function formatUpdatedAt(value) {
  if (!value) {
    return "Just now";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default function StudyGroups() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    course: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [joiningId, setJoiningId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadGroups() {
      setLoading(true);
      try {
        const data = await fetchStudyGroups(query);
        setGroups(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadGroups();
  }, [query]);

  async function handleCreate(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const created = await createStudyGroup(form);
      navigate(`/study-groups/${created.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleJoin(group) {
    if (group.joined) {
      navigate(`/study-groups/${group.id}`);
      return;
    }

    setJoiningId(group.id);
    setError("");
    try {
      await joinStudyGroup(group.id);
      navigate(`/study-groups/${group.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setJoiningId(null);
    }
  }

  return (
    <>
      <Helmet>
        <title>Study Groups</title>
      </Helmet>

      <main className="main main--groups">
        <section className="groupsHeader">
          <div className="groupsHeader__title">
            <div className="groupsHeader__icon">G</div>
            <div>
              <h1>Study Groups</h1>
              <p>Find a group by course or topic, join it, and chat with other students.</p>
            </div>
          </div>

          <button type="button" className="groupsHeader__button" onClick={() => setShowCreate((prev) => !prev)}>
            {showCreate ? "Close" : "+ Create Group"}
          </button>
        </section>

        {showCreate && (
          <section className="groupCreatePanel">
            <div className="groupCreatePanel__intro">
              <h2>Create a study group</h2>
              <p>Give students something searchable by name, course, or a short topic description.</p>
            </div>

            <form className="groupCreateForm" onSubmit={handleCreate}>
              <label className="quizField">
                <span>Group name</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Ex: CSC 490 Final Review"
                />
              </label>

              <label className="quizField">
                <span>Course</span>
                <input
                  value={form.course}
                  onChange={(event) => setForm((prev) => ({ ...prev, course: event.target.value }))}
                  placeholder="Ex: CSC 490"
                />
              </label>

              <label className="quizField groupCreateForm__full">
                <span>Description</span>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="What will this group focus on?"
                />
              </label>

              <button className="quizActionBtn quizActionBtn--primary" type="submit" disabled={saving}>
                {saving ? "Creating..." : "Create Group"}
              </button>
            </form>
          </section>
        )}

        <section className="groupSearchBar">
          <label className="quizField groupSearchBar__field">
            <span>Search groups</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by group name, course, or topic"
            />
          </label>
        </section>

        {loading ? (
          <p>Loading groups...</p>
        ) : (
          <section className="groupsGrid">
            {groups.map((group) => (
              <article key={group.id} className="groupCard groupCard--live">
                <div className="groupCard__top">
                  <span className="groupCard__tag">{group.course}</span>
                  <span className="groupCard__metaPill">{group.joined ? "Joined" : "Open"}</span>
                </div>

                <h2>{group.name}</h2>

                <p className="groupCard__text">{group.description || "No description yet."}</p>

                <div className="groupCard__meta groupCard__meta--stacked">
                  <span>{group.memberCount} members</span>
                  <span>Hosted by {group.ownerName}</span>
                  <span>Updated {formatUpdatedAt(group.updatedAt)}</span>
                </div>

                <div className="groupCard__actions">
                  <button
                    type="button"
                    className={`quizActionBtn ${group.joined ? "quizActionBtn--secondary" : "quizActionBtn--primary"}`}
                    onClick={() => handleJoin(group)}
                    disabled={joiningId === group.id}
                  >
                    {joiningId === group.id ? "Opening..." : group.joined ? "Open Group" : "Join Group"}
                  </button>

                  <Link className="quizActionBtn quizActionBtn--secondary" to={`/study-groups/${group.id}`}>
                    View Chat
                  </Link>
                </div>
              </article>
            ))}

            {groups.length === 0 && (
              <article className="groupEmptyState">
                <h2>No groups found</h2>
                <p>Try another search or create the first group for your course.</p>
              </article>
            )}
          </section>
        )}

        {error && <p className="quizError">{error}</p>}
      </main>
    </>
  );
}
