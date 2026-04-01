import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { createQuizShare, deleteQuiz, fetchQuizOverview, importQuizByPassword } from "../assets/js/api/quizApi";


export default function TakeQuizzes() {
  const [overview, setOverview] = useState({
    totalAvailable: 0,
    completedCount: 0,
    averageScore: null,
    quizzes: [],
  });
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [importPassword, setImportPassword] = useState("");
  const [importing, setImporting] = useState(false);

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

  async function handleImportQuiz(event) {
    event.preventDefault();
    setImporting(true);
    setError("");
    try {
      await importQuizByPassword(importPassword.trim());
      setImportPassword("");
      const data = await fetchQuizOverview();
      setOverview(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
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

          <div className="notesHeader__actions">
            <form className="shareToolbar" onSubmit={handleImportQuiz}>
              <input
                className="shareToolbar__input"
                type="text"
                value={importPassword}
                onChange={(event) => setImportPassword(event.target.value)}
                placeholder="Paste quiz password"
              />
              <button className="quizActionBtn quizActionBtn--secondary" type="submit" disabled={importing}>
                {importing ? "Importing..." : "Import Quiz by Password"}
              </button>
            </form>
            <Link className="quizCreateBtn" to="/take-quizzes/create">
              Create Quiz
            </Link>
          </div>
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
            <QuizCard key={quiz.id} quiz={quiz} deletingId={deletingId} onDelete={handleDeleteQuiz} />
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

function QuizCard({ quiz, deletingId, onDelete }) {
  const [sharing, setSharing] = useState(false);
  const [sharePassword, setSharePassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function handleShare() {
    setSharing(true);
    setError("");
    try {
      const data = await createQuizShare(quiz.id);
      setSharePassword(data.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setSharing(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(sharePassword);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <article className="quizCard">
      <div className="quizCard__top">
        <div className="quizCard__tagRow">
          <span className="quizCard__tag">{quiz.type === "TEST" ? "Test" : "Flashcard"}</span>
          {quiz.imported && <span className="sharePill">Imported</span>}
        </div>
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

      {sharePassword && (
        <div className="sharePanel">
          <span className="sharePanel__label">Share password</span>
          <div className="sharePanel__row">
            <code className="sharePanel__code">{sharePassword}</code>
            <button className="quizActionBtn quizActionBtn--secondary" type="button" onClick={handleCopy}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="quizError">{error}</p>}

      <div className="quizCard__actions">
        <div className="quizCard__actionsMain">
          <Link
            className={`quizActionBtn ${quiz.completed ? "quizActionBtn--secondary" : "quizActionBtn--primary"}`}
            to={quiz.type === "TEST" ? `/take-quizzes/${quiz.id}` : `/take-quizzes/${quiz.id}/flashcards`}
          >
            {quiz.completed ? "Retake" : "Start"} {quiz.type === "TEST" ? "Quiz" : "Flashcards"}
          </Link>

          <button type="button" className="quizActionBtn quizActionBtn--secondary" onClick={handleShare} disabled={sharing}>
            {sharing ? "Sharing..." : "Share Quiz"}
          </button>
        </div>

        <button
          type="button"
          className="quizActionBtn quizActionBtn--danger quizCard__deleteBtn"
          onClick={() => onDelete(quiz.id)}
          disabled={deletingId === quiz.id}
        >
          {deletingId === quiz.id ? "Deleting..." : "Delete"}
        </button>
      </div>
    </article>
  );
}
