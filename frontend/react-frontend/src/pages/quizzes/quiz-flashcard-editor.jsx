import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { createFlashcardQuiz } from "../../assets/js/api/quizApi";

function blankCard() {
  return { front: "", back: "" };
}

export default function QuizFlashcardEditor() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [cards, setCards] = useState([blankCard(), blankCard(), blankCard()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const quiz = await createFlashcardQuiz({ title, cards });
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
        <title>Build Flashcards</title>
      </Helmet>

      <main className="main main--quizzes">
        <section className="quizzesHeader">
          <div className="quizzesHeader__title">
            <div className="quizzesHeader__icon">F</div>
            <div>
              <h1>Build Flashcards</h1>
              <p>Set the number of cards, then fill out the front and back of each one.</p>
            </div>
          </div>
          <div className="quizEditorActions">
            <Link className="quizActionBtn quizActionBtn--secondary" to="/take-quizzes/create">
              Back
            </Link>
            <button className="quizActionBtn quizActionBtn--primary" type="button" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Deck"}
            </button>
          </div>
        </section>

        <section className="quizEditorPanel">
          <label className="quizField">
            <span>Deck title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Networking Terms" />
          </label>

          {cards.map((card, index) => (
            <article key={index} className="quizEditorQuestion">
              <div className="quizEditorQuestion__top">
                <h2>Card {index + 1}</h2>
                {cards.length > 1 && (
                  <button
                    type="button"
                    className="quizActionBtn quizActionBtn--danger"
                    onClick={() => setCards((prev) => prev.filter((_, i) => i !== index))}
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="quizOptionGrid">
                <label className="quizField">
                  <span>Front</span>
                  <textarea
                    value={card.front}
                    onChange={(e) =>
                      setCards((prev) => prev.map((entry, i) => (i === index ? { ...entry, front: e.target.value } : entry)))
                    }
                    placeholder="Concept or term"
                  />
                </label>

                <label className="quizField">
                  <span>Back</span>
                  <textarea
                    value={card.back}
                    onChange={(e) =>
                      setCards((prev) => prev.map((entry, i) => (i === index ? { ...entry, back: e.target.value } : entry)))
                    }
                    placeholder="Definition or explanation"
                  />
                </label>
              </div>
            </article>
          ))}

          <button
            type="button"
            className="quizActionBtn quizActionBtn--secondary"
            onClick={() => setCards((prev) => [...prev, blankCard()])}
          >
            + Add Card
          </button>

          {error && <p className="quizError">{error}</p>}
        </section>
      </main>
    </>
  );
}
