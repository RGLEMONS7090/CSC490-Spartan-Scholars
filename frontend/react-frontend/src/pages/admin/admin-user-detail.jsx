import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  deleteAdminDiscussion,
  deleteAdminNote,
  deleteAdminQuiz,
  fetchAdminUserImplementations,
} from "../../assets/js/api/adminApi";

function formatDate(value) {
  if (!value) {
    return "Unknown";
  }
  return new Date(value).toLocaleString();
}

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeDelete, setActiveDelete] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetchAdminUserImplementations(id);
        setData(response);
      } catch (err) {
        setError(err.message);
        if (err.message.toLowerCase().includes("admin")) {
          navigate("/profile", { replace: true });
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, navigate]);

  async function handleDelete(kind, itemId) {
    if (!data) {
      return;
    }

    const confirmed = window.confirm(`Delete this ${kind.slice(0, -1)}?`);
    if (!confirmed) {
      return;
    }

    const deleteKey = `${kind}-${itemId}`;
    setActiveDelete(deleteKey);
    setError("");
    try {
      if (kind === "notes") {
        await deleteAdminNote(data.id, itemId);
        setData((current) => ({ ...current, notes: current.notes.filter((item) => item.id !== itemId) }));
      } else if (kind === "quizzes") {
        await deleteAdminQuiz(data.id, itemId);
        setData((current) => ({ ...current, quizzes: current.quizzes.filter((item) => item.id !== itemId) }));
      } else {
        await deleteAdminDiscussion(data.id, itemId);
        setData((current) => ({ ...current, discussions: current.discussions.filter((item) => item.id !== itemId) }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActiveDelete("");
    }
  }

  return (
    <>
      <Helmet>
        <title>Admin User Detail</title>
      </Helmet>

      <main className="main main--profile">
        <section className="profileHeader">
          <div className="profileHeader__title">
            <div className="profileHeader__icon">A</div>
            <div>
              <h1>{loading ? "Loading..." : data?.name}</h1>
              <p>{loading ? "Fetching implementations..." : data?.email}</p>
            </div>
          </div>
        </section>

        <div className="profileSection__actions adminBackRow">
          <Link className="quizActionBtn quizActionBtn--secondary" to="/admin/users">
            Back to Users
          </Link>
        </div>

        {loading ? (
          <p>Loading implementations...</p>
        ) : (
          <section className="adminImplementationGrid">
            <section className="adminCard">
              <div className="adminCard__header">
                <h2>Notes</h2>
                <span className="adminCountPill">{data.notes.length}</span>
              </div>
              <div className="adminItemList">
                {data.notes.map((note) => (
                  <article className="adminItemCard" key={note.id}>
                    <div>
                      <h3>{note.title}</h3>
                      <p>{note.category || "Uncategorized"}</p>
                      <p>{note.preview || "No preview available."}</p>
                      <small>Updated {formatDate(note.updatedAt)}</small>
                    </div>
                    <button
                      className="quizActionBtn quizActionBtn--danger"
                      type="button"
                      onClick={() => handleDelete("notes", note.id)}
                      disabled={activeDelete === `notes-${note.id}`}
                    >
                      {activeDelete === `notes-${note.id}` ? "Deleting..." : "Delete"}
                    </button>
                  </article>
                ))}
                {data.notes.length === 0 && <p>No notes.</p>}
              </div>
            </section>

            <section className="adminCard">
              <div className="adminCard__header">
                <h2>Quizzes</h2>
                <span className="adminCountPill">{data.quizzes.length}</span>
              </div>
              <div className="adminItemList">
                {data.quizzes.map((quiz) => (
                  <article className="adminItemCard" key={quiz.id}>
                    <div>
                      <h3>{quiz.title}</h3>
                      <p>{quiz.type} quiz</p>
                      <p>{quiz.itemCount} items</p>
                      <small>Updated {formatDate(quiz.updatedAt)}</small>
                    </div>
                    <button
                      className="quizActionBtn quizActionBtn--danger"
                      type="button"
                      onClick={() => handleDelete("quizzes", quiz.id)}
                      disabled={activeDelete === `quizzes-${quiz.id}`}
                    >
                      {activeDelete === `quizzes-${quiz.id}` ? "Deleting..." : "Delete"}
                    </button>
                  </article>
                ))}
                {data.quizzes.length === 0 && <p>No quizzes.</p>}
              </div>
            </section>

            <section className="adminCard adminCard--full">
              <div className="adminCard__header">
                <h2>Discussions</h2>
                <span className="adminCountPill">{data.discussions.length}</span>
              </div>
              <div className="adminItemList">
                {data.discussions.map((discussion) => (
                  <article className="adminItemCard" key={discussion.id}>
                    <div>
                      <h3>{discussion.title}</h3>
                      <p>{discussion.description || "No description."}</p>
                      <small>Updated {formatDate(discussion.updatedAt)}</small>
                    </div>
                    <button
                      className="quizActionBtn quizActionBtn--danger"
                      type="button"
                      onClick={() => handleDelete("discussions", discussion.id)}
                      disabled={activeDelete === `discussions-${discussion.id}`}
                    >
                      {activeDelete === `discussions-${discussion.id}` ? "Deleting..." : "Delete"}
                    </button>
                  </article>
                ))}
                {data.discussions.length === 0 && <p>No discussions.</p>}
              </div>
            </section>
          </section>
        )}

        {error && <p className="quizError">{error}</p>}
      </main>
    </>
  );
}
