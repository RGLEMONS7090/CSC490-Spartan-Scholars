import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { createTestQuiz } from "../../assets/js/api/quizApi";

function blankQuestion() {
  return {
    prompt: "",
    writtenResponse: false,
    options: ["", "", "", ""],
    correctAnswer: "",
  };
}

export default function QuizTestEditor() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([blankQuestion()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateQuestion(index, nextQuestion) {
    setQuestions((prev) => prev.map((question, i) => (i === index ? nextQuestion : question)));
  }

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      const quiz = await createTestQuiz({
        title,
        questions,
      });
      navigate(`/take-quizzes/${quiz.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Build Test Quiz</title>
      </Helmet>

      <main className="main main--quizzes">
        <section className="quizzesHeader">
          <div className="quizzesHeader__title">
            <div className="quizzesHeader__icon">T</div>
            <div>
              <h1>Build Test Quiz</h1>
              <p>Create multiple choice or written-response questions.</p>
            </div>
          </div>
          <div className="quizEditorActions">
            <Link className="quizActionBtn quizActionBtn--secondary" to="/take-quizzes/create">
              Back
            </Link>
            <button className="quizActionBtn quizActionBtn--primary" type="button" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Quiz"}
            </button>
          </div>
        </section>

        <section className="quizEditorPanel">
          <label className="quizField">
            <span>Quiz title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Biology Midterm Review" />
          </label>

          {questions.map((question, index) => (
            <article key={index} className="quizEditorQuestion">
              <div className="quizEditorQuestion__top">
                <h2>Question {index + 1}</h2>
                {questions.length > 1 && (
                  <button
                    type="button"
                    className="quizActionBtn quizActionBtn--danger"
                    onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== index))}
                  >
                    Remove
                  </button>
                )}
              </div>

              <label className="quizField">
                <span>Prompt</span>
                <textarea
                  value={question.prompt}
                  onChange={(e) => updateQuestion(index, { ...question, prompt: e.target.value })}
                  placeholder="Type your question"
                />
              </label>

              <label className="quizCheckbox">
                <input
                  type="checkbox"
                  checked={question.writtenResponse}
                  onChange={(e) =>
                    updateQuestion(index, {
                      ...question,
                      writtenResponse: e.target.checked,
                      correctAnswer: "",
                    })
                  }
                />
                Written response only
              </label>

              {question.writtenResponse ? (
                <label className="quizField">
                  <span>Correct answer</span>
                  <input
                    value={question.correctAnswer}
                    onChange={(e) => updateQuestion(index, { ...question, correctAnswer: e.target.value })}
                    placeholder="Type the expected answer"
                  />
                </label>
              ) : (
                <>
                  <div className="quizOptionGrid">
                    {question.options.map((option, optionIndex) => (
                      <label key={optionIndex} className="quizField">
                        <span>Option {optionIndex + 1}</span>
                        <input
                          value={option}
                          onChange={(e) => {
                            const nextOptions = [...question.options];
                            nextOptions[optionIndex] = e.target.value;
                            updateQuestion(index, { ...question, options: nextOptions });
                          }}
                          placeholder={`Choice ${optionIndex + 1}`}
                        />
                      </label>
                    ))}
                  </div>

                  <label className="quizField">
                    <span>Correct answer</span>
                    <select
                      value={question.correctAnswer}
                      onChange={(e) => updateQuestion(index, { ...question, correctAnswer: e.target.value })}
                    >
                      <option value="">Select correct answer</option>
                      {question.options
                        .filter((option) => option.trim())
                        .map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                    </select>
                  </label>
                </>
              )}
            </article>
          ))}

          <button type="button" className="quizActionBtn quizActionBtn--secondary" onClick={() => setQuestions((prev) => [...prev, blankQuestion()])}>
            + Add Question
          </button>

          {error && <p className="quizError">{error}</p>}
        </section>
      </main>
    </>
  );
}
