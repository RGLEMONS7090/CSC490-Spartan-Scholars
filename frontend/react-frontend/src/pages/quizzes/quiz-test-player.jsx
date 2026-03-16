import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { fetchQuiz, submitQuiz } from "../../assets/js/api/quizApi";

export default function QuizTestPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadQuiz() {
      try {
        const data = await fetchQuiz(id);
        if (data.type !== "TEST") {
          navigate(`/take-quizzes/${id}/flashcards`, { replace: true });
          return;
        }
        setQuiz(data);
        setAnswers(Array.from({ length: data.questions.length }, () => ""));
      } catch (err) {
        setError(err.message);
      }
    }

    loadQuiz();
  }, [id, navigate]);

  async function handleSubmit() {
    try {
      const submission = await submitQuiz(id, answers);
      setResult(submission);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!quiz) {
    return <main className="main main--quizzes"><p>{error || "Loading quiz..."}</p></main>;
  }

  return (
    <>
      <Helmet>
        <title>{quiz.title}</title>
      </Helmet>

      <main className="main main--quizzes">
        <section className="quizzesHeader">
          <div className="quizzesHeader__title">
            <div className="quizzesHeader__icon">T</div>
            <div>
              <h1>{quiz.title}</h1>
              <p>Test quiz</p>
            </div>
          </div>
          <Link className="quizActionBtn quizActionBtn--secondary" to="/take-quizzes">
            Back to Quizzes
          </Link>
        </section>

        <section className="quizEditorPanel">
          {quiz.questions.map((question, index) => (
            <article key={question.id} className="quizEditorQuestion">
              <h2>Question {index + 1}</h2>
              <p>{question.prompt}</p>

              {question.responseType === "WRITTEN" ? (
                <textarea
                  value={answers[index] || ""}
                  onChange={(e) => setAnswers((prev) => prev.map((value, i) => (i === index ? e.target.value : value)))}
                  placeholder="Type your answer"
                />
              ) : (
                <div className="quizChoiceList">
                  {question.options.map((option) => (
                    <label key={option} className="quizChoice">
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        checked={answers[index] === option}
                        onChange={() => setAnswers((prev) => prev.map((value, i) => (i === index ? option : value)))}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              )}
            </article>
          ))}

          <button type="button" className="quizActionBtn quizActionBtn--primary" onClick={handleSubmit}>
            Submit Quiz
          </button>

          {result && (
            <article className="quizBuilderCard">
              <h2>Result</h2>
              <p>
                Score: <strong>{result.score}%</strong>
              </p>
              <p>
                Correct answers: {result.correctAnswers} / {result.totalQuestions}
              </p>
            </article>
          )}

          {error && <p className="quizError">{error}</p>}
        </section>
      </main>
    </>
  );
}
