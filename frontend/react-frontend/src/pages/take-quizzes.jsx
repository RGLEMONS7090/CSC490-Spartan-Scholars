import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { deleteQuiz, fetchQuizOverview } from "../assets/js/api/quizApi";

export default function TakeQuizzes() {
  const [overview, setOverview] = useState({
    totalAvailable: 0,
    completedCount: 0,
    averageScore: null,
    quizzes: [],
  });
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    async function loadOverview() {
      try {
        const data = await fetchQuizOverview();
        setOverview(data);
      } catch (err) {
        setError(err.message);
      }
    }

    loadOverview();
  }, []);

  async function handleDeleteQuiz(quizId) {
    const confirmed = window.confirm("Are you sure you want to delete this quiz?");
    if (!confirmed) {
      return;
    }

    setDeletingId(quizId);
    setError("");
    try {
      await deleteQuiz(quizId);
      setOverview((prev) => {
        const quizzes = prev.quizzes.filter((quiz) => quiz.id !== quizId);
        const completedQuizzes = quizzes.filter((quiz) => quiz.completed);
        const scores = quizzes
          .map((quiz) => quiz.latestScore)
          .filter((score) => score != null);

        return {
          totalAvailable: quizzes.length,
          completedCount: completedQuizzes.length,
          averageScore: scores.length
            ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
            : null,
          quizzes,
        };
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <Helmet>
        <title>Quizzes</title>
      </Helmet>

      <main className="main main--quizzes">
        <section className="quizzesHeader">
          <div className="quizzesHeader__title">
            <div className="quizzesHeader__icon">Q</div>
            <div>
              <h1>Take Quizzes</h1>
              <p>Create test quizzes or flashcard quizzes, then take them here.</p>
            </div>
          </div>

          <Link className="quizCreateBtn" to="/take-quizzes/create">
            Create Quiz
          </Link>
        </section>

        <section className="quizStats">
          <article className="quizStatCard">
            <h2>Total Quizzes</h2>
            <div className="quizStatCard__value">{overview.totalAvailable}</div>
            <p>Available to take</p>
          </article>

          <article className="quizStatCard">
            <h2>Completed</h2>
            <div className="quizStatCard__value">{overview.completedCount}</div>
            <p>Quizzes or decks you've finished</p>
          </article>

          <article className="quizStatCard">
            <h2>Average Score</h2>
            <div className="quizStatCard__value">
              {overview.averageScore == null ? "--" : `${overview.averageScore}%`}
            </div>
            <p>Across graded test attempts</p>
          </article>
        </section>

        <section className="quizGrid">
          {overview.quizzes.map((quiz) => (
            <article key={quiz.id} className="quizCard">
              <div className="quizCard__top">
                <span className="quizCard__tag">{quiz.type === "TEST" ? "Test" : "Flashcard"}</span>
                <span className={`quizCard__level ${quiz.type === "TEST" ? "quizCard__level--medium" : "quizCard__level--easy"}`}>
                  {quiz.type === "TEST" ? "Test" : "Flashcard"}
                </span>
              </div>

              <h2>{quiz.title}</h2>

              <p className="quizCard__meta">
                {quiz.itemCount} {quiz.type === "TEST" ? "questions" : "cards"}
              </p>

              {quiz.latestScore != null && (
                <div className="quizCard__scoreRow">
                  <span>Your Score:</span>
                  <strong>{quiz.latestScore}%</strong>
                </div>
              )}

              <div className="quizCard__actions">
                <Link
                  className={`quizActionBtn ${quiz.completed ? "quizActionBtn--secondary" : "quizActionBtn--primary"}`}
                  to={quiz.type === "TEST" ? `/take-quizzes/${quiz.id}` : `/take-quizzes/${quiz.id}/flashcards`}
                >
                  {quiz.completed ? "Retake" : "Start"} {quiz.type === "TEST" ? "Quiz" : "Flashcards"}
                </Link>

                <button
                  type="button"
                  className="quizActionBtn quizActionBtn--danger"
                  onClick={() => handleDeleteQuiz(quiz.id)}
                  disabled={deletingId === quiz.id}
                >
                  {deletingId === quiz.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </article>
          ))}

          {overview.quizzes.length === 0 && (
            <article className="quizBuilderCard">
              <h2>No quizzes yet</h2>
              <p>Create your first test quiz or flashcard set to see it here.</p>
            </article>
          )}
        </section>

        {error && <p className="quizError">{error}</p>}
      </main>
    </>
  );
}
