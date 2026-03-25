import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { deleteAdminUser, fetchAdminUsers } from "../../assets/js/api/adminApi";

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingUserId, setDeletingUserId] = useState(null);

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await fetchAdminUsers();
        setUsers(data);
      } catch (err) {
        setError(err.message);
        if (err.message.toLowerCase().includes("admin")) {
          navigate("/profile", { replace: true });
        }
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, [navigate]);

  async function handleDeleteUser(user) {
    const confirmed = window.confirm(`Delete ${user.name} and all of their implementations?`);
    if (!confirmed) {
      return;
    }

    setDeletingUserId(user.id);
    setError("");
    try {
      await deleteAdminUser(user.id);
      setUsers((current) => current.filter((entry) => entry.id !== user.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingUserId(null);
    }
  }

  return (
    <>
      <Helmet>
        <title>Admin View</title>
      </Helmet>

      <main className="main main--profile">
        <section className="profileHeader">
          <div className="profileHeader__title">
            <div className="profileHeader__icon">A</div>
            <div>
              <h1>Admin View</h1>
              <p>Review every user and open a dedicated page for their quizzes, discussions, and notes.</p>
            </div>
          </div>
        </section>

        {loading ? (
          <p>Loading users...</p>
        ) : (
          <section className="adminGrid">
            {users.map((user) => (
              <article className="adminCard" key={user.id}>
                <div className="adminCard__header">
                  <div>
                    <h2>{user.name}</h2>
                    <p>{user.email}</p>
                  </div>
                  <span className="adminCountPill">{user.noteCount + user.quizCount + user.discussionCount} items</span>
                </div>
                <div className="adminMetaRow">
                  <span>Notes: {user.noteCount}</span>
                  <span>Quizzes: {user.quizCount}</span>
                  <span>Discussions: {user.discussionCount}</span>
                </div>
                <div className="profileSection__actions">
                  <Link className="quizActionBtn quizActionBtn--primary" to={`/admin/users/${user.id}`}>
                    View Implementations
                  </Link>
                  <button
                    className="quizActionBtn quizActionBtn--danger"
                    type="button"
                    onClick={() => handleDeleteUser(user)}
                    disabled={deletingUserId === user.id}
                  >
                    {deletingUserId === user.id ? "Deleting..." : "Delete User"}
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}

        {!loading && users.length === 0 && <p>No users found.</p>}
        {error && <p className="quizError">{error}</p>}
      </main>
    </>
  );
}
