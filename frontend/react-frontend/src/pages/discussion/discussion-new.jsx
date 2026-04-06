import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { createDiscussion } from "../../assets/js/api/discussionAPi";

export default function DiscussionNew() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await createDiscussion({ title, description });
      navigate("/discussion-board");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Helmet>
        <title> Create Discussion Board </title>
      </Helmet>

      <main className="main main--discussion">
        <section className="discussionTop">
          <div>
            <div className="discussionTitle">
              <div className="discussionTitle__icon">+</div>
              <h1>New Discussion</h1>
            </div>
            <p className="discussionTop__subtitle">
              Create a discussion post for questions, advice, or conversation.
            </p>
          </div>

          <Link to="/discussion-board" className="discussionTop__button discussionTop__button--link">
            Back to Board
          </Link>
        </section>

        <article className="discussionCard">
          <form id="newDiscussionForm" className="d-grid gap-3" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="discussionTitle" className="form-label">
                Title
              </label>
              <input
                id="discussionTitle"
                name="title"
                type="text"
                className="form-control"
                maxLength="200"
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>

            <div>
              <label htmlFor="discussionDescription" className="form-label">
                Description
              </label>
              <textarea
                id="discussionDescription"
                name="description"
                className="form-control"
                rows="8"
                required
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              ></textarea>
            </div>

            {error && <p className="quizError">{error}</p>}

            <div className="d-flex justify-content-end">
              <button type="submit" className="discussionTop__button" disabled={submitting}>
                {submitting ? "Publishing..." : "Done"}
              </button>
            </div>
          </form>
        </article>
      </main>
    </>
  );
}
