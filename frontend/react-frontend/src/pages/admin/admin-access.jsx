import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { createAdminSession } from "../../assets/js/api/adminApi";
import { beginAdminSession } from "../../assets/js/utils/adminSession";

export default function AdminAccess() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const data = await createAdminSession(password);
      beginAdminSession(data.token);
      navigate("/admin/users", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Admin Access</title>
      </Helmet>

      <main className="main main--profile">
        <section className="profileHeader">
          <div className="profileHeader__title">
            <div className="profileHeader__icon">A</div>
            <div>
              <h1>Admin Access</h1>
              <p>Enter the admin password to open the protected admin view for this session.</p>
            </div>
          </div>
        </section>

        <section className="profilePanel">
          <form className="profileSection" onSubmit={handleSubmit}>
            <label className="quizField">
              <span>Admin Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter admin password"
                autoComplete="current-password"
              />
            </label>
            <div className="profileSection__actions">
              <button className="quizActionBtn quizActionBtn--primary" type="submit" disabled={submitting}>
                {submitting ? "Checking..." : "Enter Admin View"}
              </button>
              <Link className="quizActionBtn quizActionBtn--secondary" to="/profile">
                Back to Profile
              </Link>
            </div>
            {error && <p className="quizError">{error}</p>}
          </form>
        </section>
      </main>
    </>
  );
}
