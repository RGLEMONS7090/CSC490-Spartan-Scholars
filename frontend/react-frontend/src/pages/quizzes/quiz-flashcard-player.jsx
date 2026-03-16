import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { completeFlashcards, fetchQuiz } from "../../assets/js/api/quizApi";

export default function QuizFlashcardPlayer() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadQuiz() {
      try {
        const data = await fetchQuiz(id);
        setQuiz(data);
      } catch (err) {
        setError(err.message);
      }
    }

    loadQuiz();
  }, [id]);

  async function handleComplete() {
    try {
      await completeFlashcards(id);
      setCompleted(true);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!quiz) {
    return <main className="main main--quizzes"><p>{error || "Loading flashcards..."}</p></main>;
  }

  const card = quiz.cards[index];

  return (
    <>
      <Helmet>
        <title>{quiz.title}</title>
      </Helmet>

      <main className="main main--quizzes">
        <section className="quizzesHeader">
          <div className="quizzesHeader__title">
            <div className="quizzesHeader__icon">F</div>
            <div>
              <h1>{quiz.title}</h1>
              <p>Flashcard quiz</p>
            </div>
          </div>
          <Link className="quizActionBtn quizActionBtn--secondary" to="/take-quizzes">
            Back to Quizzes
          </Link>
        </section>

        <section className="quizEditorPanel">
          <article className="flashcardPlayer" onClick={() => setFlipped((prev) => !prev)}>
            <span className="quizCard__tag">
              Card {index + 1} of {quiz.cards.length}
            </span>
            <h2>{flipped ? card.back : card.front}</h2>
            <p>{flipped ? "Back" : "Front"} side. Click to flip.</p>
          </article>

          <div className="quizEditorActions">
            <button
              type="button"
              className="quizActionBtn quizActionBtn--secondary"
              disabled={index === 0}
              onClick={() => {
                setIndex((prev) => prev - 1);
                setFlipped(false);
              }}
            >
              Previous
            </button>
            <button
              type="button"
              className="quizActionBtn quizActionBtn--secondary"
              disabled={index === quiz.cards.length - 1}
              onClick={() => {
                setIndex((prev) => prev + 1);
                setFlipped(false);
              }}
            >
              Next
            </button>
          </div>

          <button type="button" className="quizActionBtn quizActionBtn--primary" onClick={handleComplete}>
            Mark Flashcards Complete
          </button>

          {completed && (
            <article className="quizBuilderCard">
              <h2>Completed</h2>
              <p>This flashcard set is now counted as completed in your quiz stats.</p>
            </article>
          )}

          {error && <p className="quizError">{error}</p>}
        </section>
      </main>
    </>
  );
}
