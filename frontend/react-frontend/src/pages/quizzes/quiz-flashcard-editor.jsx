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
  const [cardCount, setCardCount] = useState(3);
  const [cards, setCards] = useState([blankCard(), blankCard(), blankCard()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function syncCardCount(nextCount) {
    const normalized = Math.max(1, nextCount);
    setCardCount(normalized);
    setCards((prev) => {
      if (prev.length === normalized) {
        return prev;
      }
      if (prev.length < normalized) {
        return [...prev, ...Array.from({ length: normalized - prev.length }, blankCard)];
      }
      return prev.slice(0, normalized);
    });
  }

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
          <div className="quizOptionGrid">
            <label className="quizField">
              <span>Deck title</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Networking Terms" />
            </label>

            <label className="quizField">
              <span>Number of cards</span>
              <input
                type="number"
                min="1"
                value={cardCount}
                onChange={(e) => syncCardCount(Number(e.target.value) || 1)}
              />
            </label>
          </div>

          {cards.map((card, index) => (
            <article key={index} className="quizEditorQuestion">
              <h2>Card {index + 1}</h2>
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

          {error && <p className="quizError">{error}</p>}
        </section>
      </main>
    </>
  );
}
