import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

export default function QuizCreate() {
  return (
    <>
      <Helmet>
        <title>Create Quiz</title>
      </Helmet>

      <main className="main main--quizzes">
        <section className="quizzesHeader">
          <div className="quizzesHeader__title">
            <div className="quizzesHeader__icon">+</div>
            <div>
              <h1>Create Quiz</h1>
              <p>Choose the type of study activity you want to build.</p>
            </div>
          </div>
        </section>

        <section className="quizBuilderGrid">
          <article className="quizBuilderCard">
            <span className="quizCard__tag">Create Quiz with AI</span>
            <h2>Generate from topic, level, and coverage goals</h2>
            <p>Have AI build a ready-to-take quiz or flashcard deck from your study topic.</p>
            <Link className="quizActionBtn quizActionBtn--primary" to="/take-quizzes/create/ai">
              Create Quiz with AI
            </Link>
          </article>

          <article className="quizBuilderCard">
            <span className="quizCard__tag">Test Quiz</span>
            <h2>Multiple choice or written response</h2>
            <p>Create graded quizzes with per-question answer mode.</p>
            <Link className="quizActionBtn quizActionBtn--primary" to="/take-quizzes/create/test">
              Build Test Quiz
            </Link>
          </article>

          <article className="quizBuilderCard">
            <span className="quizCard__tag">Flashcard Quiz</span>
            <h2>Concept on front, definition on back</h2>
            <p>Create study decks that flip like flashcards and mark complete.</p>
            <Link className="quizActionBtn quizActionBtn--primary" to="/take-quizzes/create/flashcards">
              Build Flashcards
            </Link>
          </article>
        </section>
      </main>
    </>
  );
}
